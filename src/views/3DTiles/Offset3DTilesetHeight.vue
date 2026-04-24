<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

const mapConfig: Cesium.Viewer.ConstructorOptions = {
  shadows: true, //开启阴影效果
};
let viewer: Cesium.Viewer;
let tileset: Cesium.Cesium3DTileset;
// 3D Tileset URL
const tilesetUrl =
  import.meta.env.BASE_URL + "SampleData/Cesium3DTiles/Tilesets/Tileset/tileset.json";

const minHeight = -100; // 最小高度
const maxHeight = 100; // 最大高度
const height = ref<number>(0); // 当前高度
const safeHeight = computed({
  get() {
    return height.value;
  },
  set(value) {
    const h = Number(value);
    if (isNaN(h)) {
      height.value = 0;
      return;
    }
    height.value = Math.min(Math.max(h, minHeight), maxHeight);
  },
});

const handleMapLoaded = (vw: Cesium.Viewer) => {
  console.log("Cesium 示例已加载:", vw);
  viewer = vw;

  loadTileset(viewer);
};

// 加载 3D Tileset
async function loadTileset(viewer: Cesium.Viewer) {
  if (!viewer) return;
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
    viewer.scene.primitives.add(tileset);
    viewer.scene.globe.depthTestAgainstTerrain = true; // 开启地形深度检测。
    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(0.0, -0.5, tileset.boundingSphere.radius * 2.0)
    );
  } catch (error) {
    console.error("加载 3D Tileset 失败:", error);
  }
}

// 更新 3D Tileset 的高度
function updateTilesetHeight(height: number) {
  // 把模型中心点从笛卡尔坐标转换成经纬度坐标。
  //   tileset.boundingSphere.center 是模型包围球的中心点。类型是Cartesian3，三维空间坐标，类似 x、y、z。
  //   cartographic ：地理坐标，包含经度、纬度、高度。
  const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
  //   根据模型中心点的经纬度，计算地表位置。
  const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
  //   根据同样的经纬度，计算目标高度位置。高度来自用户输入
  const offset = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    height
  );
  //   计算“目标高度点”和“地表点”之间的差值。模型应该整体向上或向下移动多少。
  const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
  //   把平移矩阵赋值给 tileset。整个 3D Tiles 模型按照 translation 这个向量移动。
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

watch(height, (newHeight) => {
  if (tileset) {
    updateTilesetHeight(newHeight);
  }
});
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />

    <!-- toolbar -->
    <div class="absolute-lt p-4 z-10 text-toolbar-text bg-toolbar-bg rounded">
      <div>height</div>
      <div class="flex items-center gap-x-4">
        <el-slider v-model="height" :min="minHeight" :max="maxHeight" style="width: 100px" />
        <el-input v-model="safeHeight" style="width: 70px" :min="minHeight" :max="maxHeight" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
