import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";

const request = axios.create({
  baseURL: "",
  timeout: 10000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加全局的请求拦截器
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    // 统一处理错误
    console.error("请求失败:", error.message);
    return Promise.reject(error);
  }
);

export default request;
