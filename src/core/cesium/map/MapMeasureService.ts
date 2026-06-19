import * as Cesium from "cesium";
import type { MapPoint, MeasureMode } from "./types";

type MeasureChangeHandler = (state: { activeMode: MeasureMode | null; hasResult: boolean }) => void;

export class MapMeasureService {
  private readonly viewer: Cesium.Viewer;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private activeMode: MeasureMode | null = null;
  private points: MapPoint[] = [];
  private cursorPoint: MapPoint | null = null;
  private retainedEntities = new Set<Cesium.Entity>();
  private previewEntities = new Set<Cesium.Entity>();
  private onChange?: MeasureChangeHandler;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  setChangeHandler(handler: MeasureChangeHandler) {
    this.onChange = handler;
  }

  getActiveMode() {
    return this.activeMode;
  }

  hasResult() {
    return this.retainedEntities.size > 0;
  }

  start(mode: MeasureMode) {
    this.cancelActiveMeasure();
    this.activeMode = mode;
    this.points = [];
    this.cursorPoint = null;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction(
      (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => this.handleLeftClick(event),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    this.handler.setInputAction(
      (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => this.handleMouseMove(event),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(() => this.finish(), Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.notifyChange();
  }

  clear() {
    this.cancelActiveMeasure();
    this.retainedEntities.forEach((entity) => this.viewer.entities.remove(entity));
    this.retainedEntities.clear();
    this.notifyChange();
  }

  destroy() {
    this.clear();
  }

  private handleLeftClick(event: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    const point = this.getScenePoint(event.position);
    if (!point) return;

    this.points = [...this.points, point];
    this.cursorPoint = point;
    this.addPointEntity(point, true);
    this.ensurePreviewEntity();

    if (this.activeMode === "area" && this.points.length >= 3) {
      this.renderAreaLabel(this.getActivePoints());
    }
  }

  private handleMouseMove(event: Cesium.ScreenSpaceEventHandler.MotionEvent) {
    if (this.points.length === 0) return;

    const point = this.getScenePoint(event.endPosition);
    if (!point) return;

    this.cursorPoint = point;
  }

  private finish() {
    if (!this.activeMode) return;

    const finalPoints = [...this.points];
    const mode = this.activeMode;
    this.cancelActiveMeasure(false);

    if (mode === "distance" && finalPoints.length >= 2) {
      this.renderDistanceResult(finalPoints);
    }

    if (mode === "area" && finalPoints.length >= 3) {
      this.renderAreaResult(finalPoints);
    }

    this.notifyChange();
  }

  private cancelActiveMeasure(shouldNotify = true) {
    this.handler?.destroy();
    this.handler = null;
    this.activeMode = null;
    this.points = [];
    this.cursorPoint = null;

    this.previewEntities.forEach((entity) => this.viewer.entities.remove(entity));
    this.previewEntities.clear();

    if (shouldNotify) this.notifyChange();
  }

  private ensurePreviewEntity() {
    if (!this.activeMode || this.previewEntities.size > 1) return;

    if (this.activeMode === "distance") {
      const entity = this.viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            return this.toCartesianPositions(this.getActivePoints());
          }, false),
          width: 3,
          material: Cesium.Color.fromCssColorString("#00d4ff"),
          clampToGround: true,
        },
      });
      this.previewEntities.add(entity);
      return;
    }

    const boundary = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const points = this.closePoints(this.getActivePoints());
          return this.toCartesianPositions(points);
        }, false),
        width: 3,
        material: Cesium.Color.fromCssColorString("#00d4ff"),
        clampToGround: true,
      },
    });
    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          return new Cesium.PolygonHierarchy(this.toCartesianPositions(this.getActivePoints()));
        }, false),
        material: Cesium.Color.fromCssColorString("#00d4ff").withAlpha(0.18),
      },
    });
    this.previewEntities.add(boundary);
    this.previewEntities.add(polygon);
  }

  private renderDistanceResult(points: MapPoint[]) {
    const line = this.viewer.entities.add({
      polyline: {
        positions: this.toCartesianPositions(points),
        width: 3,
        material: Cesium.Color.fromCssColorString("#00d4ff"),
        clampToGround: true,
      },
    });
    this.retainedEntities.add(line);

    points.forEach((point) => this.addPointEntity(point, false));

    const distance = this.getTotalDistance(points);
    this.addLabelEntity(points[points.length - 1], `距离 ${this.formatDistance(distance)}`);
  }

  private renderAreaResult(points: MapPoint[]) {
    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(this.toCartesianPositions(points)),
        material: Cesium.Color.fromCssColorString("#00d4ff").withAlpha(0.18),
      },
    });
    const boundary = this.viewer.entities.add({
      polyline: {
        positions: this.toCartesianPositions(this.closePoints(points)),
        width: 3,
        material: Cesium.Color.fromCssColorString("#00d4ff"),
        clampToGround: true,
      },
    });
    this.retainedEntities.add(polygon);
    this.retainedEntities.add(boundary);
    points.forEach((point) => this.addPointEntity(point, false));
    this.addLabelEntity(
      this.getCenterPoint(points),
      `面积 ${this.formatArea(this.getArea(points))}`
    );
  }

  private renderAreaLabel(points: MapPoint[]) {
    if (points.length < 3) return;
  }

  private addPointEntity(point: MapPoint, preview: boolean) {
    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.height ?? 1),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString("#00d4ff"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    if (preview) {
      this.previewEntities.add(entity);
    } else {
      this.retainedEntities.add(entity);
    }
  }

  private addLabelEntity(point: MapPoint, text: string) {
    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.height ?? 20),
      label: {
        text,
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    this.retainedEntities.add(entity);
  }

  private getScenePoint(position: Cesium.Cartesian2): MapPoint | null {
    const pickedPosition = this.viewer.scene.pickPositionSupported
      ? this.viewer.scene.pickPosition(position)
      : undefined;
    const cartesian = Cesium.defined(pickedPosition)
      ? pickedPosition
      : this.viewer.camera.pickEllipsoid(position, this.viewer.scene.globe.ellipsoid);

    if (!cartesian) return null;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    return {
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      height: 0,
    };
  }

  private getActivePoints() {
    if (!this.cursorPoint || this.points.length === 0) return this.points;
    return [...this.points, this.cursorPoint];
  }

  private toCartesianPositions(points: MapPoint[]) {
    return Cesium.Cartesian3.fromDegreesArrayHeights(
      points.flatMap((point) => [point.lon, point.lat, point.height ?? 0])
    );
  }

  private closePoints(points: MapPoint[]) {
    if (points.length === 0) return [];
    return [...points, points[0]];
  }

  private getTotalDistance(points: MapPoint[]) {
    return points.slice(1).reduce((total, point, index) => {
      return total + this.getDistance(points[index], point);
    }, 0);
  }

  private getDistance(start: MapPoint, end: MapPoint) {
    const startCartographic = Cesium.Cartographic.fromDegrees(start.lon, start.lat);
    const endCartographic = Cesium.Cartographic.fromDegrees(end.lon, end.lat);
    return new Cesium.EllipsoidGeodesic(startCartographic, endCartographic).surfaceDistance;
  }

  private getArea(points: MapPoint[]) {
    if (points.length < 3) return 0;

    const origin = points[0];
    const originCartesian = Cesium.Cartesian3.fromDegrees(origin.lon, origin.lat);
    const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(originCartesian);
    const inverseFrame = Cesium.Matrix4.inverse(localFrame, new Cesium.Matrix4());
    const localPoints = points.map((point) => {
      const cartesian = Cesium.Cartesian3.fromDegrees(point.lon, point.lat);
      return Cesium.Matrix4.multiplyByPoint(inverseFrame, cartesian, new Cesium.Cartesian3());
    });

    const area = localPoints.reduce((total, point, index) => {
      const next = localPoints[(index + 1) % localPoints.length];
      return total + point.x * next.y - next.x * point.y;
    }, 0);

    return Math.abs(area) / 2;
  }

  private getCenterPoint(points: MapPoint[]): MapPoint {
    const total = points.reduce(
      (result, point) => {
        result.lon += point.lon;
        result.lat += point.lat;
        return result;
      },
      { lon: 0, lat: 0 }
    );

    return {
      lon: total.lon / points.length,
      lat: total.lat / points.length,
      height: 20,
    };
  }

  private formatDistance(value: number) {
    return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${value.toFixed(1)} m`;
  }

  private formatArea(value: number) {
    return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)} km²` : `${value.toFixed(1)} m²`;
  }

  private notifyChange() {
    this.onChange?.({
      activeMode: this.activeMode,
      hasResult: this.hasResult(),
    });
  }
}
