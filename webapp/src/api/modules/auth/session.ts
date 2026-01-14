/**
 * 会话相关 API（纯 Cookie 鉴权）
 */

import { get } from "@Webapp/http";
import type { LoginResponse } from "./types";

/**
 * 获取当前会话用户信息（需要已登录 cookie）
 */
export function getAuthSession() {
  return get<LoginResponse>("/auth/session");
}
