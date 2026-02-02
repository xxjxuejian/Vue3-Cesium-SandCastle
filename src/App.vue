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
</template>

<style scoped lang="scss"></style>
