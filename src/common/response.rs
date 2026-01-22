use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: u16,
    pub message: String,
    pub data: T,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            code: 200,
            message: "success".to_string(),
            data,
        }
    }

    #[warn(unused)]
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

#[derive(Debug, Serialize)]
pub struct PageResponse<T> {
    pub list: Vec<T>,
    pub total: i64,
}
