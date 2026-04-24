<script setup lang="ts">
// import * as Cesium from "cesium";
// import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

// const mapConfig: Cesium.Viewer.ConstructorOptions = {
//   shadows: true, //开启阴影效果
// };
// let viewer: Cesium.Viewer;
// let tileset: Cesium.Cesium3DTileset;
// // 3D Tileset URL
// const tilesetUrl =
//   import.meta.env.BASE_URL + "SampleData/Cesium3DTiles/Tilesets/Tileset/tileset.json";

// const minHeight = -100; // 最小高度
// const maxHeight = 100; // 最大高度
// const height = ref<number>(0); // 当前高度

// const handleMapLoaded = (vw: Cesium.Viewer) => {
//   console.log("Cesium 示例已加载:", vw);
//   viewer = vw;

//   loadTileset(viewer);
// };

// // 加载 3D Tileset
// async function loadTileset(viewer: Cesium.Viewer) {
//   if (!viewer) return;
//   try {
//     tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
//     viewer.scene.primitives.add(tileset);
//     viewer.scene.globe.depthTestAgainstTerrain = true; // 开启地形深度检测。
//     viewer.zoomTo(
//       tileset,
//       new Cesium.HeadingPitchRange(0.0, -0.5, tileset.boundingSphere.radius * 2.0)
//     );
//   } catch (error) {
//     console.error("加载 3D Tileset 失败:", error);
//   }
// }

// // 更新 3D Tileset 的高度
// function updateTilesetHeight(height: number) {
//   const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
//   const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
//   const offset = Cesium.Cartesian3.fromRadians(
//     cartographic.longitude,
//     cartographic.latitude,
//     height
//   );
//   const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
//   tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
// }

// “数据一旦进状态，就必须是合法的”
// 监听 height 值变化
// watch(height, (newHeight) => {
//   const h = Number(newHeight);
//   if (isNaN(h) || !Cesium.defined(tileset)) {
//     return;
//   }
//   console.log("height", h);

//   const clamped = Math.min(Math.max(h, minHeight), maxHeight);
//   // 只有在“值不一样”时才改
//   if (clamped !== h) {
//     height.value = clamped;
//     return; // 避免继续往下执行
//   }

//   //   更新 3D Tileset 的高度
//   updateTilesetHeight(clamped);
// });
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <!-- <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" /> -->

    <!-- toolbar -->
    <!-- <div class="absolute-lt p-4 z-10 text-toolbar-text bg-toolbar-bg rounded">
      <div>height</div>
      <div class="flex items-center gap-x-4">
        <el-slider v-model="height" :min="minHeight" :max="maxHeight" style="width: 100px" />
        <el-input
          v-model.number="height"
          style="width: 70px"
          :min="minHeight"
          :max="maxHeight"
          type="number"
        />
      </div>
    </div> -->
  </div>
</template>

<style scoped lang="scss"></style>
