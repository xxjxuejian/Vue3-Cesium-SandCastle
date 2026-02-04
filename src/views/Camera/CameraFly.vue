<script setup lang="ts">
import * as Cesium from "cesium";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";

import type { CameraFlyOptions } from "@/types/cesium";

let mapViewer: Cesium.Viewer | null;
let scene: Cesium.Scene | null;
let camera: Cesium.Camera | null;
let clock: Cesium.Clock | null;
let referenceFramePrimitive: Cesium.Primitive | null;
// 事件返回的移除函数
let removeCameraMoveStart: Cesium.Event.RemoveCallback | null;
let removeCameraMoveEnd: Cesium.Event.RemoveCallback | null;
let removeCameraChanged: Cesium.Event.RemoveCallback | null;

// 用来测试 camera 事件的DOM元素
const moveEventClass = ref("hidden");
const changedEventClass = ref("hidden");
const changedEventText = ref("");

const handleMapLoaded = (viewer: Cesium.Viewer) => {
  mapViewer = viewer;
  scene = viewer.scene;
  camera = viewer.camera;
  clock = viewer.clock;

  // SceneMode 切换动画「完全结束」时触发的事件,只要 morph 结束，就统一 reset 一次
  // 保证 camera 状态一致/ 不残留 referenceFrame/ 不残留 tween /不残留事件监听
  scene.morphComplete.addEventListener(function () {
    reset();
  });
};

type CameraActionKey =
  | "flyInCity"
  | "flyToSanDiego"
  | "flyToHPR"
  | "flyToMyLocation"
  | "flyToRectangle"
  | "viewRectangle"
  | "setReferenceFrame"
  | "setHPR"
  | "viewInICRF"
  | "cameraMove"
  | "cameraChanged"
  | "flyOverLongitude"
  | "flyOverLongitudeWithPitch";

function flyInACity() {
  if (!camera) return;
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      -73.98580932617188,
      40.74843406689482,
      363.34038727246224
    ),
    complete: () => {
      setTimeout(() => {
        if (!camera) return;
        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            -73.98585975679403,
            40.75759944127251,
            186.50838555841779
          ),
          orientation: {
            heading: Cesium.Math.toRadians(200.0),
            pitch: Cesium.Math.toRadians(-50.0),
          },
          easingFunction: Cesium.EasingFunction.LINEAR_NONE,
        });
      }, 1000);
    },
  });
}

function flyToSanDiego() {
  if (!camera) return;
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
  });
}

function flyToHeadingPitchRoll() {
  if (!camera) return;
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-122.22, 46.12, 5000.0),
    orientation: {
      heading: Cesium.Math.toRadians(20.0),
      pitch: Cesium.Math.toRadians(-35.0),
      roll: 0.0,
    },
  });
}

function flyToLocation() {
  // Create callback for browser's geolocation
  function fly(position) {
    if (!camera) return;
    camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        position.coords.longitude,
        position.coords.latitude,
        1000.0
      ),
    });
  }

  function error(err) {
    console.warn(`错误（${err.code}）：${err.message}`);
  }
  //  获取我的位置 成功或者失败的 回调
  navigator.geolocation.getCurrentPosition(fly, error);
}

function viewRectangle() {
  if (!mapViewer) return;
  const west = -77.0;
  const south = 38.0;
  const east = -72.0;
  const north = 42.0;
  const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
  //   使用setView  设置相机 到矩形处
  mapViewer.camera.setView({
    destination: rectangle,
  });
  //   显示矩形
  mapViewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function flyToRectangle() {
  if (!mapViewer) return;

  const west = -90.0;
  const south = 38.0;
  const east = -87.0;
  const north = 40.0;
  const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

  //   使用flyTo方法进行飞行
  mapViewer.camera.flyTo({
    destination: rectangle,
  });

  mapViewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

function setReferenceFrame() {
  // 选定了地球表面上的一个点，作为局部世界的原点
  const center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
  //   在 center 这个点上：构建 ENU 局部坐标系
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  // View in east-north-up frame
  if (!camera || !scene) return;
  //   限制相机的旋转轴
  camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
  //   调整相机位置，以transform坐标系基准 向 西 120km 向 南 120km 向 上 120km 偏移 camera
  //   相机被放在 中心点的西南上方
  camera.lookAtTransform(transform, new Cesium.Cartesian3(-120000.0, -120000.0, 120000.0));

  // Show reference frame.  Not required. 画出“参考坐标轴”
  //   红 / 绿 / 蓝三条轴 对应 X（东） Y（北）  Z（上）
  referenceFramePrimitive = scene.primitives.add(
    new Cesium.DebugModelMatrixPrimitive({
      modelMatrix: transform,
      length: 100000.0,
    })
  );
}

// 设置相机camera的 heading, pitch, roll
function setHeadingPitchRoll() {
  if (!camera) return;
  camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-75.5847, 40.0397, 1000.0),
    orientation: {
      heading: -Cesium.Math.PI_OVER_TWO,
      pitch: -Cesium.Math.PI_OVER_FOUR,
      roll: 0.0,
    },
  });
}
function icrf(scene: Cesium.Scene, time: any) {
  if (scene.mode !== Cesium.SceneMode.SCENE3D) {
    return;
  }
  if (!camera) return;

  const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
  if (Cesium.defined(icrfToFixed)) {
    const offset = Cesium.Cartesian3.clone(camera.position);
    const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
    // lookAtTransform？
    camera.lookAtTransform(transform, offset);
  }
}

