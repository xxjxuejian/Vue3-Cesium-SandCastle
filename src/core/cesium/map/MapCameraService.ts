import * as Cesium from "cesium";
import type { MapFlyToPointOptions, MapHomeView, MapPoint } from "./types";

export class MapCameraService {
  private readonly viewer: Cesium.Viewer;
  private homeView: MapHomeView;

  constructor(viewer: Cesium.Viewer, homeView: MapHomeView) {
    this.viewer = viewer;
    this.homeView = homeView;
  }

  setHomeView(homeView: MapHomeView) {
    this.homeView = homeView;
  }

  resetView(duration = 0.8) {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        this.homeView.lon,
        this.homeView.lat,
        this.homeView.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(this.homeView.heading ?? 0),
        pitch: Cesium.Math.toRadians(this.homeView.pitch ?? -90),
        roll: Cesium.Math.toRadians(this.homeView.roll ?? 0),
      },
      duration,
    });
  }

  flyToPoint(point: MapPoint, options: MapFlyToPointOptions = {}) {
    const target = Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.height ?? 0);

    this.viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(options.heading ?? 0),
        Cesium.Math.toRadians(options.pitch ?? -60),
        options.height ?? 2500
      ),
      duration: options.duration ?? 0.8,
    });
  }

  zoomIn() {
    this.viewer.camera.zoomIn(this.getZoomAmount());
  }

  zoomOut() {
    this.viewer.camera.zoomOut(this.getZoomAmount());
  }

  private getZoomAmount() {
    const height = this.viewer.camera.positionCartographic.height;
    return Math.max(height * 0.35, 100);
  }
}
