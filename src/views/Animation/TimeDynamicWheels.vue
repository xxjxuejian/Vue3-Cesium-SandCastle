<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shouldAnimate: true,
};
let viewer: Cesium.Viewer;
const modelPath = import.meta.env.BASE_URL + "SampleData/models/GroundVehicle/GroundVehicle.glb";

const start = Cesium.JulianDate.fromDate(new Date(2018, 11, 12, 15));
const totalSeconds = 10;
const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

const startPosition = new Cesium.Cartesian3(
  -2379556.799372864,
  -4665528.205030263,
  3628013.106599678
);
const endPosition = new Cesium.Cartesian3(-2379603.7074103747, -4665623.48990283, 3627860.82704567);

const position = new Cesium.SampledPositionProperty();
// 根据 position 自动求导 → 得到速度向量
const velocityVectorProperty = new Cesium.VelocityVectorProperty(position, false);
// 作为“复用的结果容器”，用来接收速度向量，避免重复创建对象
const velocityVector = new Cesium.Cartesian3();

// Store the wheel's rotation over time in a SampledProperty.
const wheelAngleProperty = new Cesium.SampledProperty(Number);
let wheelAngle = 0;

// 设置100个关键帧，那就是99个帧间隔
const numberOfSamples = 100;
for (let i = 0; i < numberOfSamples; ++i) {
  const factor = i / (numberOfSamples - 1); // 第x个关键帧 的“时间因子”，范围从0到1,他是均匀变化的
  // 关键帧的时间;factor * totalSeconds表示这个关键帧在 totalSeconds 内,对应的时间刻度
  const time = Cesium.JulianDate.addSeconds(start, factor * totalSeconds, new Cesium.JulianDate());

  // 让位置插值变成“非匀速”，模拟加速运动。
  const locationFactor = Math.pow(factor, 2);
  const location = Cesium.Cartesian3.lerp(
    startPosition,
    endPosition,
    locationFactor,
    new Cesium.Cartesian3()
  );
  // 添加关键帧:时间、位置 到关键帧集合中
  position.addSample(time, location);

  // Rotate the wheels based on how fast the vehicle is moving at each timestep.
  velocityVectorProperty.getValue(time, velocityVector);
  const metersPerSecond = Cesium.Cartesian3.magnitude(velocityVector);
  const wheelRadius = 0.52; //in meters.
  const circumference = Math.PI * wheelRadius * 2;
  const rotationsPerSecond = metersPerSecond / circumference;

  wheelAngle += ((Math.PI * 2 * totalSeconds) / numberOfSamples) * rotationsPerSecond;
  wheelAngleProperty.addSample(time, wheelAngle);
}

const rotationProperty = new Cesium.CallbackProperty(function (time, result) {
  return Cesium.Quaternion.fromAxisAngle(
    Cesium.Cartesian3.UNIT_X,
    wheelAngleProperty.getValue(time),
    result
  );
}, false);

const wheelTransformation = new Cesium.NodeTransformationProperty({
  rotation: rotationProperty,
});

const nodeTransformations: any = {
  Wheels: wheelTransformation,
  Wheels_mid: wheelTransformation,
  Wheels_rear: wheelTransformation,
};

// 更新速度标签
// result: 返回 Cesium 的“可复用对象类型”时，用它来避免频繁 new 对象。
function updateSpeedLabel(time: Cesium.JulianDate | undefined) {
  // 在 time 时刻计算速度;把结果写入 velocityVector
  // velocityVector：不是返回新对象，而是“写进你传进去的对象”，避免重复创建对象
  velocityVectorProperty.getValue(time, velocityVector);
  // magnitude: 计算一个三维向量的长度（模长 / 速度大小） 等价于：Math.sqrt(x*x + y*y + z*z)
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
    position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: modelPath,
      runAnimations: false, // gltf模型的动画（如果有）会自动播放；这里是加速动画，车轮速度不匹配
      nodeTransformations,
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
