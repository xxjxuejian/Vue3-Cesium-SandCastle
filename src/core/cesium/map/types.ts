import type * as Cesium from "cesium";

export type BaseLayerType = "tianditu-vector" | "tianditu-image";

export type MeasureMode = "distance" | "area";

export type MapToolbarAction =
  | "zoom-in"
  | "zoom-out"
  | "reset"
  | "switch-layer"
  | "measure-distance"
  | "measure-area"
  | "clear-measure";

export interface MapHomeView {
  lon: number;
  lat: number;
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export interface MapPoint {
  lon: number;
  lat: number;
  height?: number;
}

export interface MapFlyToPointOptions {
  height?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  duration?: number;
}

export interface MarkerStyle {
  pixelSize?: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  labelColor?: string;
}

export interface MapMarkerData {
  id: string;
  position: MapPoint;
  label?: string;
  iconUrl?: string;
  style?: MarkerStyle;
  payload?: unknown;
}

export interface MapMarkerAddOptions {
  groupId?: string;
}

export interface MapMarkerEvent {
  id: string;
  entity: Cesium.Entity;
  payload?: unknown;
  position?: MapPoint;
}

export interface MapToolState {
  currentBaseLayer: BaseLayerType;
  activeMeasureMode: MeasureMode | null;
  hasMeasureResult: boolean;
}