function viewInICRF() {
  if (!camera || !clock || !scene) return;
  camera.flyHome(0);

  clock.multiplier = 3 * 60 * 60;
  scene.postUpdate.addEventListener(icrf);
  scene.globe.enableLighting = true;
}

// 相机的moveStart/ moveEnd事件
function cameraMoveEvents() {
  if (!camera) return;
  removeCameraMoveStart = camera.moveStart.addEventListener(function () {
    moveEventClass.value = "block";
  });
  removeCameraMoveEnd = camera.moveEnd.addEventListener(function () {
    moveEventClass.value = "hidden";
  });
}

function cameraChangedEvents() {
  if (!camera) return;
  let i = 0;
  removeCameraChanged = camera.changed.addEventListener(function (percentage) {
    ++i;
    changedEventClass.value = "block";
    changedEventText.value = `Camera Changed: ${i}, ${percentage.toFixed(6)}`;
  });
}

// 从洛杉矶到东京, isAdjustPitch:是否需要调整俯仰角
function losAngelesToTokyo(isAdjustPitch: boolean = false) {
  if (!camera) return;

  const tokyoOptions = {
    destination: Cesium.Cartesian3.fromDegrees(139.8148, 35.7142, 20000.0),
    orientation: {
      heading: Cesium.Math.toRadians(15.0),
      pitch: Cesium.Math.toRadians(-60),
      roll: 0.0,
    },
    duration: 20,
    flyOverLongitude: Cesium.Math.toRadians(60.0),
  };

  // 先移动到洛杉矶，移动完成以后，在移动到东京
  const laOptions = {
    destination: Cesium.Cartesian3.fromDegrees(-117.729, 34.457, 10000.0),
    duration: 5,
    orientation: {
      heading: Cesium.Math.toRadians(-15.0),
      pitch: -Cesium.Math.PI_OVER_FOUR,
      roll: 0.0,
    },
    complete: () => {
      setTimeout(() => {
        if (!camera) return;
        camera.flyTo(tokyoOptions);
      }, 2000);
    },
  };

  if (isAdjustPitch) {
    tokyoOptions.pitchAdjustHeight = 1000;
    laOptions.pitchAdjustHeight = 1000;
  }

  // 飞向 LA
  camera.flyTo(laOptions);
}

function flyOverLongitudeWithPitch() {
  losAngelesToTokyo(true);
}

function reset() {
  if (!mapViewer || !scene || !camera || !clock) return;
  /*
    Cesium 有三种 SceneMode：（SCENE3D、SCENE2D、COLUMBUS_VIEW）
   从一个模式切换到另一个模式（比如 3D → 2D），不是瞬间切换，而是一个动画过程，叫 morph。
  scene.completeMorph()： 强制立即结束当前 morph 动画，并把 Scene 定格在目标模式。
  */
  scene.completeMorph();
  //清空所有 Entity
  mapViewer.entities.removeAll();
  // 移除 Primitive（非 Entity）
  scene.primitives.remove(referenceFramePrimitive);
  // 移除所有 Tween 动画，
  scene.tweens.removeAll();

  if (Cesium.defined(removeCameraMoveStart)) {
    removeCameraMoveStart();
    if (removeCameraMoveEnd) removeCameraMoveEnd();

    moveEventClass.value = "hidden";

    removeCameraMoveStart = null;
    removeCameraMoveEnd = null;
  }

  if (Cesium.defined(removeCameraChanged)) {
    removeCameraChanged();
    removeCameraChanged = null;

    changedEventClass.value = "hidden";
  }
  //重置相机到世界坐标系
  mapViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  //把时间倍率恢复为正常速度
  clock.multiplier = 1.0;
  //移除 ICRF 更新监听
  scene.postUpdate.removeEventListener(icrf);
  //关闭地球光照
  scene.globe.enableLighting = false;
}

