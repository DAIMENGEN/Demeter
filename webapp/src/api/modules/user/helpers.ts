import type { UserOption } from "./types";

export type UserSelectOption = {
  label: string;
  value: string;
};

/**
 * 将“轻量 UserOption（来自 /users/options，分页懒加载）”转换为 antd Select 可用的 option。
 */
export const toUserOptionSelectOption = (u: UserOption): UserSelectOption => ({
  value: u.id,
  label: `${u.fullName} (${u.username})`
});
