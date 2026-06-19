<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { RefreshLeft, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

interface DetectionStation {
  id: string;
  name: string;
  lon: number;
  lat: number;
  radius: number;
}

interface AirTarget {
  id: string;
  name: string;
  lon: number;
  lat: number;
  heading: number;
  speed: number;
  status: "normal" | "detected" | "warning";
  entity?: Cesium.Entity;
}

const vwConfig: Cesium.Viewer.ConstructorOptions = {
  infoBox: false,
  selectionIndicator: false,
};

const viewer = shallowRef<Cesium.Viewer | null>(null);
const simulationTimer = shallowRef<number | null>(null);
const simulationRunning = ref(false);
const scanAngle = ref(0);

const station: DetectionStation = {
  id: "station-01",
  name: "低空探测站",
  lon: 116.396992,
  lat: 39.918481,
  radius: 1200,
};

const initialTargets: AirTarget[] = [
  {
    id: "uav-01",
    name: "无人机 A",
    lon: 116.3856,
    lat: 39.9148,
    heading: 58,
    speed: 34,
    status: "normal",
  },
  {
    id: "uav-02",
    name: "无人机 B",
    lon: 116.4078,
    lat: 39.9261,
    heading: 218,
    speed: 27,
    status: "normal",
  },
  {
    id: "uav-03",
    name: "无人机 C",
    lon: 116.3992,
    lat: 39.9072,
    heading: 10,
    speed: 22,
    status: "normal",
  },
];

const targets = ref<AirTarget[]>(initialTargets.map((target) => ({ ...target })));
const stationEntities: Cesium.Entity[] = [];

const detectedCount = computed(() => {
  return targets.value.filter((target) => target.status !== "normal").length;
});

const statusLabelMap: Record<AirTarget["status"], string> = {
  normal: "正常",
  detected: "已发现",
  warning: "告警",
};

const statusTypeMap: Record<AirTarget["status"], "success" | "warning" | "danger"> = {
  normal: "success",
  detected: "warning",
  warning: "danger",
};

const getStatusLabel = (status: AirTarget["status"]) => statusLabelMap[status];

const getStatusType = (status: AirTarget["status"]) => statusTypeMap[status];

const getDistanceMeters = (lon: number, lat: number) => {
  const start = Cesium.Cartographic.fromDegrees(station.lon, station.lat);
  const end = Cesium.Cartographic.fromDegrees(lon, lat);
  const geodesic = new Cesium.EllipsoidGeodesic(start, end);
  return geodesic.surfaceDistance;
};

const getTargetColor = (status: AirTarget["status"]) => {
  if (status === "warning") return Cesium.Color.RED;
  if (status === "detected") return Cesium.Color.YELLOW;
  return Cesium.Color.LIME;
};

const updateTargetStatus = (target: AirTarget) => {
  const distance = getDistanceMeters(target.lon, target.lat);

  if (distance < station.radius * 0.45) {
    target.status = "warning";
    return;
  }

  target.status = distance < station.radius ? "detected" : "normal";
};

const addStation = () => {
  if (!viewer.value) return;

  const stationPosition = Cesium.Cartesian3.fromDegrees(station.lon, station.lat, 25);

  stationEntities.push(
    viewer.value.entities.add({
      position: stationPosition,
      point: {
        pixelSize: 14,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: station.name,
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -26),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
  );

  stationEntities.push(
    viewer.value.entities.add({
      position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
      ellipse: {
        semiMajorAxis: station.radius,
        semiMinorAxis: station.radius,
        material: Cesium.Color.CYAN.withAlpha(0.16),
        outline: true,
        outlineColor: Cesium.Color.CYAN.withAlpha(0.75),
      },
    })
  );

  stationEntities.push(
    viewer.value.entities.add({
      position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
      ellipse: {
        semiMajorAxis: station.radius * 0.45,
        semiMinorAxis: station.radius * 0.45,
        material: Cesium.Color.RED.withAlpha(0.12),
        outline: true,
        outlineColor: Cesium.Color.RED.withAlpha(0.7),
      },
    })
  );
};

const createTargetEntity = (target: AirTarget) => {
  if (!viewer.value) return;

  target.entity = viewer.value.entities.add({
    position: Cesium.Cartesian3.fromDegrees(target.lon, target.lat, 120),
    point: {
      pixelSize: 11,
      color: getTargetColor(target.status),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: target.name,
      font: "13px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -24),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    path: {
      show: true,
      leadTime: 0,
      trailTime: 120,
      width: 2,
      material: Cesium.Color.WHITE.withAlpha(0.5),
    },
  });
};

const updateTargetEntity = (target: AirTarget) => {
  if (!target.entity) return;

  target.entity.position = new Cesium.ConstantPositionProperty(
    Cesium.Cartesian3.fromDegrees(target.lon, target.lat, 120)
  );

  if (target.entity.point) {
    target.entity.point.color = new Cesium.ConstantProperty(getTargetColor(target.status));
  }
};

const addTargets = () => {
  targets.value.forEach((target) => {
    updateTargetStatus(target);
    createTargetEntity(target);
  });
};

const moveTargets = () => {
  targets.value.forEach((target) => {
    const heading = Cesium.Math.toRadians(target.heading);
    const distancePerTick = target.speed;
    const metersPerDegreeLat = 111_320;
    const metersPerDegreeLon = metersPerDegreeLat * Math.cos(Cesium.Math.toRadians(target.lat));

    target.lon += (Math.sin(heading) * distancePerTick) / metersPerDegreeLon;
    target.lat += (Math.cos(heading) * distancePerTick) / metersPerDegreeLat;

    const distance = getDistanceMeters(target.lon, target.lat);
    if (distance > station.radius * 1.55) {
      target.heading = (target.heading + 150) % 360;
    }

    updateTargetStatus(target);
    updateTargetEntity(target);
  });

  scanAngle.value = (scanAngle.value + 18) % 360;
};

const startSimulation = () => {
  if (simulationTimer.value) return;

  simulationRunning.value = true;
  simulationTimer.value = window.setInterval(moveTargets, 1000);
};

const pauseSimulation = () => {
  if (!simulationTimer.value) return;

  window.clearInterval(simulationTimer.value);
  simulationTimer.value = null;
  simulationRunning.value = false;
};

const resetSimulation = () => {
  pauseSimulation();

  targets.value.forEach((target) => {
    if (target.entity) {
      viewer.value?.entities.remove(target.entity);
    }
  });

  targets.value = initialTargets.map((target) => ({ ...target }));
  addTargets();
  scanAngle.value = 0;
};

const flyToScene = () => {
  viewer.value?.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(station.lon, station.lat - 0.01, 3600),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-60),
      roll: 0,
    },
    duration: 1,
  });
};

