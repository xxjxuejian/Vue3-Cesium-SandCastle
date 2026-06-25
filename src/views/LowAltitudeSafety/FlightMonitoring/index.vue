<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import CesiumMapShell from "@/components/Cesium/CesiumMapShell.vue";
import PointListPanel from "./components/PointListPanel.vue";
import PointInfoDialog from "./components/PointInfoDialog.vue";
import { monitoringPoints, monitoringPointTypeOptions } from "./data/monitoringPoints";
import { useFlightMarkers } from "./hooks/useFlightMarkers";
import type { MapHomeView, MapMarkerEvent } from "@/core/cesium/map/types";
import type { MonitoringPoint, MonitoringPointType } from "./types";
import type * as Cesium from "cesium";

const HANGZHOU_HOME_VIEW: MapHomeView = {
  lon: 120.1551,
  lat: 30.2741,
  height: 18000,
  pitch: -90,
};

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  selectionIndicator: false,
  fullscreenButton: false,
  sceneModePicker: false,
  timeline: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false,
};

const mapShellRef = shallowRef<InstanceType<typeof CesiumMapShell> | null>(null);
const selectedPointId = ref<string>();
const selectedPoint = ref<MonitoringPoint | null>(null);
const pointDialogVisible = ref(false);
const visiblePointTypes = ref<MonitoringPointType[]>(
  monitoringPointTypeOptions.map((option) => option.value)
);
const { syncMarkers } = useFlightMarkers();

const visiblePoints = computed(() => {
  const visibleTypeSet = new Set(visiblePointTypes.value);
  return monitoringPoints.filter((point) => visibleTypeSet.has(point.type));
});

/**
 * 将当前类型筛选状态同步到地图点位分组。
 */
const applyMarkerGroupVisibility = () => {
  const visibleTypeSet = new Set(visiblePointTypes.value);
  monitoringPointTypeOptions.forEach((option) => {
    mapShellRef.value?.setMarkerGroupVisible(option.value, visibleTypeSet.has(option.value));
  });
};

/**
 * 地图初始化完成后创建全部点位，并应用当前分组显隐状态。
 */
const handleMapReady = async () => {
  try {
    await syncMarkers(mapShellRef.value, monitoringPoints);
    applyMarkerGroupVisibility();
  } catch (error) {
    console.error("飞行监控点位加载失败", error);
  }
};

/**
 * 处理地图点位点击并打开详情。
 *
 * @param markerEvent 地图点位业务事件。
 */
const handleMarkerClick = (markerEvent: MapMarkerEvent) => {
  const point = monitoringPoints.find((item) => item.id === markerEvent.id);
  if (!point) return;

  selectedPointId.value = point.id;
  selectedPoint.value = point;
  pointDialogVisible.value = true;
};

/**
 * 处理列表点位点击并将相机飞行至目标位置。
 *
 * @param point 被点击的点位。
 */
const handlePointClick = (point: MonitoringPoint) => {
  selectedPointId.value = point.id;
  mapShellRef.value?.flyToPoint(
    {
      lon: point.lon,
      lat: point.lat,
      height: 0,
    },
    {
      height: 2500,
    }
  );
};

watch(visiblePointTypes, () => {
  applyMarkerGroupVisibility();

  if (selectedPoint.value && !visiblePointTypes.value.includes(selectedPoint.value.type)) {
    selectedPointId.value = undefined;
    selectedPoint.value = null;
    pointDialogVisible.value = false;
  }
});
</script>

<template>
  <div class="relative wh-full overflow-hidden">
    <CesiumMapShell
      ref="mapShellRef"
      :config="viewerConfig"
      :home-view="HANGZHOU_HOME_VIEW"
      default-base-layer="tianditu-vector"
      @ready="handleMapReady"
      @marker-click="handleMarkerClick"
    >
      <PointListPanel
        v-model:visible-point-types="visiblePointTypes"
        :points="visiblePoints"
        :all-points="monitoringPoints"
        :type-options="monitoringPointTypeOptions"
        :selected-point-id="selectedPointId"
        @point-click="handlePointClick"
      />
      <PointInfoDialog v-model="pointDialogVisible" :point="selectedPoint" />
    </CesiumMapShell>
  </div>
</template>
