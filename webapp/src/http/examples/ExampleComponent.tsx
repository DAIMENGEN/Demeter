/**
 * HTTP 请求使用示例
 *
 * 这个文件展示了如何在 React 组件中使用封装的 HTTP 请求方法
 */

// @ts-nocheck - This is an example file with intentionally unused functions

import { useState } from "react";
import { userApi, type User } from "./userApi";
import { upload, download } from "..";

export function ExampleComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 示例 1: 获取用户信息
   */
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error("获取用户信息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例 2: 用户登录
   */
  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await userApi.login({ username, password });
      // 保存 token
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
    } catch (error) {
      console.error("登录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例 3: 获取用户列表（分页）
   */
  const fetchUserList = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      const response = await userApi.getUserList({ page, pageSize });
      console.log("用户列表:", response.data.list);
      console.log("总数:", response.data.total);
    } catch (error) {
      console.error("获取用户列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例 4: 更新用户信息
   */
  const updateUserInfo = async (id: string, name: string) => {
    try {
      setLoading(true);
      const response = await userApi.updateUser(id, { name });
      setUser(response.data);
    } catch (error) {
      console.error("更新用户信息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例 5: 上传文件
   */
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const response = await upload("/upload/avatar", file);
      console.log("上传成功:", response.data);
    } catch (error) {
      console.error("上传失败:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 示例 6: 下载文件
   */
  const handleDownload = async () => {
    try {
      setLoading(true);
      await download("/files/report", undefined, "report.pdf");
    } catch (error) {
      console.error("下载失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </div>
  );
}

