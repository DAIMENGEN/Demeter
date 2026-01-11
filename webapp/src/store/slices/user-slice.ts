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
    avatar?: string;         // 头像 URL(可选)
    role?: string;           // 用户角色(可选)
    createdAt?: string;      // 创建时间(可选)
}

/**
 * 用户状态接口
 * 定义 Redux store 中用户相关的状态结构
 */
export interface UserState {
    currentUser: User | null;  // 当前登录的用户信息,未登录时为 null
    isAuthenticated: boolean;  // 用户是否已认证(已登录)
    loading: boolean;          // 是否正在加载(用于显示加载动画)
    error: string | null;      // 错误信息,无错误时为 null
}

/**
 * 初始状态
 * 定义用户状态的初始值
 */
const initialState: UserState = {
    currentUser: null,         // 初始未登录
    isAuthenticated: false,    // 初始未认证
    loading: false,            // 初始无加载状态
    error: null,               // 初始无错误
};

/**
 * 用户切片 - 使用 Redux Toolkit 的 createSlice
 * 自动生成 action creators 和 action types
 */
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // 设置当前用户
        setUser: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        },
        // 更新用户信息
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                state.currentUser = {
                    ...state.currentUser,
                    ...action.payload,
                };
            }
        },
        // 清除用户信息（登出）
        clearUser: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        // 设置加载状态
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        // 设置错误信息
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
        // 登录成功
        loginSuccess: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        // 登录失败
        loginFailure: (state, action: PayloadAction<string>) => {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = action.payload;
        },
        // 登出
        logout: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
    },
});
// 导出 actions
export const {
    setUser,
    updateUser,
    clearUser,
    setLoading,
    setError,
    loginSuccess,
    loginFailure,
    logout,
} = userSlice.actions;
// 导出 selectors
// 使用 any 类型避免循环依赖，实际使用时会通过 useAppSelector 获得正确的类型推断
export const selectCurrentUser = (state: any) => state.user.currentUser;
export const selectIsAuthenticated = (state: any) => state.user.isAuthenticated;
export const selectUserLoading = (state: any) => state.user.loading;
export const selectUserError = (state: any) => state.user.error;
// 导出 reducer
export default userSlice.reducer;
