<script setup lang="ts">
/**
 * 主要演示了，修改模型的实体颜色，以及修改模型实体的轮廓颜色等
 */
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const vwConfig: Cesium.Viewer.ConstructorOptions = {
  infoBox: false,
  selectionIndicator: false,
  shadows: true,
  shouldAnimate: true,
};

// 模型选项定义
interface ModelOption {
  text: string;
  url: string;
  height: number;
}

// 颜色映射
const colorMap = {
  White: Cesium.Color.WHITE,
  Red: Cesium.Color.RED,
  Green: Cesium.Color.GREEN,
  Blue: Cesium.Color.BLUE,
  Yellow: Cesium.Color.YELLOW,
  Gray: Cesium.Color.GRAY,
} as const;
type ColorOption = keyof typeof colorMap;
// blend选项映射
const blendMap = {
  Highlight: Cesium.ColorBlendMode.HIGHLIGHT,
  Replace: Cesium.ColorBlendMode.REPLACE,
  Mix: Cesium.ColorBlendMode.MIX,
} as const;
type BlendOption = keyof typeof blendMap;
// type ColorOption = "White" | "Red" | "Green" | "Blue" | "Yellow" | "Gray";
// type BlendOption = "Highlight" | "Replace" | "Mix";
// 模型选项
const modelOptions: ModelOption[] = [
  { text: "Aircraft", url: "/SampleData/models/CesiumAir/Cesium_Air.glb", height: 5000 },
  { text: "Ground Vehicle", url: "/SampleData/models/GroundVehicle/GroundVehicle.glb", height: 0 },
  {
    text: "Hot Air Balloon",
    url: "/SampleData/models/CesiumBalloon/CesiumBalloon.glb",
    height: 1000,
  },
  { text: "Milk Truck", url: "/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb", height: 0 },
  { text: "Skinned Character", url: "/SampleData/models/CesiumMan/Cesium_Man.glb", height: 0 },
];

interface State {
  model: string;
  color: ColorOption;
  alpha: number;
  colorBlendMode: BlendOption;
  mix: number;
  silhouetteColor: ColorOption;
  silhouetteAlpha: number;
  silhouetteSize: number;
  shadows: boolean;
}

// 颜色列表
const colorOptions: ColorOption[] = ["White", "Red", "Green", "Blue", "Yellow", "Gray"];
const colorBlendModeOptions: BlendOption[] = ["Highlight", "Replace", "Mix"];

let viewer: Cesium.Viewer | null = null;
let currentEntity: Cesium.Entity | null;
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  updateModel();
};

/*
一个奇怪的问题是：如果设置 silhouetteAlpha: 0.66,（小数时） 然后直接修改silhouetteColor时，反而是修改了
model.color值，
但是如果把 silhouetteAlpha: 1,就正常了
即使是官网的 demo，也存在同样的问题
*/
// 控制面板数据源
const state = reactive<State>({
  model: modelOptions[0].url, // 默认地面车辆模型
  color: "Red", // 模型颜色
  alpha: 1.0, // 模型颜色不透明度
  colorBlendMode: "Highlight", // 模型颜色混合模式
  mix: 0.5, // 模型颜色混合程度参数
  silhouetteColor: "Red", // 模型轮廓颜色
  silhouetteAlpha: 1, // 模型轮廓不透明度
  silhouetteSize: 2, // 模型轮廓大小
  shadows: true,
});

function getColorBlendMode(colorBlendMode: BlendOption): number {
  return blendMap[colorBlendMode];
}

// 转换颜色字符串和透明度为 Cesium.Color
function getColor(colorName: ColorOption, alpha: number) {
  const color = colorMap[colorName];
  return Cesium.Color.fromAlpha(color, alpha);
}

// 更新或创建模型
const updateModel = () => {
  if (!viewer) return;
  viewer.entities.removeAll();

  const config = modelOptions.find((m) => m.url === state.model) || modelOptions[1];

  const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, config.height);
  const heading = Cesium.Math.toRadians(135);
  const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  currentEntity = viewer.entities.add({
    position,
    orientation,
    model: {
      uri: import.meta.env.BASE_URL + config.url,
      minimumPixelSize: 128,
      maximumScale: 20000,
      // 初始应用状态
      color: getColor(state.color, state.alpha),
      colorBlendMode: getColorBlendMode(state.colorBlendMode),
      colorBlendAmount: state.mix,
      silhouetteColor: getColor(state.silhouetteColor, state.silhouetteAlpha),
      silhouetteSize: state.silhouetteSize,
    },
  });

  viewer.trackedEntity = currentEntity;
};

// 监听器;
// 监听 model 改变时更新模型
watch(
  () => state.model,
  () => {
    updateModel();
  }
);

// 监听模型颜色相关属性
watch([() => state.color, () => state.alpha], ([newColor, newAlpha]) => {
  if (currentEntity?.model) {
    const colorValue = getColor(newColor, newAlpha);
    currentEntity.model.color = new Cesium.ConstantProperty(colorValue);
  }
});

