<script setup lang="ts">
import type * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

// 1. 定义针对当前案例的 Viewer 配置
const viewerConfig = {
  timeline: true, // 这里的 Hello World 我们开启时间轴演示 prop 传参
  animation: true, // 开启左下角仪表盘
  baseLayerPicker: true, // 开启底图切换
};

// 2. 核心业务逻辑
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  console.log("Cesium 实例已获取:", viewer);

  // 可以在这里写 Cesium 的 API 操作，例如：
  // viewer.camera.flyTo(...)
};
</script>

<template>
  <div class="demo-container">
    <!-- 
      1. 使用封装组件 
      2. 通过 config prop 覆盖默认配置（例如开启时间轴）
      3. 监听 map-loaded 事件获取 viewer 实例
    -->
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />

    <!-- 这里可以放业务特有的 UI，比如操作面板 -->
    <div class="control-panel">
      <h3>Hello World</h3>
      <p>地图加载完成！</p>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  position: relative;
  width: 100%;
  height: 100%; /* 确保容器占满屏幕 */
  overflow: hidden;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 15px;
  color: white;
  pointer-events: none; /* 让鼠标事件穿透到地图，除非你需要在面板上点击 */
  background: rgba(42, 42, 42, 0.8);
  border-radius: 8px;
}
</style>
