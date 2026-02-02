/* 
声明式/ 响应式hook
这种方式适合把地图放在一个 v-if 控制的弹窗或 Tab 页中。地图容器是根据条件动态渲染的。 
*/
import * as Cesium from "cesium";

export function useCesiumWatcher(
  containerRef: Ref<HTMLElement | undefined>,
  options: Cesium.Viewer.ConstructorOptions = {}
) {
  const viewer = shallowRef<Cesium.Viewer | null>(null);

  // 核心：监听 containerRef 的变化（从 null 变成 DOM 元素，或反之）
  watch(
    containerRef,
    (container) => {
      // 场景 A: DOM 出现，且 viewer 未创建 -> 初始化
      if (container && !viewer.value) {
        const v = new Cesium.Viewer(container, {
          infoBox: false,
          ...options,
        });
        // v.cesiumWidget.creditContainer.style.display = "none";
        viewer.value = markRaw(v);
        console.log("Dynamic Cesium Initialized");
      }
      // 场景 B: DOM 消失 (v-if=false)，且 viewer 存在 -> 销毁
      else if (!container && viewer.value) {
        viewer.value?.destroy();
        viewer.value = null;
      }
    },
    { immediate: true }
  );

  // 兜底：组件卸载时一定要销毁
  onUnmounted(() => {
    if (viewer.value && !viewer.value.isDestroyed()) {
      viewer.value.destroy();
      viewer.value = null;
    }
  });

  return { viewer };
}
