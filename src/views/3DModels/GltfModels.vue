<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

// 加载模型的函数
function createModel(url: string, height: number) {
  const viewer = viewerRef.value;
  if (!viewer) return;

  // 移除之前的全部模型
  viewer.entities.removeAll();

  // 计算模型的位置和高度以及视角, 把“经纬度（地理坐标）”转换成 Cesium 能用的“三维笛卡尔坐标（世界坐标）”
  // Cesium 内部 一律用笛卡尔坐标渲染，经纬度只是人类友好的输入方式。
  // 经纬度固定，高度由参数决定
  const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);

  // 计算模型姿态
  // 0：
  const heading = Cesium.Math.toRadians(135); //偏航角 / 航向角
  const pitch = 0; // 俯仰角
  const roll = 0; // 翻滚角
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  const entity = viewer.entities.add({
    name: url,
    position: position,
    orientation: orientation,
    model: {
      uri: url, // glTF/GLB 文件路径
      minimumPixelSize: 128, // 最小屏幕像素尺寸： 就算你把相机拉得很远，模型在屏幕上也至少有 128px 大小
      maximumScale: 20000, // 最大放大倍数
    },
  });
  viewer.trackedEntity = entity; // 让相机自动跟随这个实体（要么手动flyTo）
}

// glb / gltf 本身是可以自带动画的
const mapConfig: Cesium.Viewer.ConstructorOptions = {
  infoBox: false,
  selectionIndicator: false, // 禁用选择指示器,就是鼠标点击时的那个聚焦框
  shadows: true,
  shouldAnimate: true, // 控制 Cesium 的全局“时间是否流动”，glTF 动画会随时间播放，
};
const viewerRef = shallowRef<Cesium.Viewer | null>(null);

const selectedModel = ref("aircraft");
const options = [
  {
    label: "Aircraft（飞机）",
    value: "aircraft",
    url: "/SampleData/models/CesiumAir/Cesium_Air.glb",
    height: 5000.0,
  },
  {
    label: "Drone（无人机）",
    value: "drone",
    url: "/SampleData/models/CesiumDrone/CesiumDrone.glb",
    height: 150.0,
  },
  {
    label: "Ground Vehicle（地面车辆）",
    value: "groundVehicle",
    url: "/SampleData/models/GroundVehicle/GroundVehicle.glb",
    height: 0,
  },
  {
    label: "Hot Air Balloon（热气球）",
    value: "balloon",
    url: "/SampleData/models/CesiumBalloon/CesiumBalloon.glb",
    height: 1000.0,
  },
  {
    label: "Milk Truck（牛奶运输车）",
    value: "milkTruck",
    url: "/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb",
    height: 0,
  },
  {
    label: "Skinned Character（骨骼动画角色）",
    value: "character",
    url: "/SampleData/models/CesiumMan/Cesium_Man.glb",
    height: 0,
  },
  {
    label: "Unlit Box（无光照盒子）",
    value: "unlitBox",
    url: "/SampleData/models/BoxUnlit/BoxUnlit.gltf",
    height: 10.0,
  },
  {
    label: "Draco Compressed Model（Draco 压缩模型）",
    value: "draco",
    url: "/SampleData/models/DracoCompressed/CesiumMilkTruck.gltf",
    height: 0,
  },
  {
    label: "KTX2 Compressed Balloon（KTX2 压缩热气球）",
    value: "ktx2Balloon",
    url: "/SampleData/models/CesiumBalloonKTX2/CesiumBalloonKTX2.glb",
    height: 1000.0,
    needBasisCheck: true,
  },
  {
    label: "Instanced Box（实例化盒子）",
    value: "instancedBox",
    url: "/SampleData/models/BoxInstanced/BoxInstanced.gltf",
    height: 15,
  },
];

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewerRef.value = viewer;
  handleModelChange(selectedModel.value);
};

// 模型切换
function handleModelChange(value: string) {
  const option = options.find((item) => item.value === value);
  if (!option) return;
  // 检查当前浏览器 + GPU + WebGL 环境，是否支持「Basis Universal（KTX2）」压缩纹理。
  if (option.needBasisCheck && viewerRef.value) {
    if (!Cesium.FeatureDetection.supportsBasis(viewerRef.value.scene)) {
      ElMessage.warning("This browser does not support Basis Universal compressed textures");
      return;
    }
  }

  createModel(option.url, option.height);
}
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <div class="absolute-lt p-2 z-10 w-[180px] bg-[#1f2023]">
      <el-select v-model="selectedModel" placeholder="Select Model" @change="handleModelChange">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <CesiumViewer :config="mapConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