const cameraActionMap: Record<CameraActionKey, () => void> = {
  flyInCity() {
    reset();
    flyInACity();
  },
  flyToSanDiego() {
    reset();
    flyToSanDiego();
  },
  flyToHPR() {
    reset();
    flyToHeadingPitchRoll();
  },
  flyToMyLocation() {
    reset();
    flyToLocation();
  },
  flyToRectangle() {
    reset();
    flyToRectangle();
  },
  viewRectangle() {
    reset();
    viewRectangle();
  },
  setReferenceFrame() {
    reset();
    setReferenceFrame();
  },
  setHPR() {
    reset();
    setHeadingPitchRoll();
  },
  viewInICRF() {
    reset();
    viewInICRF();
  },
  cameraMove() {
    reset();
    cameraMoveEvents();
  },
  cameraChanged() {
    reset();
    cameraChangedEvents();
  },
  flyOverLongitude() {
    reset();
    losAngelesToTokyo();
  },
  flyOverLongitudeWithPitch() {
    reset();
    flyOverLongitudeWithPitch();
  },
};

const selectValue = ref<CameraActionKey>();
const cameraOptions: Array<{
  label: string;
  value: CameraActionKey;
}> = [
  {
    label: "Fly in a city",
    value: "flyInCity",
  },
  {
    label: "Fly to San Diego",
    value: "flyToSanDiego",
  },
  {
    label: "Fly to Location with heading, pitch and roll",
    value: "flyToHPR",
  },
  {
    label: "Fly to My Location",
    value: "flyToMyLocation",
  },
  {
    label: "Fly to Rectangle",
    value: "flyToRectangle",
  },
  {
    label: "View a Rectangle",
    value: "viewRectangle",
  },
  {
    label: "Set camera reference frame",
    value: "setReferenceFrame",
  },
  {
    label: "Set camera with heading, pitch, and roll",
    value: "setHPR",
  },
  {
    label: "View in ICRF",
    value: "viewInICRF",
  },
  {
    label: "Camera Move Events",
    value: "cameraMove",
  },
  {
    label: "Camera Changed Event",
    value: "cameraChanged",
  },
  {
    label: "Fly from Los Angeles to Tokyo via Europe",
    value: "flyOverLongitude",
  },
  {
    label: "Look down during exaggerated flight",
    value: "flyOverLongitudeWithPitch",
  },
];

function handleChange(key: CameraActionKey) {
  cameraActionMap[key]?.();
}

//立即完成相机飞行
const handleCompleteFlight = () => {
  // 完成当前正在进行的相机飞行，并立即将相机移动到其最终目标位置。
  // 如果当前没有相机飞行在进行中，该函数不会执行任何操作。
  if (!camera) return;
  camera.completeFlight();
};

// 取消相机飞行
const handleCancelFlight = () => {
  // 取消当前正在进行的相机飞行，并将相机停留在当前位置。
  // 如果当前没有相机飞行在进行中，该函数不会执行任何操作。
  if (!camera) return;
  camera.cancelFlight();
};

onBeforeUnmount(() => {
  mapViewer = null;
  scene = null;
  camera = null;
  clock = null;
  referenceFramePrimitive = null;
  if (removeCameraMoveStart) {
    removeCameraMoveStart(); // 执行移除函数
    removeCameraMoveStart = null;
  }
  if (removeCameraMoveEnd) {
    removeCameraMoveEnd(); // 执行移除函数
    removeCameraMoveEnd = null;
  }
  if (removeCameraChanged) {
    removeCameraChanged(); // 执行移除函数
    removeCameraChanged = null;
  }
});
</script>

<template>
  <div class="wh-full relative overflow-hidden">
    <CesiumViewer @map-loaded="handleMapLoaded"></CesiumViewer>

    <div class="absolute-lt z-10 p-2">
      <div class="flex items-center gap-x-2 mb-1">
        <el-select
          v-model="selectValue"
          placeholder="Select"
          style="width: 240px"
          @change="handleChange"
        >
          <el-option
            v-for="item in cameraOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div>
          <el-button @click="handleCompleteFlight">Complete Flight</el-button>
        </div>
        <div>
          <el-button @click="handleCancelFlight">Cancel Flight</el-button>
        </div>
      </div>
      <!--  -->
      <div class="flex flex-col gap-y-2">
        <div class="bg-red-300" :class="moveEventClass">Camera Move Events</div>
        <div class="bg-green-300" :class="changedEventClass">
          Camera Changed
          <span>{{ changedEventText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