watch(
  () => state.colorBlendMode,
  (newMode) => {
    if (currentEntity?.model) {
      const modeValue = getColorBlendMode(newMode);
      currentEntity.model.colorBlendMode = new Cesium.ConstantProperty(modeValue);
    }
  }
);

watch(
  () => state.mix,
  (newValue) => {
    if (currentEntity?.model) {
      currentEntity.model.colorBlendAmount = new Cesium.ConstantProperty(newValue);
    }
  }
);

watch([() => state.silhouetteColor, () => state.silhouetteAlpha], ([newColor, newAlpha]) => {
  if (currentEntity?.model) {
    currentEntity.model.silhouetteColor = new Cesium.ConstantProperty(getColor(newColor, newAlpha));
  }
});

watch(
  () => state.silhouetteSize,
  (newSize) => {
    if (currentEntity?.model) {
      currentEntity.model.silhouetteSize = new Cesium.ConstantProperty(newSize);
    }
  }
);

// shadows
watch(
  () => state.shadows,
  (val) => {
    if (viewer) viewer.shadows = val;
  }
);

onBeforeUnmount(() => {
  if (viewer) {
    // 1. 停止追踪实体（如果有的话）
    viewer.trackedEntity = undefined;

    // 2. 清除所有实体和数据源
    viewer.entities.removeAll();
    viewer.dataSources.removeAll();

    // 3. 销毁 Viewer（最关键的一步！）
    // destroy 会释放 WebGL 上下文、停止渲染循环、释放内存和显存
    viewer.destroy();

    // 4. 将变量置为空，辅助垃圾回收 (GC)
    // (如果是 let 定义的 viewer)
    viewer = null;
    currentEntity = null;
  }
});
</script>

<template>
  <div class="wh-full relative">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded"></CesiumViewer>

    <!-- 控制面板 -->
    <el-card class="controls-panel">
      <div class="divider">Model Color（模型颜色）</div>

      <el-form label-width="120px" size="small" label-position="left">
        <el-form-item label="Model">
          <el-select v-model="state.model" placeholder="Select Model" style="width: 150px">
            <el-option
              v-for="item in modelOptions"
              :key="item.url"
              :label="item.text"
              :value="item.url"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Color Blend Mode">
          <el-select v-model="state.colorBlendMode" style="width: 100px">
            <el-option v-for="m in colorBlendModeOptions" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>

        <el-form-item label="Color">
          <el-select v-model="state.color" style="width: 100px">
            <el-option v-for="c in colorOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>

        <el-form-item label="Alpha">
          <div class="flex items-center gap-x-6">
            <el-slider v-model="state.alpha" :min="0" :max="1" :step="0.01" style="width: 150px" />
            <el-input
              v-model="state.alpha"
              type="number"
              :min="0"
              :max="1"
              :step="0.01"
              placeholder="Please input"
              style="width: 60px"
            />
          </div>
        </el-form-item>

        <el-form-item label="Mix" :disabled="state.colorBlendMode !== 'Mix'">
          <div class="flex items-center gap-x-6">
            <el-slider
              v-model="state.mix"
              :min="0"
              :max="1"
              :step="0.01"
              :disabled="state.colorBlendMode !== 'Mix'"
              style="width: 150px"
            />
            <el-input
              v-model="state.mix"
              type="number"
              :min="0"
              :max="1"
              :step="0.01"
              placeholder="Please input"
              style="width: 60px"
            />
          </div>
        </el-form-item>

        <div class="divider">Model Silhouette（模型轮廓）</div>

        <el-form-item label="Silhouette Color">
          <el-select v-model="state.silhouetteColor" style="width: 100px">
            <el-option v-for="c in colorOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>

        <el-form-item label="Silhouette Alpha">
          <div class="flex items-center gap-x-6">
            <el-slider
              v-model="state.silhouetteAlpha"
              :min="0"
              :max="1"
              :step="0.01"
              style="width: 150px"
            />
            <el-input
              v-model="state.silhouetteAlpha"
              type="number"
              :min="0"
              :max="1"
              :step="0.01"
              placeholder="Please input"
              style="width: 60px"
            />
          </div>
        </el-form-item>

        <el-form-item label="Silhouette Size">
          <div class="flex items-center gap-x-6">
            <el-slider
              v-model="state.silhouetteSize"
              :min="0"
              :max="10"
              :step="0.01"
              style="width: 150px"
            />
            <el-input
              v-model="state.silhouetteSize"
              type="number"
              :min="0"
              :max="10"
              :step="0.01"
              placeholder="Please input"
              style="width: 60px"
            />
          </div>
        </el-form-item>

        <el-form-item label="Shadows">
          <el-switch v-model="state.shadows" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.controls-panel {
  position: absolute;
  top: 0;
  left: 0;
  // width: 400px;
  color: white;
  background: #1f2023;
  border: none;
}
.divider {
  padding-bottom: 5px;
  margin: 10px 0;
  font-weight: bold;
  border-bottom: 1px solid #444;
}

:deep(.el-form-item__label) {
  color: #ccc;
}
</style>
