<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shouldAnimate: true,
};

let viewer: Cesium.Viewer;

// --- 第一步：定义空间路径 ---
const startPos = new Cesium.Cartesian3(-2379556.799372864, -4665528.205030263, 3628013.106599678);
const endPos = new Cesium.Cartesian3(-2379603.7074103747, -4665623.48990283, 3627860.82704567);

// 计算两点间总距离 (米)
const totalDistance = Cesium.Cartesian3.distance(startPos, endPos);

// --- 第二步：设定运动参数 ---
const speedInMetersPerSecond = 10; // 匀速 10m/s (约 36km/h)
const durationInSeconds = totalDistance / speedInMetersPerSecond; // 计算总用时
console.log("路程和时间", totalDistance, durationInSeconds);

// --- 第三步：定义时间基准 ---
const start = Cesium.JulianDate.now();
const stop = Cesium.JulianDate.addSeconds(start, durationInSeconds, new Cesium.JulianDate());

// --- 第四步：生成匀速采样点 ---
const positionProperty = new Cesium.SampledPositionProperty();
// 采样频率：每 1 秒设置一个参考点（Cesium会自动在秒与秒之间做平滑插值）
for (let i = 0; i <= durationInSeconds; i++) {
  const timeOffset = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());

  // 匀速逻辑：计算比例
  const factor = i / durationInSeconds;

  // 计算当前位置
  const currentPos = Cesium.Cartesian3.lerp(startPos, endPos, factor, new Cesium.Cartesian3());

  positionProperty.addSample(timeOffset, currentPos);
}

// 补全最后一个点（确保终点精准）
positionProperty.addSample(stop, endPos);
console.log("positionProperty", positionProperty);
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  // 设置时钟属性
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.timeline.zoomTo(start, stop);

  // --- 第五步：创建并渲染实体 ---
  const carEntity = viewer.entities.add({
    // 将位置绑定到采样属性
    position: positionProperty,

    // 将朝向绑定到速度矢量（自动计算车头方向）
    orientation: new Cesium.VelocityOrientationProperty(positionProperty),

    model: {
      uri: import.meta.env.BASE_URL + "SampleData/models/GroundVehicle/GroundVehicle.glb", // 替换为你的模型路径
      minimumPixelSize: 64,
      maximumScale: 20000,
    },

    // 绘制运动轨迹（可选，方便观察）
    path: {
      width: 3,
      material: Cesium.Color.RED,
    },
  });

  // 视角追踪
  viewer.trackedEntity = carEntity;
};
</script>

<template>
  <div class="wh-full relative">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
