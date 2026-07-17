/* oxlint-disable */
Page({
  data: { msg: "fixture index" },
  onLoad() {
    console.log(getApp().globalData.from);
  },
});
