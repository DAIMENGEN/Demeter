use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

/// Snowflake ID 生成器错误类型
#[derive(Debug)]
pub enum SnowflakeError {
    ClockMovedBackwards,      // 时钟回拨
    InvalidMachineId,         // 无效的机器ID
    InvalidDatacenterId,      // 无效的数据中心ID
}

impl std::fmt::Display for SnowflakeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SnowflakeError::ClockMovedBackwards => write!(f, "Clock moved backwards"),
            SnowflakeError::InvalidMachineId => write!(f, "Invalid machine ID"),
            SnowflakeError::InvalidDatacenterId => write!(f, "Invalid datacenter ID"),
        }
    }
}

impl std::error::Error for SnowflakeError {}

/// Snowflake ID 生成器
///
/// 64位ID结构：
/// - 1位：符号位（始终为0）
/// - 41位：时间戳（毫秒）
/// - 5位：数据中心ID
/// - 5位：机器ID
/// - 12位：序列号
pub struct SnowflakeIdGenerator {
    datacenter_id: i64,
    machine_id: i64,
    sequence: i64,
    last_timestamp: i64,
    epoch: i64,
}

impl SnowflakeIdGenerator {
    // 时间戳占用的位数
    const TIMESTAMP_BITS: i64 = 41;
    // 数据中心ID占用的位数
    const DATACENTER_ID_BITS: i64 = 5;
    // 机器ID占用的位数
    const MACHINE_ID_BITS: i64 = 5;
    // 序列号占用的位数
    const SEQUENCE_BITS: i64 = 12;

    // 最大数据中心ID
    const MAX_DATACENTER_ID: i64 = (1 << Self::DATACENTER_ID_BITS) - 1;
    // 最大机器ID
    const MAX_MACHINE_ID: i64 = (1 << Self::MACHINE_ID_BITS) - 1;
    // 最大序列号
    const MAX_SEQUENCE: i64 = (1 << Self::SEQUENCE_BITS) - 1;

    // 机器ID左移位数
    const MACHINE_ID_SHIFT: i64 = Self::SEQUENCE_BITS;
    // 数据中心ID左移位数
    const DATACENTER_ID_SHIFT: i64 = Self::SEQUENCE_BITS + Self::MACHINE_ID_BITS;
    // 时间戳左移位数
    const TIMESTAMP_SHIFT: i64 =
        Self::SEQUENCE_BITS + Self::MACHINE_ID_BITS + Self::DATACENTER_ID_BITS;

    // 默认起始时间戳（2020-01-01 00:00:00 UTC）
    const DEFAULT_EPOCH: i64 = 1577836800000;

    /// 创建新的 Snowflake ID 生成器
    ///
    /// # 参数
    /// * `datacenter_id` - 数据中心ID（0-31）
    /// * `machine_id` - 机器ID（0-31）
    pub fn new(datacenter_id: i64, machine_id: i64) -> Result<Self, SnowflakeError> {
        if datacenter_id > Self::MAX_DATACENTER_ID || datacenter_id < 0 {
            return Err(SnowflakeError::InvalidDatacenterId);
        }
        if machine_id > Self::MAX_MACHINE_ID || machine_id < 0 {
            return Err(SnowflakeError::InvalidMachineId);
        }

        Ok(Self {
            datacenter_id,
            machine_id,
            sequence: 0,
            last_timestamp: -1,
            epoch: Self::DEFAULT_EPOCH,
        })
    }

    /// 使用自定义起始时间戳创建 Snowflake ID 生成器
    pub fn with_epoch(
        datacenter_id: i64,
        machine_id: i64,
        epoch: i64,
    ) -> Result<Self, SnowflakeError> {
        let mut generator = Self::new(datacenter_id, machine_id)?;
        generator.epoch = epoch;
        Ok(generator)
    }

    /// 生成下一个ID（实时）
    pub fn real_time_generate(&mut self) -> Result<i64, SnowflakeError> {
        let mut timestamp = self.current_timestamp();

        // 检测时钟回拨
        if timestamp < self.last_timestamp {
            return Err(SnowflakeError::ClockMovedBackwards);
        }

        if timestamp == self.last_timestamp {
            // 同一毫秒内，序列号自增
            self.sequence = (self.sequence + 1) & Self::MAX_SEQUENCE;
            if self.sequence == 0 {
                // 序列号溢出，等待下一毫秒
                timestamp = self.wait_next_millis(self.last_timestamp);
            }
        } else {
            // 不同毫秒，重置序列号
            self.sequence = 0;
        }

        self.last_timestamp = timestamp;

        // 组装ID
        let id = ((timestamp - self.epoch) << Self::TIMESTAMP_SHIFT)
            | (self.datacenter_id << Self::DATACENTER_ID_SHIFT)
            | (self.machine_id << Self::MACHINE_ID_SHIFT)
            | self.sequence;

        Ok(id)
    }

