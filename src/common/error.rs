use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Structured error response: `{ "error": { "code": "...", "message": "...", "details": [...] } }`
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: ErrorBody,
}

#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub code: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Vec<FieldError>>,
}

#[derive(Debug, Serialize)]
pub struct FieldError {
    pub field: String,
    pub message: String,
    pub code: String,
}

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    ValidationError(String, Vec<FieldError>),
    Unauthorized(String),
    Forbidden(String),
    Conflict(String),
    InternalError(String),
    DatabaseError(sqlx::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message, details) = match self {
            AppError::NotFound(msg) => {
                tracing::warn!("NotFound: {}", msg);
                (StatusCode::NOT_FOUND, "not_found", msg, None)
            }
            AppError::BadRequest(msg) => {
                tracing::warn!("BadRequest: {}", msg);
                (StatusCode::BAD_REQUEST, "bad_request", msg, None)
            }
            AppError::ValidationError(msg, fields) => {
                tracing::warn!("ValidationError: {}", msg);
                (
                    StatusCode::UNPROCESSABLE_ENTITY,
                    "validation_error",
                    msg,
                    Some(fields),
                )
            }
            AppError::Unauthorized(msg) => {
                tracing::warn!("Unauthorized: {}", msg);
                (StatusCode::UNAUTHORIZED, "unauthorized", msg, None)
            }
            AppError::Forbidden(msg) => {
                tracing::warn!("Forbidden: {}", msg);
                (StatusCode::FORBIDDEN, "forbidden", msg, None)
            }
            AppError::Conflict(msg) => {
                tracing::warn!("Conflict: {}", msg);
                (StatusCode::CONFLICT, "conflict", msg, None)
            }
            AppError::InternalError(msg) => {
                tracing::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "An internal error occurred".to_string(),
                    None,
                )
            }
            AppError::DatabaseError(err) => {
                tracing::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "Database operation failed".to_string(),
                    None,
                )
            }
        };

        let body = Json(ErrorResponse {
            error: ErrorBody {
                code,
                message,
                details,
            },
        });

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err)
    }
}
