<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const vwConfig: Cesium.Viewer.ConstructorOptions = {
  infoBox: false,
  selectionIndicator: false,
  shadows: true,
  shouldAnimate: true,
};

let viewer: Cesium.Viewer | null = null;
let scene: Cesium.Scene | null = null;

const longitude = -2.1480545852753163;
const latitude = 0.7688240036937101;
const range = 0.000001;
// 持续时间，代表多少秒之内，完成一次循环
const duration = 4.0;

let pointEntity: Cesium.Entity | undefined;
const cartographic = new Cesium.Cartographic();
const objectsToExclude: Cesium.Entity[] = [];
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  scene = viewer.scene;
  scene.globe.depthTestAgainstTerrain = true;
  if (!scene.sampleHeightSupported) {
    window.alert("This browser does not support sampleHeight.");
  }
  loadModel();
};

function loadModel() {
  if (!viewer) return;
  // 加载汽车模型
  const modelUrl = import.meta.env.BASE_URL + "/SampleData/models/GroundVehicle/GroundVehicle.glb";
  const vehicle = viewer.entities.add({
    position: Cesium.Cartesian3.fromRadians(longitude, latitude),
    model: {
      uri: modelUrl,
    },
  });
  viewer.trackedEntity = vehicle;

  // 加载point实体
  // point实体需要动态更新位置
  pointEntity = viewer.entities.add({
    position: new Cesium.CallbackProperty(updatePosition as any, false) as any,
    point: {
      pixelSize: 10,
      color: Cesium.Color.YELLOW,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      show: false,
      showBackground: true,
      font: "14px monospace",
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(5, 5),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  if (pointEntity) {
    objectsToExclude.push(pointEntity);
  }
}

/*
实时更新位置的回调函数：
人为规定的：点point实体的移动范围是[longitude - range, longitude + range]
  这个范围正好刚刚囊括了汽车模型
  范围确定以后，就要知道每一帧点实体 point 应该处于这个范围的哪个位置
  所以需要一个变量 offset 来保存当前时间在整个周期中的位置
*/
function updatePosition(time: Cesium.JulianDate, result?: Cesium.Cartesian3): Cesium.Cartesian3 {
  // (time.secondsOfDay % duration) 取余数，结果不会超过duration的值: [0,4)之间的浮点数
  // 再除以duration的值，结果会变成一个在[0,1)之间的浮点数，表示当前时间在整个周期中的位置
  const offset = (time.secondsOfDay % duration) / duration;
  cartographic.longitude = longitude - range + offset * range * 2.0;
  cartographic.latitude = latitude;

  let height;
  if (scene && scene.sampleHeightSupported) {
    height = scene.sampleHeight(cartographic, objectsToExclude);
  }

  if (pointEntity?.label) {
    if (Cesium.defined(height)) {
      cartographic.height = height;
      (pointEntity.label.text as any) = `${Math.abs(height).toFixed(2).toString()} m`;
      (pointEntity.label.show as any) = true;
    } else {
      cartographic.height = 0.0;
      (pointEntity.label.show as any) = false;
    }
  }

  return Cesium.Cartographic.toCartesian(cartographic, Cesium.Ellipsoid.WGS84, result);
}
</script>

<template>
  <div class="wh-full relative">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
