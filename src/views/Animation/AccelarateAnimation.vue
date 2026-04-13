<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shouldAnimate: true,
};
let viewer: Cesium.Viewer;
const modelPath = import.meta.env.BASE_URL + "SampleData/models/GroundVehicle/GroundVehicle.glb";
//定义动画开始时间、持续时间、和结束时间
const start = Cesium.JulianDate.fromDate(new Date(2018, 11, 12, 15));
const totalSeconds = 10; // 持续时间10s
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

// 动画的开始位置和结束位置
const startPosition = new Cesium.Cartesian3(
  -2379556.799372864,
  -4665528.205030263,
  3628013.106599678
);
const endPosition = new Cesium.Cartesian3(-2379603.7074103747, -4665623.48990283, 3627860.82704567);
// 存储时间 - 位置的 关键帧
const position = new Cesium.SampledPositionProperty();
// 根据 position 自动求导 → 得到速度向量
const velocityVectorProperty = new Cesium.VelocityVectorProperty(position, false);
// 作为“复用的结果容器”，用来接收速度向量，避免重复创建对象
const velocityVector = new Cesium.Cartesian3();

// 设置100个关键帧
const numberOfSamples = 100;
for (let i = 0; i <= numberOfSamples; ++i) {
  const factor = i / numberOfSamples; // 第x个关键帧
  // 关键帧的时间;factor * totalSeconds表示这个关键帧在 totalSeconds 内,对应的时间刻度
  const time = Cesium.JulianDate.addSeconds(start, factor * totalSeconds, new Cesium.JulianDate());

  // Lerp using a non-linear factor so that the vehicle accelerates.
  const locationFactor = Math.pow(factor, 2); // 幂运算
  // 插值计算关键帧的位置
  const location = Cesium.Cartesian3.lerp(
    startPosition,
    endPosition,
    locationFactor,
    new Cesium.Cartesian3()
  );
  // 添加关键帧:时间、位置 到关键帧集合中
  position.addSample(time, location);

  // 在 time 时刻计算速度;把结果写入 velocityVector
  // velocityVector：不是返回新对象，而是“写进你传进去的对象”，避免重复创建对象
  // velocityVectorProperty.getValue(time, velocityVector);
}

// 更新速度标签
function updateSpeedLabel(time: Cesium.JulianDate | undefined, result: any) {
  // if (!time) return "";

  velocityVectorProperty.getValue(time, velocityVector);
  const metersPerSecond = Cesium.Cartesian3.magnitude(velocityVector);
  const kmPerHour = Math.round(metersPerSecond * 3.6);

  return `${kmPerHour} km/hr`;
}

function initClock() {
  if (!viewer) return;
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.timeline.zoomTo(start, stop);
}

async function loadModel() {
  if (!viewer) return;
  // Add our vehicle model.
  const vehicleEntity = viewer.entities.add({
    position: position,
    orientation: new Cesium.VelocityOrientationProperty(position), // Automatically set the vehicle's orientation to the direction it's facing.
    model: {
      uri: modelPath,
      runAnimations: false,
      // nodeTransformations: nodeTransformations,
    },
    label: {
      text: new Cesium.CallbackProperty(updateSpeedLabel, false),
      font: "20px sans-serif",
      showBackground: true,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 100.0),
      eyeOffset: new Cesium.Cartesian3(0, 3.5, 0),
    },
  });

  viewer.trackedEntity = vehicleEntity;
  vehicleEntity.viewFrom = new Cesium.ConstantProperty(new Cesium.Cartesian3(-10.0, 7.0, 4.0));
}
const handleMapLoaded = async (vw: Cesium.Viewer) => {
  viewer = vw;
  //   initClock();
  await loadModel();

  initClock();
};
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
