import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE,} from "redux-persist";
import localStorage from "redux-persist/es/storage"; // 默认使用 localStorage
// import storage from "redux-persist/lib/storage/session"; // 如果需要使用 sessionStorage
import userReducer from "./slices/user-slice.ts";


/**
 * 组合所有 reducers
 */
const rootReducer = combineReducers({
    user: userReducer,
    // 可以在这里添加更多的 slice reducers
});

/**
 * Redux-Persist 配置
 * - key: 存储的键名
 * - version: 版本号，用于迁移
 * - storage: 存储引擎（默认使用 localStorage）
 * - whitelist: 需要持久化的 reducer（可选）
 * - blacklist: 不需要持久化的 reducer（可选）
 */
const persistConfig = {
    key: "root",
    version: 1,
    storage: localStorage,
    // whitelist: ["user"], // 只持久化 user state
    // blacklist: [], // 不持久化的 reducers
};

/**
 * 创建持久化的 reducer
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * 配置 Redux Store
 * - reducer: 使用持久化的 reducer
 * - middleware: 配置中间件，忽略 redux-persist 的 action 类型检查
 */
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // 忽略 redux-persist 的 action types
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    // 开发环境启用 DevTools
    devTools: process.env.NODE_ENV !== "production",
});

/**
 * 创建 persistor
 */
export const persistor = persistStore(store);

/**
 * 导出类型定义
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