    /// 获取当前时间戳（毫秒）
    fn current_timestamp(&self) -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64
    }

    /// 等待直到下一毫秒
    fn wait_next_millis(&self, last_timestamp: i64) -> i64 {
        let mut timestamp = self.current_timestamp();
        while timestamp <= last_timestamp {
            timestamp = self.current_timestamp();
        }
        timestamp
    }

    /// 解析 Snowflake ID
    pub fn parse_id(id: i64) -> (i64, i64, i64, i64) {
        let timestamp = (id >> Self::TIMESTAMP_SHIFT) + Self::DEFAULT_EPOCH;
        let datacenter_id = (id >> Self::DATACENTER_ID_SHIFT) & Self::MAX_DATACENTER_ID;
        let machine_id = (id >> Self::MACHINE_ID_SHIFT) & Self::MAX_MACHINE_ID;
        let sequence = id & Self::MAX_SEQUENCE;

        (timestamp, datacenter_id, machine_id, sequence)
    }
}

/// Snowflake ID 池（线程安全版本）
///
/// 内部通过互斥锁保护生成器，适用于多线程环境
pub struct SnowflakeIdBucket {
    generator: Mutex<SnowflakeIdGenerator>,
}

impl SnowflakeIdBucket {
    /// 创建新的 Snowflake ID 池
    ///
    /// # 参数
    /// * `datacenter_id` - 数据中心ID（0-31）
    /// * `machine_id` - 机器ID（0-31）
    pub fn new(datacenter_id: i64, machine_id: i64) -> Result<Self, SnowflakeError> {
        let generator = SnowflakeIdGenerator::new(datacenter_id, machine_id)?;
        Ok(Self {
            generator: Mutex::new(generator),
        })
    }

    /// 使用自定义起始时间戳创建 Snowflake ID 池
    pub fn with_epoch(
        datacenter_id: i64,
        machine_id: i64,
        epoch: i64,
    ) -> Result<Self, SnowflakeError> {
        let generator = SnowflakeIdGenerator::with_epoch(datacenter_id, machine_id, epoch)?;
        Ok(Self {
            generator: Mutex::new(generator),
        })
    }

    /// 获取下一个ID
    pub fn get_id(&self) -> Result<i64, SnowflakeError> {
        let mut generator = self.generator.lock().unwrap();
        generator.real_time_generate()
    }

    /// 解析 Snowflake ID
    pub fn parse_id(id: i64) -> (i64, i64, i64, i64) {
        SnowflakeIdGenerator::parse_id(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_snowflake_generator() {
        let mut generator = SnowflakeIdGenerator::new(1, 1).unwrap();
        let id1 = generator.real_time_generate().unwrap();
        let id2 = generator.real_time_generate().unwrap();

        assert!(id2 > id1);
        println!("Generated ID 1: {}", id1);
        println!("Generated ID 2: {}", id2);
    }

    #[test]
    fn test_snowflake_bucket() {
        let bucket = SnowflakeIdBucket::new(1, 1).unwrap();
        let id1 = bucket.get_id().unwrap();
        let id2 = bucket.get_id().unwrap();

        assert!(id2 > id1);
        println!("Bucket ID 1: {}", id1);
        println!("Bucket ID 2: {}", id2);
    }

    #[test]
    fn test_parse_id() {
        let mut generator = SnowflakeIdGenerator::new(5, 10).unwrap();
        let id = generator.real_time_generate().unwrap();

        let (timestamp, datacenter_id, machine_id, sequence) = SnowflakeIdGenerator::parse_id(id);

        println!("ID: {}", id);
        println!("Timestamp: {}", timestamp);
        println!("Datacenter ID: {}", datacenter_id);
        println!("Machine ID: {}", machine_id);
        println!("Sequence: {}", sequence);

        assert_eq!(datacenter_id, 5);
        assert_eq!(machine_id, 10);
    }

    #[test]
    fn test_invalid_ids() {
        let result = SnowflakeIdGenerator::new(32, 1);
        assert!(result.is_err());

        let result = SnowflakeIdGenerator::new(1, 32);
        assert!(result.is_err());
    }

    #[test]
    fn test_multiple_ids() {
        let mut generator = SnowflakeIdGenerator::new(1, 1).unwrap();
        let mut ids = Vec::new();
        for _ in 0..1000 {
            let id = generator.real_time_generate().unwrap();
            ids.push(id);
        }
        // 验证所有ID唯一
        let mut sorted_ids = ids.clone();
        sorted_ids.sort();
        sorted_ids.dedup();
        assert_eq!(ids.len(), sorted_ids.len());
    }
}
