<script setup lang="ts">
import type { MonitoringPoint } from "../types";

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  point: MonitoringPoint | null;
}>();

const coordinateText = computed(() => {
  if (!props.point) return "--";
  return `${props.point.lon.toFixed(4)}, ${props.point.lat.toFixed(4)}`;
});

const closeDialog = () => {
  visible.value = false;
};
</script>

<template>
  <el-dialog v-model="visible" title="点位信息" width="420px" align-center destroy-on-close>
    <div v-if="point" class="point-info">
      <div class="point-info__header">
        <img :src="point.iconUrl" :alt="point.typeName" class="point-info__icon" />
        <div class="point-info__title">
          <h3>{{ point.name }}</h3>
          <el-tag size="small" effect="plain">{{ point.typeName }}</el-tag>
        </div>
      </div>

      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="点位编号">{{ point.id }}</el-descriptions-item>
        <el-descriptions-item label="点位类型">{{ point.typeName }}</el-descriptions-item>
        <el-descriptions-item label="坐标">{{ coordinateText }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ point.address }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.point-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.point-info__header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.point-info__icon {
  width: 40px;
  height: 40px;
}

.point-info__title {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;

  h3 {
    margin: 0;
    overflow: hidden;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
