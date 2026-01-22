use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug)]
pub enum SnowflakeError {
    ClockMovedBackwards,
    InvalidMachineId,
    InvalidDatacenterId,
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

pub struct SnowflakeIdGenerator {
    datacenter_id: i64,
    machine_id: i64,
    sequence: i64,
    last_timestamp: i64,
    epoch: i64,
}

impl SnowflakeIdGenerator {
    const TIMESTAMP_BITS: i64 = 41;
    const DATACENTER_ID_BITS: i64 = 5;
    const MACHINE_ID_BITS: i64 = 5;
    const SEQUENCE_BITS: i64 = 12;
    const MAX_DATACENTER_ID: i64 = (1 << Self::DATACENTER_ID_BITS) - 1;
    const MAX_MACHINE_ID: i64 = (1 << Self::MACHINE_ID_BITS) - 1;
    const MAX_SEQUENCE: i64 = (1 << Self::SEQUENCE_BITS) - 1;
    const MACHINE_ID_SHIFT: i64 = Self::SEQUENCE_BITS;
    const DATACENTER_ID_SHIFT: i64 = Self::SEQUENCE_BITS + Self::MACHINE_ID_BITS;
    const TIMESTAMP_SHIFT: i64 =
        Self::SEQUENCE_BITS + Self::MACHINE_ID_BITS + Self::DATACENTER_ID_BITS;
    const DEFAULT_EPOCH: i64 = 1577836800000;

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

    pub fn with_epoch(
        datacenter_id: i64,
        machine_id: i64,
        epoch: i64,
    ) -> Result<Self, SnowflakeError> {
        let mut generator = Self::new(datacenter_id, machine_id)?;
        generator.epoch = epoch;
        Ok(generator)
    }

    pub fn real_time_generate(&mut self) -> Result<i64, SnowflakeError> {
        let mut timestamp = self.current_timestamp();

        if timestamp < self.last_timestamp {
            return Err(SnowflakeError::ClockMovedBackwards);
        }

        if timestamp == self.last_timestamp {
            self.sequence = (self.sequence + 1) & Self::MAX_SEQUENCE;
            if self.sequence == 0 {
                timestamp = self.wait_next_millis(self.last_timestamp);
            }
        } else {
            self.sequence = 0;
        }

        self.last_timestamp = timestamp;

        let id = ((timestamp - self.epoch) << Self::TIMESTAMP_SHIFT)
            | (self.datacenter_id << Self::DATACENTER_ID_SHIFT)
            | (self.machine_id << Self::MACHINE_ID_SHIFT)
            | self.sequence;

        Ok(id)
    }

    fn current_timestamp(&self) -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64
    }

    fn wait_next_millis(&self, last_timestamp: i64) -> i64 {
        let mut timestamp = self.current_timestamp();
        while timestamp <= last_timestamp {
            timestamp = self.current_timestamp();
        }
        timestamp
    }

    pub fn parse_id(id: i64) -> (i64, i64, i64, i64) {
        let timestamp = (id >> Self::TIMESTAMP_SHIFT) + Self::DEFAULT_EPOCH;
        let datacenter_id = (id >> Self::DATACENTER_ID_SHIFT) & Self::MAX_DATACENTER_ID;
        let machine_id = (id >> Self::MACHINE_ID_SHIFT) & Self::MAX_MACHINE_ID;
        let sequence = id & Self::MAX_SEQUENCE;

        (timestamp, datacenter_id, machine_id, sequence)
    }
}

pub struct SnowflakeIdBucket {
    generator: Mutex<SnowflakeIdGenerator>,
}

impl SnowflakeIdBucket {
    pub fn new(datacenter_id: i64, machine_id: i64) -> Result<Self, SnowflakeError> {
        let generator = SnowflakeIdGenerator::new(datacenter_id, machine_id)?;
        Ok(Self {
            generator: Mutex::new(generator),
        })
    }

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

    pub fn get_id(&self) -> Result<i64, SnowflakeError> {
        let mut generator = self.generator.lock().unwrap();
        generator.real_time_generate()
    }

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
        let mut sorted_ids = ids.clone();
        sorted_ids.sort();
        sorted_ids.dedup();
        assert_eq!(ids.len(), sorted_ids.len());
    }
}
