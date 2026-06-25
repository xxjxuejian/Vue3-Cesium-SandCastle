<script setup lang="ts">
import PointTypeFilter from "./PointTypeFilter.vue";
import type { MonitoringPoint, MonitoringPointType, MonitoringPointTypeOption } from "../types";

defineProps<{
  points: MonitoringPoint[];
  allPoints: MonitoringPoint[];
  typeOptions: MonitoringPointTypeOption[];
  selectedPointId?: string;
}>();

const visiblePointTypes = defineModel<MonitoringPointType[]>("visiblePointTypes", {
  required: true,
});

const emit = defineEmits<{
  "point-click": [point: MonitoringPoint];
}>();

/**
 * 向上层发送点位点击数据。
 *
 * @param point 被点击的点位。
 */
const emitPointClick = (point: MonitoringPoint) => {
  emit("point-click", point);
};
</script>

<template>
  <section class="point-list-panel">
    <div class="panel-header">
      <div>
        <h2>低空点位</h2>
        <span>{{ points.length }} / {{ allPoints.length }} 个点位可见</span>
      </div>
    </div>

    <PointTypeFilter v-model="visiblePointTypes" :options="typeOptions" :points="allPoints" />

    <div v-if="points.length" class="point-list">
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
    <div v-else class="point-list-empty">
      <span class="point-list-empty__pulse" aria-hidden="true"></span>
      <strong>暂无可见点位</strong>
      <p>选择上方类型后，地图和列表将同步显示。</p>
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
  max-height: calc(100vh - 330px);
  padding-top: 12px;
  overflow: auto;
}

.point-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 142px;
  padding-top: 12px;
  color: #64748b;
  text-align: center;

  strong {
    margin-top: 10px;
    font-size: 13px;
    color: #334155;
  }

  p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.5;
  }
}

.point-list-empty__pulse {
  width: 22px;
  height: 22px;
  border: 1px solid rgb(37 99 235 / 35%);
  border-radius: 50%;
  box-shadow:
    0 0 0 5px rgb(37 99 235 / 8%),
    0 0 0 10px rgb(37 99 235 / 4%);
}

.point-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px;
  cursor: pointer;
  outline: none;
  background: #f9fafb;
  border: 1px solid rgb(31 41 55 / 8%);
  border-radius: 8px;
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
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
  }
}
</style>
