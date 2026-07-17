App({
  globalData: {
    user: { nickName: "minix 开发者", level: 5 },
    launchedAt: new Date().toLocaleString(),
  },
  onLaunch() {
    console.log("[demo] App onLaunch");
  },
  onShow() {
    console.log("[demo] App onShow");
  },
});
