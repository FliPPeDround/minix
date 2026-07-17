Page({
  data: {
    user: {},
    launchedAt: "",
    stackDepth: 0,
  },

  onLoad() {
    const app = getApp();
    this.setData({
      user: app.globalData.user,
      launchedAt: app.globalData.launchedAt,
    });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({ stackDepth: getCurrentPages().length });
  },
});
