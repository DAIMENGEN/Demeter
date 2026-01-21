import {createSlice, type PayloadAction} from "@reduxjs/toolkit";

/**
 * 用户接口定义
 * 定义用户对象的数据结构
 */
export interface User {
    id: string;              // 用户唯一标识符
    username: string;        // 用户名
    email: string;           // 邮箱地址
    fullName?: string;       // 完整姓名(可选)
    phone?: string;          // 手机号(可选)
    avatar?: string;         // 头像 URL(可选)
    role?: string;           // 用户角色(可选)
    createDateTime?: string; // 创建时间(可选)
}

/**
 * 用户状态接口
 * 定义 Redux store 中用户相关的状态结构
 */
export interface UserState {
    currentUser: User | null;  // 当前登录的用户信息,未登录时为 null
    isAuthenticated: boolean;  // 用户是否已认证(已登录)
}

/**
 * 初始状态
 * 定义用户状态的初始值
 */
const initialState: UserState = {
    currentUser: null,         // 初始未登录
    isAuthenticated: false,    // 初始未认证
};

/**
 * 用户切片 - 使用 Redux Toolkit 的 createSlice
 * 自动生成 action creators 和 action types
 */
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // 更新用户信息
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                state.currentUser = {
                    ...state.currentUser,
                    ...action.payload,
                };
            }
        },
        // 登录成功
        loginSuccess: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
        },
        // 登录失败
        loginFailure: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
        },
        // 登出
        logout: (state) => {
            state.currentUser = null;
        },
    },
});
// 导出 actions
export const {
    updateUser,
    loginSuccess,
    loginFailure,
    logout,
} = userSlice.actions;
// 导出 selectors
// 使用泛型避免循环依赖，实际使用时会通过 useAppSelector 获得正确的类型推断
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectIsAuthenticated = (state: { user: UserState }) => state.user.isAuthenticated;
// 导出 reducer
export default userSlice.reducer;
