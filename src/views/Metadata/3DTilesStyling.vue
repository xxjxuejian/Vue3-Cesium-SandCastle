<script setup lang="ts">
/**
 *  3D Tiles 的层次化元数据（Batch Table Hierarchy）管理与动态样式化渲染。
 * Shows how to style 3D Tiles by hierarchical class and properties (e.g., buildings → doors → doorknobs).
 * Demonstrates 3D Tiles Style predicates like `isClass` and `isExactClass` and coloring or filtering by element property data.
 * 演示了如何利用 3D 模型内部自带的“身份信息”（元数据）来控制模型的外观，并且处理具有“父子继承关系”的复杂构件。
 */
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

//   定义样式的接口。
interface StyleOption {
  name: string;
  //   style: Cesium.Cesium3DTileStyle.ConstructorOptions;  // ×
  // 提取 Cesium3DTileStyle 构造函数的第一个参数类型
  style: ConstructorParameters<typeof Cesium.Cesium3DTileStyle>[0]; // √
  //   style: any; // √
}

const vwConfig: Cesium.Viewer.ConstructorOptions = {
  infoBox: true,
  selectionIndicator: false, // 禁用选择指示器,就是鼠标点击时的那个聚焦框
};
let viewer: Cesium.Viewer | null = null;
let tileSet: Cesium.Cesium3DTileset | null = null;

const tileSetUrl =
  import.meta.env.BASE_URL + "/SampleData/Cesium3DTiles/Hierarchy/BatchTableHierarchy/tileset.json";

// 2. 样式数据定义
const styles: StyleOption[] = [
  {
    name: "Color all doors",
    style: {
      color: {
        conditions: [
          ["isExactClass('door')", "color('orange')"],
          ["true", "color('white')"],
        ],
      },
    },
  },
  {
    name: "Color all features derived from door",
    style: {
      color: {
        conditions: [
          ["isClass('door')", "color('orange')"],
          ["true", "color('white')"],
        ],
      },
    },
  },
  {
    name: "Color by building",
    style: {
      color: {
        conditions: [
          ["${building_name} === 'building0'", "color('purple')"],
          ["${building_name} === 'building1'", "color('red')"],
          ["${building_name} === 'building2'", "color('orange')"],
          ["true", "color('blue')"],
        ],
      },
    },
  },
  {
    name: "Color features by class name",
    style: {
      defines: {
        suffix: "regExp('door(.*)').exec(getExactClassName())",
      },
      color: {
        conditions: [
          ["${suffix} === 'knob'", "color('yellow')"],
          ["${suffix} === ''", "color('lime')"],
          ["${suffix} === null", "color('gray')"],
          ["true", "color('blue')"],
        ],
      },
    },
  },
  {
    name: "Style by height",
    style: {
      color: {
        conditions: [
          ["${height} >= 10", "color('purple')"],
          ["${height} >= 6", "color('red')"],
          ["${height} >= 5", "color('orange')"],
          ["true", "color('blue')"],
        ],
      },
    },
  },
  {
    name: "No style",
    style: {},
  },
];
// 响应式变量存储当前选中的样式索引
const currentStyleIndex = ref<number>(0);
// 加载3d tileset
async function loadTileset() {
  if (!viewer) return;
  try {
    tileSet = await Cesium.Cesium3DTileset.fromUrl(tileSetUrl);

    viewer.scene.primitives.add(tileSet);
    viewer.zoomTo(tileSet, new Cesium.HeadingPitchRange(0.0, -0.3, 0.0));
    tileSet.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: [
          ["isExactClass('door')", "color('orange')"],
          ["true", "color('white')"],
        ],
      },
    });
  } catch (error) {
    console.log(`Error loading tileset: ${error}`);
  }
}

function setStyle(index: number) {
  if (!Cesium.defined(tileSet)) {
    return;
  }

  tileSet.style = new Cesium.Cesium3DTileStyle(styles[index].style);
}

// 事件监听 (点击拾取)
function setupEventListeners() {
  if (!viewer) return;

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  //   鼠标左键点击，仅仅做输出用，不影响点击的效果
  //   handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
  //     const feature = viewer?.scene.pick(movement.position);
  //     if (feature instanceof Cesium.Cesium3DTileFeature) {
  //       console.log(`Class: ${feature.getExactClassName()}`);
  //       const propertyIds = feature.getPropertyIds();
  //       propertyIds.forEach((id) => {
  //         console.log(`  ${id}: ${feature.getProperty(id)}`);
  //       });
  //     }
  //   }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const feature = viewer?.scene.pick(movement.position);
    if (feature instanceof Cesium.Cesium3DTileFeature) {
      feature.show = false;
    }
  }, Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
}

const handleMapLoaded = async (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);

  await loadTileset();
  // 应用默认选中的样式
  setStyle(currentStyleIndex.value);

  setupEventListeners();
};
// 样式切换
const handleStyleChange = (index: number) => {
  setStyle(index);
};

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
    tileSet = null;
  }
});
</script>

<template>
  <div class="relative wh-full">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded" />

    <!-- tools panel -->
    <div class="absolute-lt p-2">
      <el-select
        v-model="currentStyleIndex"
        placeholder="Select"
        style="width: 240px"
        @change="handleStyleChange"
      >
        <el-option v-for="(item, index) in styles" :key="index" :label="item.name" :value="index" />
      </el-select>
    </div>

    <!-- tips -->
    <div
      class="absolute top-0 left-0 right-0 mx-auto text-white bg-black p-2 w-[500px] text-center"
    >
      <div>利用 3D 模型内部自带的“身份信息”（元数据）来控制模型的外观</div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
