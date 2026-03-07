/**
 * 会话失效事件总线
 *
 * 解耦 Axios 拦截器（非 React 层）与 React 路由层。
 * 当 token 刷新彻底失败时，通过事件通知 React 进行路由跳转，
 * 避免 window.location.replace 导致整个 SPA 重新加载。
 */

type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;

export const authEvent = {
    /** 注册会话失效回调（在 AuthGuard 的 useEffect 中调用） */
    onSessionExpired: (h: SessionExpiredHandler | null) => {
        handler = h;
    },
    /** 触发会话失效 */
    emitSessionExpired: () => {
        if (handler) {
            handler();
        } else {
            // 降级：尚未注册回调时仍跳转（首次加载等极端场景）
            window.location.replace("/login");
        }
    },
};
