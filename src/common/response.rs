use serde::Serialize;

/// Standard success response envelope: `{ "data": T }`
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub data: T,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self { data }
    }
}

/// Paginated collection response:
/// `{ "data": [...], "meta": { ... }, "links": { ... } }`
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub meta: PaginationMeta,
    pub links: PaginationLinks,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize)]
pub struct PaginationLinks {
    #[serde(rename = "self")]
    pub self_link: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prev: Option<String>,
    pub first: String,
    pub last: String,
}

impl<T: Serialize> PaginatedResponse<T> {
    /// Build a paginated response from a list of items and pagination info.
    ///
    /// `base_path` should be the path portion of the URL, e.g. `/api/v1/users`.
    pub fn new(data: Vec<T>, total: i64, page: i64, per_page: i64, base_path: &str) -> Self {
        let total_pages = if total == 0 {
            1
        } else {
            (total + per_page - 1) / per_page
        };

        let self_link = format!("{}?page={}&per_page={}", base_path, page, per_page);
        let first = format!("{}?page=1&per_page={}", base_path, per_page);
        let last = format!("{}?page={}&per_page={}", base_path, total_pages, per_page);

        let next = if page < total_pages {
            Some(format!(
                "{}?page={}&per_page={}",
                base_path,
                page + 1,
                per_page
            ))
        } else {
            None
        };

        let prev = if page > 1 {
            Some(format!(
                "{}?page={}&per_page={}",
                base_path,
                page - 1,
                per_page
            ))
        } else {
            None
        };

        Self {
            data,
            meta: PaginationMeta {
                total,
                page,
                per_page,
                total_pages,
            },
            links: PaginationLinks {
                self_link,
                next,
                prev,
                first,
                last,
            },
        }
    }
}