const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer.value = viewerInstance;

  addStation();
  addTargets();
  flyToScene();
};

onBeforeUnmount(() => {
  pauseSimulation();

  stationEntities.forEach((entity) => viewer.value?.entities.remove(entity));
  targets.value.forEach((target) => {
    if (target.entity) viewer.value?.entities.remove(target.entity);
  });
});
</script>

<template>
  <div class="relative wh-full overflow-hidden">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded" />

    <el-card class="absolute left-4 top-4 z-10 w-92" shadow="always">
      <template #header>
        <div class="flex items-center justify-between">
          <span>探测仿真</span>
          <el-tag :type="detectedCount > 0 ? 'danger' : 'success'">
            {{ detectedCount }} 个目标
          </el-tag>
        </div>
      </template>

      <div class="mb-3 flex gap-2">
        <el-button
          v-if="!simulationRunning"
          type="primary"
          :icon="VideoPlay"
          @click="startSimulation"
        >
          开始
        </el-button>
        <el-button v-else type="warning" :icon="VideoPause" @click="pauseSimulation">
          暂停
        </el-button>
        <el-button :icon="RefreshLeft" @click="resetSimulation">重置</el-button>
      </div>

      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="探测站">{{ station.name }}</el-descriptions-item>
        <el-descriptions-item label="探测半径">{{ station.radius }} 米</el-descriptions-item>
        <el-descriptions-item label="扫描角度">{{ scanAngle }}°</el-descriptions-item>
      </el-descriptions>

      <el-table :data="targets" class="mt-3" size="small" border>
        <el-table-column prop="name" label="目标" min-width="86" show-overflow-tooltip />
        <el-table-column label="速度" width="74" align="center">
          <template #default="{ row }">{{ row.speed }}m/s</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
