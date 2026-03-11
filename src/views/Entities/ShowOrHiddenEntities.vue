<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

let entities: Cesium.EntityCollection;
let boxes: Cesium.Entity;
let ellipsoids: Cesium.Entity;
let spheres: Cesium.Entity;
const handleMapLoaded = async (viewer: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", viewer);

  loadEntities(viewer);
};

function loadEntities(viewer: Cesium.Viewer) {
  entities = viewer.entities;
  //Create Entity "folders" to allow us to turn on/off entities as a group.
  //   充当“父节点 / 分组节点”。
  spheres = entities.add(new Cesium.Entity());
  boxes = entities.add(new Cesium.Entity());
  ellipsoids = entities.add(new Cesium.Entity());

  //Create the entities and assign each entity's parent to the group to which it belongs.
  for (let i = 0; i < 5; ++i) {
    const height = 100000.0 + 200000.0 * i;
    entities.add({
      parent: boxes,
      position: Cesium.Cartesian3.fromDegrees(-106.0, 45.0, height),
      box: {
        dimensions: new Cesium.Cartesian3(90000.0, 90000.0, 90000.0),
        material: Cesium.Color.fromRandom({ alpha: 1.0 }),
      },
    });

    entities.add({
      parent: ellipsoids,
      position: Cesium.Cartesian3.fromDegrees(-102.0, 45.0, height),
      ellipsoid: {
        radii: new Cesium.Cartesian3(45000.0, 45000.0, 90000.0),
        material: Cesium.Color.fromRandom({ alpha: 1.0 }),
      },
    });

    entities.add({
      parent: spheres,
      position: Cesium.Cartesian3.fromDegrees(-98.0, 45.0, height),
      ellipsoid: {
        radii: new Cesium.Cartesian3(67500.0, 67500.0, 67500.0),
        material: Cesium.Color.fromRandom({ alpha: 1.0 }),
      },
    });
  }

  viewer.zoomTo(viewer.entities);
}

const handleToggleEntities = (type: string) => {
  // 通过分组节点，直接批量控制实体的显示隐藏，而不需要一个个去控制实体
  // 如果使用数组，就必须遍历数组，一个个去控制实体的显示隐藏，效率较低
  switch (type) {
    case "boxes":
      boxes.show = !boxes.show;
      break;
    case "ellipsoids":
      ellipsoids.show = !ellipsoids.show;
      break;
    case "spheres":
      spheres.show = !spheres.show;
      break;
  }
};
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt z-10 bg-[#1f2023] p-2">
      <el-button @click="handleToggleEntities('boxes')">Toggle Boxes</el-button>
      <el-button @click="handleToggleEntities('ellipsoids')">Toggle Ellipsoids</el-button>
      <el-button @click="handleToggleEntities('spheres')">Toggle Spheres</el-button>
    </div>
    <CesiumViewer @map-loaded="handleMapLoaded"></CesiumViewer>
  </div>
</template>

<style scoped lang="scss"></style>
