/**
 * Result Page Navigation Helper
 *
 * Provides utility functions to easily navigate to the result page with typed parameters.
 */

export type ResultType = "error" | "warning" | "info";

export interface ResultPageParams {
    /** Type of result to display */
    type?: ResultType;
    /** Main title text */
    title: string;
    /** Optional subtitle/description text */
    subtitle?: string;
    /** Show "Return to Home" button (default: true) */
    showHome?: boolean;
    /** Show "Go Back" button (default: true) */
    showBack?: boolean;
}

/**
 * Build URL for result page with query parameters
 *
 * @param params - Result page configuration
 * @returns URL string with query parameters
 *
 * @example
 * ```typescript
 * const url = buildResultUrl({
 *   type: "error",
 *   title: "操作失败",
 *   subtitle: "请稍后重试"
 * });
 * navigate(url);
 * ```
 */
export const buildResultUrl = (params: ResultPageParams): string => {
    const searchParams = new URLSearchParams();

    if (params.type) {
        searchParams.set("type", params.type);
    }

    searchParams.set("title", params.title);

    if (params.subtitle) {
        searchParams.set("subtitle", params.subtitle);
    }

    if (params.showHome === false) {
        searchParams.set("showHome", "false");
    }

    if (params.showBack === false) {
        searchParams.set("showBack", "false");
    }

    return `/result?${searchParams.toString()}`;
};

/**
 * Navigate to error result page
 *
 * @example
 * ```typescript
 * const navigate = useNavigate();
 * navigateToError(navigate, {
 *   title: "删除失败",
 *   subtitle: "该项目正在使用中"
 * });
 * ```
 */
export const navigateToError = (
    navigate: (path: string) => void,
    params: Omit<ResultPageParams, "type">
): void => {
    navigate(buildResultUrl({ ...params, type: "error" }));
};

/**
 * Navigate to warning result page
 *
 * @example
 * ```typescript
 * const navigate = useNavigate();
 * navigateToWarning(navigate, {
 *   title: "网络不稳定",
 *   subtitle: "部分数据可能未同步"
 * });
 * ```
 */
export const navigateToWarning = (
    navigate: (path: string) => void,
    params: Omit<ResultPageParams, "type">
): void => {
    navigate(buildResultUrl({ ...params, type: "warning" }));
};

/**
 * Navigate to info result page
 *
 * @example
 * ```typescript
 * const navigate = useNavigate();
 * navigateToInfo(navigate, {
 *   title: "操作已提交",
 *   subtitle: "我们将在24小时内处理"
 * });
 * ```
 */
export const navigateToInfo = (
    navigate: (path: string) => void,
    params: Omit<ResultPageParams, "type">
): void => {
    navigate(buildResultUrl({ ...params, type: "info" }));
};

