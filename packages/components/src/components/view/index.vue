<script setup lang="ts">
// view 组件：等价小程序 view，块级容器。
// minix-view 在 vite.config.ts 里被标记为自定义元素（isCustomElement），
// 所以模板里的 <minix-view> 会渲染为真实 DOM 节点而非递归解析组件自身。
defineOptions({
  name: "minix-view",
});
</script>

<template>
  <minix-view style="display: block">
    <slot />
  </minix-view>
</template>
