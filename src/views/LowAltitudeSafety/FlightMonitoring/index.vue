<script setup lang="ts">
import { ref, shallowRef } from "vue";
import CesiumMapShell from "@/components/Cesium/CesiumMapShell.vue";
import PointListPanel from "./components/PointListPanel.vue";
import PointInfoDialog from "./components/PointInfoDialog.vue";
import { monitoringPoints } from "./data/monitoringPoints";
import { useFlightMarkers } from "./hooks/useFlightMarkers";
import type { MapHomeView, MapMarkerEvent } from "@/core/cesium/map/types";
import type { FlightMonitoringPoint } from "./types";
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
const selectedPoint = ref<FlightMonitoringPoint | null>(null);
const pointDialogVisible = ref(false);
const { syncMarkers } = useFlightMarkers();

const handleMapReady = () => {
  syncMarkers(mapShellRef.value, monitoringPoints);
};

const handleMarkerClick = (event: MapMarkerEvent) => {
  const point = monitoringPoints.find((item) => item.id === event.id);
  if (!point) return;

  selectedPointId.value = point.id;
  selectedPoint.value = point;
  pointDialogVisible.value = true;
};

const handlePointClick = (point: FlightMonitoringPoint) => {
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
        :points="monitoringPoints"
        :selected-point-id="selectedPointId"
        @point-click="handlePointClick"
      />
      <PointInfoDialog v-model="pointDialogVisible" :point="selectedPoint" />
    </CesiumMapShell>
  </div>
</template>

