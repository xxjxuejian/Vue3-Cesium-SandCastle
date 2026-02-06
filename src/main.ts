import { createApp } from "vue";
import * as Cesium from "cesium";
import App from "./App.vue";

import "./styles/index.scss";
import "virtual:uno.css";

import "cesium/Build/Cesium/Widgets/widgets.css";

import setupPlugins from "@/plugins";

//配置 Cesium
// 1. 获取vite.config.ts中配置的 base 路径 (例如 /my-app/)
const baseUrl = import.meta.env.BASE_URL;
// 2. 获取 Cesium 文件夹名 （cesium静态资源被拷贝的路径）
const cesiumFolder = import.meta.env.VITE_CESIUM_STATIC_TARGET_URL;
// 3. 拼接完整的 Global URL 结果: /my-app/cesium-static/
// @ts-ignore
window.CESIUM_BASE_URL = `${baseUrl}${cesiumFolder}/`;
// 4. 配置 Cesium Token，这个VITE_CESIUM_TOKEN从 .env.local 文件中获取，这个文件优先级最高，而且通常在.gitignore 文件中忽略，token不会泄露
// vite环境变量的加载顺序：.env.local > .env.development > .env.production > .env
// 如果同一个变量在多个文件中定义，Vue 会使用优先级更高的文件中的值。
const token = import.meta.env.VITE_CESIUM_TOKEN;
if (token) {
  Cesium.Ion.defaultAccessToken = token;
} else {
  console.warn("Cesium Token 未配置，部分在线资源可能无法加载！");
}

const app = createApp(App);
app.use(setupPlugins);
app.mount("#app");
