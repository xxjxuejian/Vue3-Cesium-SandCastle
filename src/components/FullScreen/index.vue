<script setup lang="ts">
import { useFullscreen } from "@vueuse/core";
const { isFullscreen, toggle } = useFullscreen();
</script>

<template>
  <div class="flex-center wh-full" @click="toggle">
    <div :class="`i-svg:` + (isFullscreen ? 'fullscreen-exit' : 'fullscreen')" />
  </div>
</template>

<style scoped lang="scss"></style>
