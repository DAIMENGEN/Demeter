# Snowflake ID Generator

雪花算法 ID 生成器模块，用于生成全局唯一的分布式 ID。

## 功能特性

- **SnowflakeIdGenerator**: 基础雪花算法生成器，适用于单线程场景
- **SnowflakeIdBucket**: 线程安全的雪花算法生成器，使用互斥锁保护，适用于多线程场景

## ID 结构

64位ID结构:
- 1位: 符号位(始终为0)
- 41位: 时间戳(毫秒) - 可用约69年
- 5位: 数据中心ID (0-31)
- 5位: 机器ID (0-31)
- 12位: 序列号 (0-4095) - 同一毫秒内可生成4096个ID

## 使用示例

### 1. 使用 SnowflakeIdGenerator (单线程)

```rust
use crate::common::snowflake::SnowflakeIdGenerator;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建生成器: 数据中心ID=1, 机器ID=1
    let mut id_generator = SnowflakeIdGenerator::new(1, 1)?;
    
    // 生成ID
    let id = id_generator.real_time_generate()?;
    println!("Generated ID: {}", id);
    
    Ok(())
}
```

### 2. 使用 SnowflakeIdBucket (多线程安全)

```rust
use crate::common::snowflake::SnowflakeIdBucket;
use std::sync::Arc;
use std::thread;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建线程安全的ID桶: 数据中心ID=1, 机器ID=1
    let id_bucket = Arc::new(SnowflakeIdBucket::new(1, 1)?);
    
    // 在多个线程中使用
    let mut handles = vec![];
    
    for i in 0..10 {
        let bucket = Arc::clone(&id_bucket);
        let handle = thread::spawn(move || {
            let id = bucket.get_id().unwrap();
            println!("Thread {}: Generated ID: {}", i, id);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    Ok(())
}
```

### 3. 使用自定义起始时间

```rust
use crate::common::snowflake::SnowflakeIdGenerator;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 自定义起始时间戳 (2025-01-01 00:00:00 UTC = 1735689600000)
    let custom_epoch = 1735689600000;
    let mut generator = SnowflakeIdGenerator::with_epoch(1, 1, custom_epoch)?;
    
    let id = generator.real_time_generate()?;
    println!("Generated ID with custom epoch: {}", id);
    
    Ok(())
}
```

### 4. 解析 Snowflake ID

```rust
use crate::common::snowflake::SnowflakeIdGenerator;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut generator = SnowflakeIdGenerator::new(5, 10)?;
    let id = generator.real_time_generate()?;
    
    // 解析ID
    let (timestamp, datacenter_id, machine_id, sequence) = 
        SnowflakeIdGenerator::parse_id(id);
    
    println!("ID: {}", id);
    println!("Timestamp: {}", timestamp);
    println!("Datacenter ID: {}", datacenter_id);
    println!("Machine ID: {}", machine_id);
    println!("Sequence: {}", sequence);
    
    Ok(())
}
```

## 在项目中使用

### 在 Actix-web 中使用

```rust
use actix_web::{web, HttpResponse};
use std::sync::Arc;
use crate::common::snowflake::SnowflakeIdBucket;

// 在应用状态中共享
pub struct AppState {
    pub id_generator: Arc<SnowflakeIdBucket>,
}

async fn create_entity(
    state: web::Data<AppState>,
) -> HttpResponse {
    match state.id_generator.get_id() {
        Ok(id) => {
            // 使用生成的ID创建实体
            HttpResponse::Ok().json(serde_json::json!({
                "id": id.to_string(),
                "message": "Entity created"
            }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to generate ID: {}", e)
            }))
        }
    }
}
```

### 初始化应用

```rust
use actix_web::{web, App, HttpServer};
use std::sync::Arc;
use crate::common::snowflake::SnowflakeIdBucket;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 创建全局ID生成器
    let id_generator = Arc::new(
        SnowflakeIdBucket::new(1, 1)
            .expect("Failed to create ID generator")
    );
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(AppState {
                id_generator: Arc::clone(&id_generator),
            }))
            // ... 其他配置
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

## 注意事项

1. **数据中心ID和机器ID**: 范围是 0-31，在分布式系统中需要为每个节点分配唯一的组合
2. **时钟回拨**: 如果检测到系统时钟回拨，会返回错误。生产环境中应该使用 NTP 同步时间
3. **线程安全**: `SnowflakeIdBucket` 使用互斥锁，适合多线程环境；`SnowflakeIdGenerator` 不是线程安全的
4. **性能**: 在同一毫秒内最多可生成 4096 个唯一ID

## 错误处理

```rust
use crate::common::snowflake::{SnowflakeIdGenerator, SnowflakeError};

match SnowflakeIdGenerator::new(1, 1) {
    Ok(mut generator) => {
        match generator.real_time_generate() {
            Ok(id) => println!("Generated ID: {}", id),
            Err(SnowflakeError::ClockMovedBackwards) => {
                eprintln!("Error: System clock moved backwards!");
            }
            Err(e) => eprintln!("Error: {}", e),
        }
    }
    Err(SnowflakeError::InvalidDatacenterId) => {
        eprintln!("Invalid datacenter ID (must be 0-31)");
    }
    Err(SnowflakeError::InvalidMachineId) => {
        eprintln!("Invalid machine ID (must be 0-31)");
    }
    Err(e) => eprintln!("Error: {}", e),
}
```

## 测试

运行测试:

```bash
cargo test snowflake
```

