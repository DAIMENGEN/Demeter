import type {AppDispatch, AppStore, RootState} from "./index";
import {useDispatch, useSelector, useStore} from "react-redux";

/**
 * 类型化的 useDispatch hook
 * 使用此 hook 替代标准的 useDispatch，以获得正确的类型推断
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * 类型化的 useSelector hook
 * 使用此 hook 替代标准的 useSelector，以获得正确的类型推断
 * state 参数会自动推断为 RootState 类型
 */
export const useAppSelector = useSelector.withTypes<RootState>();

/**
 * 类型化的 useStore hook
 * 使用此 hook 替代标准的 useStore，以获得正确的类型推断
 */
export const useAppStore = useStore.withTypes<AppStore>();

