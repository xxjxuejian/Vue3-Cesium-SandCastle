<script setup lang="ts">
const alarmActive = defineModel<boolean>("alarmActive", {
  required: true,
});
</script>

<template>
  <section class="map-status-panel" aria-label="地图状态控制">
    <div class="map-status-panel__header">
      <span class="map-status-panel__title">地图状态</span>
      <span class="map-status-panel__signal" :class="{ 'is-active': alarmActive }"></span>
    </div>

    <label class="map-status-panel__row">
      <span>
        <strong>报警边框</strong>
        <small>{{ alarmActive ? "已开启" : "已关闭" }}</small>
      </span>
      <el-switch v-model="alarmActive" size="small" />
    </label>
  </section>
</template>

<style scoped lang="scss">
.map-status-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  width: 184px;
  padding: 12px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(31 41 55 / 12%);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 16%);
}

.map-status-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 9px;
  border-bottom: 1px solid rgb(31 41 55 / 10%);
}

.map-status-panel__title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.map-status-panel__signal {
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 50%;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &.is-active {
    background: #ef4444;
    box-shadow: 0 0 0 4px rgb(239 68 68 / 14%);
  }
}

.map-status-panel__row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  cursor: pointer;

  strong,
  small {
    display: block;
  }

  strong {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
  }

  small {
    margin-top: 3px;
    font-size: 11px;
    color: #6b7280;
  }
}

@media (max-width: 720px) {
  .map-status-panel {
    top: auto;
    right: 12px;
    bottom: 112px;
    width: 168px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-status-panel__signal {
    transition: none;
  }
}
</style>
