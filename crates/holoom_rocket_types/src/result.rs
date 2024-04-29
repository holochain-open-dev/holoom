use super::error::ApiError;

pub type JsonResult<T> = std::result::Result<rocket::serde::json::Json<T>, ApiError>;

pub type Result<T> = std::result::Result<T, ApiError>;
