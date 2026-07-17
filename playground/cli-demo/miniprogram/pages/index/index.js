import { navigateTo } from "minix";

Page({
  data: {
    count: 0,
    articles: [
      { id: 1, title: "为什么是 Vue Vapor", desc: "无虚拟 DOM 的渲染模式，适合小程序场景" },
      { id: 2, title: "WXML 编译原理", desc: "模板先转 Vue 语法，再交给 compiler-vapor" },
      { id: 3, title: "运行时设计", desc: "页面栈、生命周期与 tabBar 的浏览器实现" },
    ],
  },

  onLoad(query) {
    console.log("[demo] index onLoad", query);
  },

  onShow() {
    console.log("[demo] index onShow");
  },

  inc() {
    this.setData({ count: this.data.count + 1 });
  },

  dec() {
    this.setData({ count: this.data.count - 1 });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },
});
