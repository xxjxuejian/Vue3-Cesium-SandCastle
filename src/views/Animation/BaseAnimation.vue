<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

// 一个持续 X 秒的“匀速直线运动轨迹（离散采样版）”
const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shouldAnimate: true,
};
/*
    Cesium 的动画本质是 时间驱动（Time-based animation）
    这里演示汽车匀速动画
*/
const startPosition = new Cesium.Cartesian3(
  -2379556.799372864,
  -4665528.205030263,
  3628013.106599678
);
const endPosition = new Cesium.Cartesian3(-2379603.7074103747, -4665623.48990283, 3627860.82704567);
const start = Cesium.JulianDate.now();
const duration = 30; // 持续时间 30 秒
//addSeconds:在一个时间基础上，加上若干秒，得到一个新的时间对象
// start:起始时间, duration :增加的秒数（可以是负数）, new Cesium.JulianDate():结果存储的对象
const stop = Cesium.JulianDate.addSeconds(start, duration, new Cesium.JulianDate());

// 60 个采样点/关键帧
const total = 60;
// 一个“按时间存储位置，并能自动插值计算中间位置”的连续函数
const position = new Cesium.SampledPositionProperty();

// 计算关键帧，并把它们添加到 position 中
for (let i = 0; i < total; i++) {
  // 生成 total 个关键帧：第0个关键帧，时间点为起始时间；第 total-1 个关键帧，时间点为结束时间；
  // i:表示第 i 个关键帧，还要知道这个关键帧 距离start起始点 有多少时间，才能确定这个关键帧的 时刻
  // 第0个关键帧，时间点为起始时间；第 total-1 个关键帧，时间点为结束时间；
  // i / (total - 1)：当前关键帧所在时间点 相对于 total 个关键帧的占比，类似于一个进度百分比
  const step = i / (total - 1);
  // 那么当前当前关键帧的时刻 距离start起始点 的时间是 duration * i / (total - 1) 秒
  // time:每一个关键帧的时间点, 通过在起始时间上加上 i 秒来计算
  const time = Cesium.JulianDate.addSeconds(start, duration * step, new Cesium.JulianDate());

  //   计算当前关键帧所在时间点 对应的位置
  //   lerp函数，在开始位置和结束位置之间，按照比例，计算出一个插值位置
  // 把“第 i 帧”映射到路径上的某个位置(按照step比例)，并把这个位置添加到 position 关键帧集合中
  const interpolatedPosition = Cesium.Cartesian3.lerp(
    startPosition,
    endPosition,
    step,
    new Cesium.Cartesian3()
  );
  position.addSample(time, interpolatedPosition);
}

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 循环播放

  viewer.clock.multiplier = 2; // 时间加速
  viewer.clock.shouldAnimate = true;
  viewer.timeline.zoomTo(start, stop);

  const carEntity = viewer.entities.add({
    // 将位置绑定到采样属性
    position,
    // 将朝向绑定到速度矢量（自动计算车头方向）
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: import.meta.env.BASE_URL + "SampleData/models/GroundVehicle/GroundVehicle.glb", // 替换为你的模型路径
      minimumPixelSize: 64,
      maximumScale: 20000,
    },
  });

  // 视角追踪
  viewer.trackedEntity = carEntity;
  carEntity.viewFrom = new Cesium.ConstantProperty(new Cesium.Cartesian3(-10.0, 7.0, 4.0));
};
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
