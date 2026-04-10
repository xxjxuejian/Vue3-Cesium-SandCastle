// CesiumRuntime.ts
import type * as Cesium from "cesium";

export class CesiumRuntime {
  private viewer: Cesium.Viewer;

  private entities = new Set<Cesium.Entity>();
  private primitives = new Set<Cesium.Primitive>();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  // ========================
  // Entity 管理
  // ========================
  addEntity(options: Cesium.Entity.ConstructorOptions) {
    const entity = this.viewer.entities.add(options);
    this.entities.add(entity);
    return entity;
  }

  removeEntity(entity: Cesium.Entity) {
    this.viewer.entities.remove(entity);
    this.entities.delete(entity);
  }

  // ========================
  // Primitive 管理
  // ========================
  addPrimitive(primitive: Cesium.Primitive) {
    this.viewer.scene.primitives.add(primitive);
    this.primitives.add(primitive);
    return primitive;
  }

  removePrimitive(primitive: Cesium.Primitive) {
    this.viewer.scene.primitives.remove(primitive);
    this.primitives.delete(primitive);
  }

  // ========================
  // 清理当前示例
  // ========================
  clear() {
    this.viewer.trackedEntity = undefined;

    this.entities.forEach((e) => this.viewer.entities.remove(e));
    this.primitives.forEach((p) => this.viewer.scene.primitives.remove(p));

    this.entities.clear();
    this.primitives.clear();
  }

  // ========================
  // 相机控制（顺手加一个很有用）
  // ========================
  flyTo(target: Cesium.Entity) {
    this.viewer.flyTo(target);
  }

  // ========================
  // 获取 Viewer
  // ========================
  getViewer() {
    return this.viewer;
  }

  // ========================
  // 设置当前追踪的 Entity
  // ========================
  setTrackedEntity(entity?: Cesium.Entity) {
    this.viewer.trackedEntity = entity;
  }
}
