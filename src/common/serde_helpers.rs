/// Serde helper: 区分字段「未发送」(None) 与「显式传 null」(Some(None))
///
/// 用法示例:
/// ```ignore
/// #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
/// pub field: Option<Option<T>>,
/// ```
///
/// 语义:
/// - JSON 中未出现该字段 → None（保持原值）
/// - JSON 中出现 "field": null → Some(None)（清空该字段）
/// - JSON 中出现 "field": value → Some(Some(value))（更新为该值）
pub mod double_option {
    use serde::{Deserialize, Deserializer};

    pub fn deserialize<'de, T, D>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
    where
        T: Deserialize<'de>,
        D: Deserializer<'de>,
    {
        // 只要此函数被调用，说明字段出现在了 JSON 中
        Ok(Some(Option::<T>::deserialize(deserializer)?))
    }
}
