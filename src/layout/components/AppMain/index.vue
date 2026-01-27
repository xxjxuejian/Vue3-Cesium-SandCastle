<script setup lang="ts"></script>

<template>
  <main class="app-main">
    <!-- 使用插槽或直接放 router-view -->
    <!-- 为什么动画效果会丢失 name="fade" mode="out-in"-->
    <!-- <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view> -->
    <router-view></router-view>
  </main>
</template>

<style scoped lang="scss">
.app-main {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
}

/* 简单的淡入淡出路由动画 */
/* .fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
} */
</style>
