use crate::common::error::{AppError, AppResult};
use crate::config::JwtConfig;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i64,
    pub username: String,
    pub exp: u64,
    pub iat: u64,
    pub token_type: String,
}

pub struct JwtUtil;

impl JwtUtil {
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
        .map_err(|e| AppError::InternalError(format!("Failed to generate access token: {}", e)))
    }

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
        .map_err(|e| AppError::InternalError(format!("Failed to generate refresh token: {}", e)))
    }

    pub fn verify_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let validation = Validation::new(Algorithm::HS256);

        decode::<Claims>(
            token,
            &DecodingKey::from_secret(config.secret.as_ref()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(|e| {
            tracing::warn!("Token verification failed: {}", e);
            AppError::Unauthorized("Invalid token".to_string())
        })
    }

    pub fn verify_access_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let claims = Self::verify_token(token, config)?;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized("Token type error".to_string()));
        }

        Ok(claims)
    }

    pub fn verify_refresh_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
        let claims = Self::verify_token(token, config)?;

        if claims.token_type != "refresh" {
            return Err(AppError::Unauthorized("Token type error".to_string()));
        }

        Ok(claims)
    }
}
