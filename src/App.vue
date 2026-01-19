<script setup lang="ts">
import { useCounterStore } from "@/stores";

const counterStore = useCounterStore();
const handleClick = () => {
  counterStore.increment();
};
</script>

<template>
  <router-view />

  <!-- unocss 图标 -->
  <div class="flex-center bg-red-100 p-4">
    <div class="i-svg:api"></div>
    <div class="i-svg:api text-xl text-blue-500"></div>
  </div>

  <div class="flex-center p-4 gap-4">
    <div>{{ counterStore.count }}</div>
    <button class="cursor-pointer" @click="handleClick">点击</button>
  </div>
</template>

<style scoped lang="scss"></style>
