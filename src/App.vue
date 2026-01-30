<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import { useAppStore } from "@/stores/modules/app.store";
const appStore = useAppStore();
</script>

<template>
  <el-config-provider :locale="appStore.language === 'zh-cn' ? zhCn : en">
    <router-view></router-view>
  </el-config-provider>

  <!-- unocss 图标 -->
  <!-- <div class="flex-center bg-red-100 p-4">
    <div class="i-svg:api"></div>
    <div class="i-svg:api text-xl text-blue-500"></div>
  </div> -->
</template>

<style scoped lang="scss"></style>
