/**
 * 全局 HTTP 错误事件总线
 *
 * 解耦 Axios 拦截器（非 React 层）与 UI 通知层（Ant Design message）。
 * 拦截器调用 errorBus.emit()，App 组件通过 errorBus.register() 挂载实际的展示逻辑。
 */

type ErrorHandler = (message: string) => void;

let handler: ErrorHandler | null = null;

export const errorBus = {
    /** 注册全局错误处理函数（在 AntdApp 子组件的 useEffect 中调用） */
    register: (h: ErrorHandler | null) => {
        handler = h;
    },
    /** 触发全局错误通知 */
    emit: (message: string) => {
        handler?.(message);
    },
};
