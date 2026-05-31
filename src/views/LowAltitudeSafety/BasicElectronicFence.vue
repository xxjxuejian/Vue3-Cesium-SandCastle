<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const vwConfig: Cesium.Viewer.ConstructorOptions = {};
let viewer: Cesium.Viewer | null = null;

// 电子围栏坐标点（根据实际园区范围修改经纬度）
const fencePositions = [
  { lon: 117.106447, lat: 36.436758 },
  { lon: 117.10659, lat: 36.437983 },
  { lon: 117.104106, lat: 36.438014 },
  { lon: 117.103922, lat: 36.437467 },
];

// 围栏高度（单位：米）
const fenceHeight = 36.0;

const handleMapLoaded = (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;

  loadFence();
  flyToFence();
};

const flyToFence = () => {
  if (!viewer) return;

  const longitudes = fencePositions.map((position) => position.lon);
  const latitudes = fencePositions.map((position) => position.lat);
  const centerLon = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.003, 420),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-35),
      roll: 0,
    },
    duration: 2,
  });
};

const loadFence = () => {
  if (!viewer) return;

  // 【核心】自定义Shader发光材质（实现循环流光效果）
  const createGlowMaterial = () => {
    return new Cesium.Material({
      fabric: {
        type: "MyFenceGlow",
        source: `
                    czm_material czm_getMaterial(czm_materialInput materialInput)
                    {
                        czm_material material = czm_getDefaultMaterial(materialInput);
                        vec2 st = materialInput.st;
                        
                        // 流光动画速度（数值越大越快）
                        float t = czm_frameNumber * 0.008;
                        
                        // 垂直位置 0=底部 1=顶部
                        float v = st.t;
                        
                        // 三条流光带循环位置
                        float band1Center = fract(0.15 + t);
                        float band2Center = fract(0.50 + t);
                        float band3Center = fract(0.85 + t);
                        
                        // 计算流光带边缘渐变
                        float dist1 = abs(v - band1Center);
                        float dist2 = abs(v - band2Center);
                        float dist3 = abs(v - band3Center);
                        
                        dist1 = min(dist1, 1.0 - dist1);
                        dist2 = min(dist2, 1.0 - dist2);
                        dist3 = min(dist3, 1.0 - dist3);
                        
                        // 流光带宽度
                        float bandWidth = 0.08;
                        float fadeWidth = 0.08;
                        
                        float intensity1 = smoothstep(bandWidth + fadeWidth, bandWidth, dist1);
                        float intensity2 = smoothstep(bandWidth + fadeWidth, bandWidth, dist2);
                        float intensity3 = smoothstep(bandWidth + fadeWidth, bandWidth, dist3);
                        
                        // 底部亮、顶部透明渐变
                        float gradient1 = 1.0 - smoothstep(0.0, 1.0, band1Center);
                        float gradient2 = 1.0 - smoothstep(0.0, 1.0, band2Center);
                        float gradient3 = 1.0 - smoothstep(0.0, 1.0, band3Center);
                        
                        intensity1 *= mix(0.3, 1.0, gradient1);
                        intensity2 *= mix(0.3, 1.0, gradient2);
                        intensity3 *= mix(0.3, 1.0, gradient3);
                        
                        float totalIntensity = max(intensity1, max(intensity2, intensity3));
                        
                        // 科技蓝颜色（可修改RGB值换颜色）
                        vec3 techBlueColor = vec3(0.0, 0.8, 1.0);
                        
                        material.diffuse = techBlueColor;
                        material.alpha = totalIntensity * 0.9;
                        material.emission = techBlueColor * totalIntensity * 2.5;
                        
                        return material;
                    }
                `,
      },
      translucent: true,
    });
  };

  // 创建围栏墙体
  for (let i = 0; i < fencePositions.length; i++) {
    const start = fencePositions[i];
    const end = fencePositions[(i + 1) % fencePositions.length];

    const wallGeometry = new Cesium.WallGeometry({
      positions: Cesium.Cartesian3.fromDegreesArray([start.lon, start.lat, end.lon, end.lat]),
      maximumHeights: [fenceHeight, fenceHeight],
      minimumHeights: [0, 0],
      vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
    });

    const wallInstance = new Cesium.GeometryInstance({
      geometry: wallGeometry,
    });

    const wallPrimitive = new Cesium.Primitive({
      geometryInstances: wallInstance,
      appearance: new Cesium.MaterialAppearance({
        material: createGlowMaterial(),
        closed: false,
        flat: false,
        renderState: {
          blending: Cesium.BlendingState.ALPHA_BLEND,
          depthTest: { enabled: true },
          depthMask: false,
        },
      }),
    });

    viewer.scene.primitives.add(wallPrimitive);
  }

  // 底部发光轮廓线(可省略)
  const bottomLinePositions = [];
  fencePositions.forEach((pos) => {
    bottomLinePositions.push(pos.lon, pos.lat, 0.1);
  });
  bottomLinePositions.push(fencePositions[0].lon, fencePositions[0].lat, 0.1);

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(bottomLinePositions),
      width: 4,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.5,
        color: Cesium.Color.fromCssColorString("#00ccff"),
      }),
    },
  });

  // 顶部发光轮廓线(可省略)
  const topLinePositions = [];
  fencePositions.forEach((pos) => {
    topLinePositions.push(pos.lon, pos.lat, fenceHeight);
  });
  topLinePositions.push(fencePositions[0].lon, fencePositions[0].lat, fenceHeight);

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(topLinePositions),
      width: 4,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.4,
        color: Cesium.Color.fromCssColorString("#00ccff"),
      }),
    },
  });

  // 中间层发光轮廓线(可省略)
  const midLinePositions = [];
  fencePositions.forEach((pos) => {
    midLinePositions.push(pos.lon, pos.lat, fenceHeight / 2);
  });
  midLinePositions.push(fencePositions[0].lon, fencePositions[0].lat, fenceHeight / 2);

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(midLinePositions),
      width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        color: Cesium.Color.fromCssColorString("#0099ff").withAlpha(0.7),
      }),
    },
  });

  console.log("电子围栏加载完成!");
};
</script>

<template>
  <div class="home">
    <CesiumViewer :config="vwConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss">
.home {
  color: red;
}
</style>
