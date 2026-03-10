<script setup lang="ts">
// This example illustrates the possible tracking reference frames
// apllied to two different entities: a near surface slow moving
// object and a satellite
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerInstance = shallowRef<Cesium.Viewer | null>(null);
const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  // 配置项
  terrain: Cesium.Terrain.fromWorldTerrain(), //使用 Cesium 全球地形
  shouldAnimate: true, // 开启时间动画：时间轴会自动播放，实体会按照时间运动。
  // infoBox: true,
};

const selectValue = ref("Auto-detect");
const selectOptions = [
  {
    label: "Tracking reference frame: Auto-detect",
    value: "Auto-detect",
  },
  {
    label: "Tracking reference frame: Inertial",
    value: "Inertial",
  },
  {
    label: "Tracking reference frame: Velocity",
    value: "Velocity",
  },
  {
    label: "Tracking reference frame: East-North-Up",
    value: "East-North-Up",
  },
];
// 动画开始时间
const startTime = Cesium.JulianDate.fromIso8601("2012-03-15T10:00:00Z");
// 卫星模拟结束时间
const satelliteStopTime = Cesium.JulianDate.fromIso8601("2012-03-16T10:00:00Z");
// 无人机模拟结束时间
const droneStopTime = Cesium.JulianDate.fromIso8601("2012-03-15T10:00:30Z");
let satellite: Cesium.Entity | undefined; // 卫星实体
let drone: Cesium.Entity | undefined; // 无人机实体

const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);
  viewerInstance.value = viewer;

  await loadDataSource(viewer);
};

// 加载数据源
async function loadDataSource(viewer: Cesium.Viewer) {
  const dataSource = await viewer.dataSources.add(
    Cesium.CzmlDataSource.load(import.meta.env.BASE_URL + "SampleData/tracking.czml")
  );
  //  getById()返回值是 Entity|undefined
  satellite = dataSource.entities.getById("Satellite/ISS");
  drone = dataSource.entities.getById("CesiumDrone");

  // 定义相机跟踪实体时的默认位置偏移。
  // 相机相对于卫星的位置：x:-300,y:20,z:100； 相当于 相机在卫星后上方
  satellite.viewFrom = new Cesium.Cartesian3(-300, 20, 100);
  drone.viewFrom = new Cesium.Cartesian3(-50, 0, 5);
}

// 跟踪实体, 卫星或者是无人机
const handleTrackEntity = (type: string = "Satellites") => {
  if (!viewerInstance.value) return;
  const viewer = viewerInstance.value;

  viewer.clock.currentTime = startTime;
  switch (type) {
    case "Satellites":
      // 时间范围：startTime -> satelliteStopTime
      viewer.clock.stopTime = satelliteStopTime;
      viewer.clock.multiplier = 30;
      // 时间轴缩放
      viewer.timeline.zoomTo(startTime, satelliteStopTime);
      // 相机自动跟随 entity
      viewer.trackedEntity = satellite;
      break;
    case "Drone":
      viewer.clock.stopTime = droneStopTime;
      viewer.clock.multiplier = 1;
      viewer.timeline.zoomTo(startTime, droneStopTime);
      viewer.trackedEntity = drone;
      break;
    default:
      break;
  }
};

//切换不同 参考坐标系（reference frame）
const handleChangeTrackFrame = (value: string) => {
  if (!viewerInstance.value) return;

  switch (value) {
    case "Auto-detect": //自动判断
      satellite.trackingReferenceFrame = Cesium.TrackingReferenceFrame.AUTODETECT;
      drone.trackingReferenceFrame = Cesium.TrackingReferenceFrame.AUTODETECT;
      break;
    case "Inertial": // 惯性坐标系
      satellite.trackingReferenceFrame = Cesium.TrackingReferenceFrame.INERTIAL;
      drone.trackingReferenceFrame = Cesium.TrackingReferenceFrame.INERTIAL;
      break;
    case "Velocity": // 速度方向
      satellite.trackingReferenceFrame = Cesium.TrackingReferenceFrame.VELOCITY;
      drone.trackingReferenceFrame = Cesium.TrackingReferenceFrame.VELOCITY;
      break;
    case "East-North-Up": // 东北上
      satellite.trackingReferenceFrame = Cesium.TrackingReferenceFrame.ENU;
      drone.trackingReferenceFrame = Cesium.TrackingReferenceFrame.ENU;
      break;
    default:
      break;
  }
};
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt bg-[#36393f] p-2 z-10 rounded-md">
      <el-button @click="handleTrackEntity('Satellites')">Satellites</el-button>
      <el-button class="mr-3" @click="handleTrackEntity('Drone')">Drone</el-button>
      <el-select
        v-model="selectValue"
        placeholder="Select"
        style="width: 300px"
        @change="handleChangeTrackFrame"
      >
        <el-option
          v-for="item in selectOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
