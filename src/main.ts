import { createApp } from "vue";
import * as Cesium from "cesium";
import App from "./App.vue";

import "./styles/index.scss";
import "virtual:uno.css";

import setupPlugins from "@/plugins";

// 【核心步骤】配置 Cesium Token
// ----------------------------------------------------
const token = import.meta.env.VITE_CESIUM_TOKEN;
if (token) {
  Cesium.Ion.defaultAccessToken = token;
} else {
  console.warn("Cesium Token 未配置，部分在线资源可能无法加载！");
}

const app = createApp(App);

app.use(setupPlugins);

app.mount("#app");
