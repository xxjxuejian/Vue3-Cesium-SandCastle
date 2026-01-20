<script setup lang="ts">
import SideBar from "./components/SideBar/index.vue";
</script>

<template>
  <div class="flex wh-full">
    <div class="w-[510px] border border-red">
      <SideBar></SideBar>
    </div>
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
