<script setup lang="ts">
import FullScreen from "@/components/FullScreen/index.vue";
import LangSelect from "@/components/LangSelect/index.vue";

const handleGithub = () => {
  window.open("https://github.com/xxjxuejian/Vue3-Cesium-SandCastle", "_blank");
};
</script>

<template>
  <div class="navbar-right-wrapper flex items-center h-full text-lg">
    <div class="navbar-right-item min-w-[44px] h-full flex-center cursor-pointer hover:bg-gray-200">
      <FullScreen />
    </div>

    <div class="navbar-right-item min-w-[44px] h-full flex-center cursor-pointer hover:bg-gray-200">
      <LangSelect size="text-lg" />
    </div>

    <div class="navbar-right-item min-w-[44px] h-full flex-center cursor-pointer hover:bg-gray-200">
      <div class="i-svg:github text-xl" @click="handleGithub" />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
