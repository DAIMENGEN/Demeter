import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash/debounce";

type UserSearchFn = (keyword: string) => void | Promise<void>;

export const useDebouncedUserSearch = (params: { open: boolean; search: UserSearchFn }) => {
  const { open, search } = params;

  // 人员远程搜索：使用 lodash.debounce（支持 cancel/flush）减少请求频率
  const lastUserSearchKeywordRef = useRef<string>("");

  const debouncedUserSearch = useMemo(
    () =>
      debounce((keyword: string) => {
        void search(keyword);
      }, 300),
    [search]
  );

  useEffect(() => {
    // 抽屉关闭/组件卸载时取消 pending 的防抖调用
    if (!open) {
      debouncedUserSearch.cancel();
      lastUserSearchKeywordRef.current = "";
    }

    return () => {
      debouncedUserSearch.cancel();
    };
  }, [open, debouncedUserSearch]);

  const onUserSearch = (kw: string) => {
    const keyword = (kw ?? "").trim();
    if (keyword === lastUserSearchKeywordRef.current) return;
    lastUserSearchKeywordRef.current = keyword;
    debouncedUserSearch(keyword);
  };

  const resetUserSearch = () => {
    debouncedUserSearch.cancel();
    lastUserSearchKeywordRef.current = "";
  };

  return {
    onUserSearch,
    resetUserSearch
  };
};

