<script setup lang="ts">
import type { FlightMonitoringPoint } from "../types";

defineProps<{
  points: FlightMonitoringPoint[];
  selectedPointId?: string;
}>();

const emit = defineEmits<{
  "point-click": [point: FlightMonitoringPoint];
}>();

const emitPointClick = (point: FlightMonitoringPoint) => {
  emit("point-click", point);
};
</script>

<template>
  <section class="point-list-panel">
    <div class="panel-header">
      <div>
        <h2>低空点位</h2>
        <span>{{ points.length }} 个模拟点位</span>
      </div>
    </div>

    <div class="point-list">
      <article
        v-for="point in points"
        :key="point.id"
        class="point-item"
        :class="{ 'is-active': point.id === selectedPointId }"
        role="button"
        tabindex="0"
        @click="emitPointClick(point)"
        @keydown.enter.prevent="emitPointClick(point)"
        @keydown.space.prevent="emitPointClick(point)"
      >
        <img :src="point.iconUrl" :alt="point.typeName" class="point-icon" />
        <div class="point-content">
          <div class="point-title">
            <span>{{ point.name }}</span>
            <el-tag size="small" effect="plain">{{ point.typeName }}</el-tag>
          </div>
          <p>{{ point.address }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.point-list-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 120px);
  padding: 14px;
  overflow: hidden;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(31 41 55 / 12%);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 16%);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgb(31 41 55 / 10%);

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  span {
    display: inline-block;
    margin-top: 4px;
    font-size: 12px;
    color: #6b7280;
  }
}

.point-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 200px);
  padding-top: 12px;
  overflow: auto;
}

.point-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid rgb(31 41 55 / 8%);
  border-radius: 8px;
  outline: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover,
  &:focus-visible {
    background: #eef6ff;
    border-color: rgb(37 99 235 / 36%);
    box-shadow: 0 8px 18px rgb(37 99 235 / 12%);
  }

  &:active {
    transform: translateY(1px);
  }

  &.is-active {
    background: #eaf3ff;
    border-color: #2563eb;
    box-shadow: inset 3px 0 0 #2563eb;
  }
}

.point-icon {
  width: 32px;
  height: 32px;
}

.point-content {
  min-width: 0;

  p {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: #4b5563;
  }
}

.point-title {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;

  span {
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
