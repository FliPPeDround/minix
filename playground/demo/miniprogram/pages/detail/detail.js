import { navigateBack, reLaunch } from "minix";

const ARTICLES = {
  1: "Vue Vapor 抛弃了虚拟 DOM，直接操作真实节点，包体积和运行时开销都更小——这正是小程序容器想要的。",
  2: "@minix/compiler 先用 ultrahtml 把 WXML 转成 Vue 模板语法，再交给 @vue/compiler-vapor 生成渲染函数。",
  3: "@minix/runtime 用页面栈管理 Page 实例：navigateTo 压栈、navigateBack 出栈、tabBar 页面常驻缓存。",
};

Page({
  data: {
    id: "",
    title: "",
    content: "",
    from: "首页",
  },

  onLoad(query) {
    const id = query.id || "1";
    this.setData({
      id,
      title: `文章 #${id}`,
      content: ARTICLES[id] || "文章不存在",
      from: query.from || "首页",
    });
  },

  goBack() {
    navigateBack();
  },

  goHome() {
    reLaunch({ url: "/pages/index/index" });
  },
});
