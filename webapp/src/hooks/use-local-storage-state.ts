import {useState, useCallback, useEffect, useRef, type Dispatch, type SetStateAction} from "react";

function readStorage<T>(key: string, defaultValue: T): T {
    try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            return JSON.parse(stored) as T;
        }
    } catch {
        // 解析失败则使用默认值
    }
    return defaultValue;
}

/**
 * 与 useState 行为一致，但会将值持久化到 localStorage。
 * - 初始化时优先读取 localStorage 中的值，不存在则使用 `defaultValue`。
 * - 每次 setState 都会同步写入 localStorage。
 * - 当 key 变化时（如切换项目），会自动从 localStorage 重新读取对应的值。
 * - 支持函数式更新。
 *
 * @param key localStorage 中的键名
 * @param defaultValue 默认值
 */
export function useLocalStorageState<T>(
    key: string,
    defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
    const [state, setStateRaw] = useState<T>(() => readStorage(key, defaultValue));

    // 用 ref 持有最新的 defaultValue，避免对象/数组字面量引用变化导致 effect 无限触发
    const defaultValueRef = useRef(defaultValue);
    defaultValueRef.current = defaultValue;

    // 跟踪上一次的 key，仅在 key 真正变化时重新读取
    const prevKeyRef = useRef(key);

    useEffect(() => {
        if (prevKeyRef.current === key) return;
        prevKeyRef.current = key;
        setStateRaw(readStorage(key, defaultValueRef.current));
    }, [key]);

    const setState: Dispatch<SetStateAction<T>> = useCallback(
        (action: SetStateAction<T>) => {
            setStateRaw((prev) => {
                const next = typeof action === "function"
                    ? (action as (prevState: T) => T)(prev)
                    : action;
                try {
                    localStorage.setItem(key, JSON.stringify(next));
                } catch {
                    // 写入失败（如超出配额）则静默忽略
                }
                return next;
            });
        },
        [key],
    );

    return [state, setState];
}
