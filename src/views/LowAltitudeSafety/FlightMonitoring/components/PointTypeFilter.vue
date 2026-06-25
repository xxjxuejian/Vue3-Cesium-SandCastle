<script setup lang="ts">
import { computed } from "vue";
import type { CheckboxValueType } from "element-plus";
import type { MonitoringPoint, MonitoringPointType, MonitoringPointTypeOption } from "../types";

const props = defineProps<{
  options: MonitoringPointTypeOption[];
  points: MonitoringPoint[];
}>();

const visiblePointTypes = defineModel<MonitoringPointType[]>({ required: true });

const pointCounts = computed(() => {
  const counts = new Map<MonitoringPointType, number>();
  props.options.forEach((option) => counts.set(option.value, 0));
  props.points.forEach((point) => {
    counts.set(point.type, (counts.get(point.type) ?? 0) + 1);
  });
  return counts;
});

const allSelected = computed(
  () =>
    props.options.length > 0 &&
    props.options.every((option) => visiblePointTypes.value.includes(option.value))
);

const isIndeterminate = computed(() => visiblePointTypes.value.length > 0 && !allSelected.value);

/**
 * 判断指定点位类型当前是否显示。
 *
 * @param type 点位类型。
 * @returns 当前类型是否显示。
 */
const isTypeVisible = (type: MonitoringPointType) => visiblePointTypes.value.includes(type);

/**
 * 切换单个点位类型的显示状态。
 *
 * @param type 点位类型。
 */
const toggleType = (type: MonitoringPointType) => {
  visiblePointTypes.value = isTypeVisible(type)
    ? visiblePointTypes.value.filter((item) => item !== type)
    : [...visiblePointTypes.value, type];
};

/**
 * 根据总开关显示或隐藏全部点位类型。
 *
 * @param checked 总开关目标状态。
 */
const handleToggleAll = (checked: CheckboxValueType) => {
  visiblePointTypes.value = checked === true ? props.options.map((option) => option.value) : [];
};
</script>

<template>
  <div class="point-type-filter" aria-label="点位类型筛选">
    <div class="filter-heading">
      <span class="filter-label">显示类型</span>
      <el-checkbox
        :model-value="allSelected"
        :indeterminate="isIndeterminate"
        size="small"
        @change="handleToggleAll"
      >
        全部显示
      </el-checkbox>
    </div>

    <div class="filter-grid">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="filter-card"
        :class="{ 'is-selected': isTypeVisible(option.value) }"
        :aria-pressed="isTypeVisible(option.value)"
        @click="toggleType(option.value)"
      >
        <span class="filter-card__indicator" aria-hidden="true"></span>
        <img :src="option.iconUrl" alt="" class="filter-card__icon" />
        <span class="filter-card__label">{{ option.label }}</span>
        <span class="filter-card__count">{{ pointCounts.get(option.value) ?? 0 }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.point-type-filter {
  padding: 12px 0;
  border-bottom: 1px solid rgb(31 41 55 / 10%);
}

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.filter-card {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 8px 9px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
  background: #f8fafc;
  border: 1px solid rgb(71 85 105 / 16%);
  border-radius: 7px;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover,
  &:focus-visible {
    border-color: rgb(37 99 235 / 45%);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
  }

  &.is-selected {
    background: #edf5ff;
    border-color: rgb(37 99 235 / 55%);
  }
}

.filter-card__indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #cbd5e1;
  border-radius: 50%;
}

.filter-card.is-selected .filter-card__indicator {
  background: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.filter-card__icon {
  width: 24px;
  height: 24px;
  opacity: 0.45;
  filter: grayscale(0.5);
  transition:
    opacity 0.18s ease,
    filter 0.18s ease;
}

.filter-card.is-selected .filter-card__icon {
  opacity: 1;
  filter: none;
}

.filter-card__label {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.filter-card.is-selected .filter-card__label {
  color: #1e3a5f;
}

.filter-card__count {
  min-width: 18px;
  padding: 1px 5px;
  font-size: 11px;
  line-height: 16px;
  color: #64748b;
  text-align: center;
  background: rgb(148 163 184 / 14%);
  border-radius: 9px;
}

@media (max-width: 420px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-card,
  .filter-card__icon {
    transition: none;
  }
}
</style>
