<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shouldAnimate: true,
};
/*
    Cesium 的动画本质是 时间驱动（Time-based animation）
*/
const start = Cesium.JulianDate.now();
//addSeconds:在一个时间基础上，加上若干秒，得到一个新的时间对象
// start:起始时间, 20:增加的秒数（可以是负数）, new Cesium.JulianDate():结果存储的对象
const stop = Cesium.JulianDate.addSeconds(start, 50, new Cesium.JulianDate());

// 一个“按时间存储位置，并能自动插值计算中间位置”的属性对象
const position = new Cesium.SampledPositionProperty();
const startPosition = new Cesium.Cartesian3(
  -2379556.799372864,
  -4665528.205030263,
  3628013.106599678
);
const endPosition = new Cesium.Cartesian3(-2379603.7074103747, -4665623.48990283, 3627860.82704567);

// 计算关键帧，并把它们添加到 position 中
for (let i = 0; i < 50; i++) {
  // 生成50个关键帧，每个关键帧相隔1秒
  //   time:每一个关键帧的时间点, 通过在起始时间上加上 i 秒来计算
  const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());

  //   计算当前关键帧所在时间点 对应的位置
  //   lerp函数，在开始位置和结束位置之间，按照比例，计算出一个插值位置
  //   i / 50：当前关键帧所在时间点 相对于50个关键帧的占比，类似于一个进度百分比
  //   一段路程，一共50个关键帧，那就要确定第x个关键帧时，应该处于这段路程中的哪个位置
  // 可以简单理解为把这段路程划分成了50段，那么第x个关键帧时，应该处于这段路程中的第x段
  const interpolatedPosition = Cesium.Cartesian3.lerp(
    startPosition,
    endPosition,
    i / 50,
    new Cesium.Cartesian3()
  );
  position.addSample(time, interpolatedPosition);
}
// 添加最后的关键帧
position.addSample(stop, endPosition);
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 循环播放

  viewer.clock.multiplier = 5; // 时间加速
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
};
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
