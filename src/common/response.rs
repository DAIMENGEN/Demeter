use serde::Serialize;

/// 统一的 API 响应结构体
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: u16,         // 状态码
    pub message: String,   // 响应消息
    pub data: T,           // 响应数据
}

impl<T: Serialize> ApiResponse<T> {
    /// 成功响应
    pub fn success(data: T) -> Self {
        Self {
            code: 200,
            message: "success".to_string(),
            data,
        }
    }

    /// 错误响应
    pub fn error(code: u16, message: String) -> Self
    where
        T: Default,
    {
        Self {
            code,
            message,
            data: T::default(),
        }
    }
}

/// 分页响应结构体
#[derive(Debug, Serialize)]
pub struct PageResponse<T> {
    pub list: Vec<T>,  // 数据列表
    pub total: i64,    // 总数
}
