import * as Cesium from "cesium";

export interface CameraFlyOptions {
  destination?: Cesium.Cartesian3 | Cesium.Rectangle;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
  duration?: number;
  complete?: Cesium.Camera.FlightCompleteCallback;
  cancel?: Cesium.Camera.FlightCancelledCallback;
  endTransform?: Cesium.Matrix4;
  maximumHeight?: number;
  pitchAdjustHeight?: number;
  flyOverLongitude?: number;
  flyOverLongitudeWeight?: number;
  convert?: boolean;
  easingFunction?: Cesium.EasingFunction;
}
