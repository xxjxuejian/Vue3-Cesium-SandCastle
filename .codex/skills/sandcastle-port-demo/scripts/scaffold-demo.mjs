#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const [, , category, fileName] = process.argv;

if (!category || !fileName) {
  console.error("用法: node scripts/scaffold-demo.mjs <Category> <DemoFile.vue>");
  process.exit(1);
}

const normalizedFileName = fileName.endsWith(".vue") ? fileName : `${fileName}.vue`;
const targetDir = path.join(process.cwd(), "src", "views", category);
const targetFile = path.join(targetDir, normalizedFileName);

if (existsSync(targetFile)) {
  console.error(`文件已存在: ${targetFile}`);
  process.exit(1);
}

const template = `<script setup lang="ts">
import { onUnmounted } from "vue";
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  homeButton: false,
};

let viewer: Cesium.Viewer | null = null;

const handleMapLoaded = async (viewerInstance: Cesium.Viewer) => {
  viewer = viewerInstance;
};

onUnmounted(() => {
  viewer = null;
});
</script>

<template>
  <div class="demo-page">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss">
.demo-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
`;

await mkdir(targetDir, { recursive: true });
await writeFile(targetFile, template, "utf8");
console.log(`已创建: ${targetFile}`);
