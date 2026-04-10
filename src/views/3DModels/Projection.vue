<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";
import { CesiumRuntime } from "@/core/cesium/CesiumRuntime";

// Click the projection picker to switch between orthographic and perspective projections.
const mapConfig: Cesium.Viewer.ConstructorOptions = {
  projectionPicker: true,
};
let runtime: CesiumRuntime;
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  runtime = new CesiumRuntime(viewerInstance);
  // start with orthographic projection
  // viewerInstance.projectionPicker.viewModel.switchToOrthographic();

  // 1️⃣ 切换投影（暂时直接用 viewer）
  //@ts-ignore
  viewerInstance.projectionPicker.viewModel.switchToOrthographic();

  // 2️⃣ 创建位置 & 姿态
  const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 0.0);
  const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(135), 0.0, 0.0);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  // 3️⃣ 用 runtime 添加 entity（关键变化）
  const entity = runtime.addEntity({
    position,
    orientation,
    model: {
      uri: import.meta.env.BASE_URL + "SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb",
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });

  runtime.setTrackedEntity(entity);
};

onBeforeUnmount(() => {
  // 组件卸载前的清理工作
  runtime?.clear();
});
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
