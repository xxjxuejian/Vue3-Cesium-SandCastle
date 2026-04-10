<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

// 使用 glTF 2.0 格式创建具有真实材质的 3D 模型

interface CameraView {
  id: number;
  label: string;
  time: string;
  destination: Cesium.Cartesian3;
  orientation: {
    heading: number; // 弧度
    pitch: number; // 弧度
    roll: number; // 弧度
  };
  maximumHeight?: number;
}
const VIEWS: CameraView[] = [
  {
    id: 1,
    label: "Front reflection (正面反射)",
    time: "2017-07-11T20:00:00Z",
    destination: new Cesium.Cartesian3(-1371214.9554156072, -5508700.8494476415, 2901826.794611029),
    orientation: {
      heading: Cesium.Math.toRadians(80.5354269423926),
      pitch: Cesium.Math.toRadians(-15.466062969558285),
      roll: Cesium.Math.toRadians(359.9999999526579),
    },
    maximumHeight: 100, // 可选属性，限制相机飞行的最大高度
  },
  {
    id: 2,
    label: "Three quarters sunrise (侧方日出)",
    time: "2017-07-11T11:00:00Z",
    destination: new Cesium.Cartesian3(-1371203.1456494154, -5508700.033950869, 2901802.2749172337),
    orientation: {
      heading: Cesium.Math.toRadians(67.64973594265429),
      pitch: Cesium.Math.toRadians(-8.158676059409297),
      roll: Cesium.Math.toRadians(359.9999987450017),
    },
    maximumHeight: 100,
  },
  {
    id: 3,
    label: "Top reflection (顶部反射)",
    time: "2017-07-11T12:00:00Z",
    destination: new Cesium.Cartesian3(-1371190.7755780201, -5508732.668834588, 2901827.2625979027),
    orientation: {
      heading: Cesium.Math.toRadians(68.29411482061157),
      pitch: Cesium.Math.toRadians(-33.97774554735345),
      roll: Cesium.Math.toRadians(359.9999999298912),
    },
    maximumHeight: 100,
  },
  {
    id: 4,
    label: "Upward angle side reflection (仰视侧面反射)",
    time: "2017-07-11T23:00:00Z",
    destination: new Cesium.Cartesian3(-1371052.4616855076, -5508691.745389906, 2901861.440673151),
    orientation: {
      heading: Cesium.Math.toRadians(236.4536374528137),
      pitch: Cesium.Math.toRadians(-1.3382025460115552),
      roll: Cesium.Math.toRadians(359.9999985917282),
    },
    maximumHeight: 100,
  },
];

const clock = new Cesium.Clock({
  startTime: Cesium.JulianDate.fromIso8601("2017-07-11T00:00:00Z"),
  stopTime: Cesium.JulianDate.fromIso8601("2017-07-11T24:00:00Z"),
  currentTime: Cesium.JulianDate.fromIso8601("2017-07-11T10:00:00Z"),
  clockRange: Cesium.ClockRange.LOOP_STOP,
  clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER,
  multiplier: 1000,
  shouldAnimate: true,
});

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  clockViewModel: new Cesium.ClockViewModel(clock),
  selectionIndicator: false,
  terrain: Cesium.Terrain.fromWorldTerrain(),
};
let viewer: Cesium.Viewer;
const selectedViewId = ref(1); // 默认选择第一个视角
const shadowsEnabled = ref<boolean>(false); // 是否启用阴影

function loadModel() {
  if (!viewer) return;
  const position = new Cesium.Cartesian3(-1371108.65, -5508684.08, 2901825.44);
  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(180),
    Cesium.Math.toRadians(2),
    Cesium.Math.toRadians(-6)
  );

  const entity = viewer.entities.add({
    position,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(position, hpr),
    model: {
      uri: import.meta.env.BASE_URL + "SampleData/models/GroundVehicle/GroundVehicle.glb",
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      minimumPixelSize: 128,
      maximumScale: 20,
      scale: 8.0,
      runAnimations: false,
    },
  });
  viewer.trackedEntity = entity;
}
const handleMapLoaded = async (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SUNLIGHT;

  loadModel();

  viewer.scene.camera.flyTo({
    destination: VIEWS[0].destination,
    orientation: VIEWS[0].orientation,
    duration: 5.0,
    pitchAdjustHeight: 20,
  });
};

// 切换视角
const handleViewChange = (id: number) => {
  const view = VIEWS.find((v) => v.id === id);
  if (!viewer || !view) return;

  // 飞向视角
  viewer.scene.camera.flyTo({
    destination: view.destination,
    orientation: {
      heading: Cesium.Math.toRadians(view.orientation.heading),
      pitch: Cesium.Math.toRadians(view.orientation.pitch),
      roll: Cesium.Math.toRadians(view.orientation.roll),
    },
    maximumHeight: view.maximumHeight,
    duration: 3.0,
  });

  // 更新时间
  viewer.clockViewModel.clock.currentTime = Cesium.JulianDate.fromIso8601(view.time);
};

// 切换阴影
const toggleShadows = (val: string | number | boolean) => {
  // el-switch 绑定的是 boolean，所以这里 val 实际上是 boolean
  // 为了类型安全，可以显式转换为 boolean
  if (viewer) viewer.shadows = Boolean(val);
};
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />

    <div class="absolute-lt p-2 bg-[#1f2023]">
      <div class="mb-2 flex items-center gap-2">
        <el-switch v-model="shadowsEnabled" @change="toggleShadows" />
        <span class="text-white">Shadows</span>
      </div>

      <el-select
        v-model="selectedViewId"
        placeholder="Select"
        style="width: 200px"
        @change="handleViewChange"
      >
        <el-option v-for="item in VIEWS" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
