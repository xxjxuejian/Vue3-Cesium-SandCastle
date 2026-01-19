import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 10000,
});
