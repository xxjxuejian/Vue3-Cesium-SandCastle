<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerRef = shallowRef<Cesium.Viewer | null>(null);
/*
    时钟（Clock）:用来控制场景当前显示的 时间（currentTime） 以及时间的流速。
    典型需求：（1）车辆、飞机等轨迹回放（2）历史数据演示，（3）仿真过程模拟/暂停/快进/循环等
*/

// Create a clock that loops on Christmas day 2013 and runs in 4000x real time.
const clock = new Cesium.Clock({
  startTime: Cesium.JulianDate.fromIso8601("2013-12-25"), //时间轴的起点
  currentTime: Cesium.JulianDate.fromIso8601("2013-12-25"), // 当前播放到的时间
  stopTime: Cesium.JulianDate.fromIso8601("2013-12-26"), // 时间轴的终点
  //到头了怎么办？（1）LOOP_STOP：播到 stopTime 后，跳回 startTime 继续播;（2）CLAMPED：到头就停;（3） UNBOUNDED：无视 stopTime，一直走
  clockRange: Cesium.ClockRange.LOOP_STOP,
  clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER, // 基于真实时间推进 × multiplier
  multiplier: 4000, // 4000 倍速
  shouldAnimate: true, // 是否“让时间动起来” ;本质就是「播放 / 暂停」开关。
});

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  clockViewModel: new Cesium.ClockViewModel(clock), // 只读属性，在创建 Viewer 直接给出
};
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewerRef.value = viewer;
  viewer.scene.globe.enableLighting = true; // 开启光照

  //   错误做法，clockViewModel只读属性，不可以创建viewer完成以后在修改
  //   viewer.clockViewModel = new Cesium.ClockViewModel(clock);
};

const handleResetTime = () => {
  if (!viewerRef.value) return;
  // 获取创建时钟时的开始时间
  const resetTime = viewerRef.value?.clockViewModel.startTime;
  viewerRef.value.clockViewModel.currentTime = resetTime;
  //   老版本 中需要这一行
  //   viewerRef.value.timeline.updateFromClock();
};
const handleSlowClock = () => {
  if (!viewerRef.value) return;
  viewerRef.value.clockViewModel.multiplier /= 2;
};
const handleSpeedUpClock = () => {
  if (!viewerRef.value) return;
  viewerRef.value.clockViewModel.multiplier *= 2;
};
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt z-10 bg-[#1f2023] p-2">
      <el-button @click="handleResetTime">Reset Current Time</el-button>
      <el-button @click="handleSlowClock">Slow Down Clock</el-button>
      <el-button @click="handleSpeedUpClock">Speed Up Clock</el-button>
    </div>

    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
