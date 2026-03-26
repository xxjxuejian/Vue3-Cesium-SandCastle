<script setup lang="ts">
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
// 颜色列表
const colorOptions = ["White", "Red", "Green", "Blue", "Yellow", "Gray"];
const colorBlendModeOptions = ["Highlight", "Replace", "Mix"];

let viewer = null;
let currentEntity: Cesium.Entity | undefined;
const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
  updateModel();
};

// 控制面板数据源
const state = reactive({
  model: modelOptions[1].url, // 默认地面车辆模型
  color: "Red", // 模型颜色
  alpha: 1.0, // 模型颜色不透明度
  colorBlendMode: "Highlight", // 模型颜色混合模式
  mix: 0.5, // 模型颜色混合程度参数
  silhouetteColor: "Red", // 模型轮廓颜色
  silhouetteAlpha: 0.66, // 模型轮廓不透明度
  silhouetteSize: 3.99, // 模型轮廓大小
  shadows: true,
});

function getColorBlendMode(colorBlendMode) {
  return Cesium.ColorBlendMode[colorBlendMode.toUpperCase()];
}

// 转换颜色字符串和透明度为 Cesium.Color
function getColor(colorName, alpha) {
  const color = Cesium.Color[colorName.toUpperCase()];
  return Cesium.Color.fromAlpha(color, parseFloat(alpha));
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
              placeholder="Please input"
              style="width: 60px"
            />
          </div>
        </el-form-item>

        <el-form-item label="Mix" :disabled="state.colorBlendMode !== 'Mix'">
          <div class="flex items-center gap-x-6">
            <el-slider
              v-model="state.colorBlendMode"
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

        <el-form-item label="Alpha">
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
