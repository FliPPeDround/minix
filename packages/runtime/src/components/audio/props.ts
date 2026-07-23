export const audioProps = {
  src: { type: String, default: "" },
  loop: { type: Boolean, default: false },
  autoplay: { type: Boolean, default: false },
  muted: { type: Boolean, default: false },
  // 小程序 audio 还有 name / author / poster / obeyMuteSwitch 等，
  // 但旧版 audio 组件在浏览器侧无原生对应，统一通过外层 UI 模拟。
  name: { type: String, default: "" },
  author: { type: String, default: "" },
  poster: { type: String, default: "" },
  obeyMuteSwitch: { type: Boolean, default: true },
};
