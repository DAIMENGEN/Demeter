use crate::common::error::{AppError, AppResult};
use crate::config::JwtConfig;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

/// JWT 令牌声明
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i64,        // 用户ID
    pub username: String,   // 用户名
    pub exp: u64,           // 过期时间
    pub iat: u64,           // 签发时间
    pub token_type: String, // 令牌类型: "access" 或 "refresh"
}

/// JWT 工具类
pub struct JwtUtil;

impl JwtUtil {
    /// 生成访问令牌
    pub fn generate_access_token(
        user_id: i64,
        username: &str,
        config: &JwtConfig,
    ) -> AppResult<String> {
        let now = chrono::Utc::now().timestamp() as u64;
        let claims = Claims {
            sub: user_id,
            username: username.to_string(),
            exp: now + config.access_token_expires_in as u64,
            iat: now,
            token_type: "access".to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(config.secret.as_ref()),
        )
        .map_err(|e| AppError::InternalError(format!("生成访问令牌失败: {}", e)))
    }

    /// 生成刷新令牌
    pub fn generate_refresh_token(
        user_id: i64,
        username: &str,
        config: &JwtConfig,
    ) -> AppResult<String> {
        let now = chrono::Utc::now().timestamp() as u64;
        let claims = Claims {
            sub: user_id,
            username: username.to_string(),
            exp: now + config.refresh_token_expires_in as u64,
            iat: now,
            token_type: "refresh".to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(config.secret.as_ref()),
        )
        .map_err(|e| AppError::InternalError(format!("生成刷新令牌失败: {}", e)))
    }

    /// 验证并解析令牌
    pub fn verify_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let validation = Validation::new(Algorithm::HS256);

        decode::<Claims>(
            token,
            &DecodingKey::from_secret(config.secret.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(|e| {
            tracing::warn!("令牌验证失败: {}", e);
            AppError::Unauthorized("无效的令牌".to_string())
        })
    }

    /// 验证访问令牌
    pub fn verify_access_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let claims = Self::verify_token(token, config)?;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized("令牌类型错误".to_string()));
        }

        Ok(claims)
    }

    /// 验证刷新令牌
    pub fn verify_refresh_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let claims = Self::verify_token(token, config)?;

        if claims.token_type != "refresh" {
            return Err(AppError::Unauthorized("令牌类型错误".to_string()));
        }

        Ok(claims)
    }
}
