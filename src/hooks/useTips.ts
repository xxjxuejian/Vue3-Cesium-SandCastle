export function useTips() {
  const isExpandTips = ref(false); // 提示框的展开状态
  // 动态计算容器的 Class
  const tipsContainerClasses = computed(() => {
    return isExpandTips.value
      ? "w-[350px] h-auto" // 展开时的尺寸
      : "w-8 h-8"; // 收起时的尺寸 (形成一个小方块按钮)
  });

  return { isExpandTips, tipsContainerClasses };
}
