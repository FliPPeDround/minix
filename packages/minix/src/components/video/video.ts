import { defineVaporComponent, on, renderEffect, setProp, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import videoCss from "./video.css?inline";
import { videoProps } from "./props.ts";

pushStyle("minix:components", videoCss);

/**
 * video：minix-video 外壳包原生 <video>。
 *
 * 小程序语义：
 * - src / poster / autoplay / loop / muted 直接映射到 HTML video 同名属性
 * - controls 默认 true，showFullscreenBtn/PlayBtn/CenterPlayBtn 影响原生
 *   controls 子按钮（HTML controls 不可单独控制，统一映射到 controls）
 * - objectFit 映射到 CSS object-fit
 * - 事件：play / pause / ended / timeupdate / fullscreenchange / waiting /
 *   error，包 detail {currentTime, duration} 等元数据
 *
 * 实现：内层 <video> 由浏览器接管播放控件；外壳 minix-video 仅做尺寸与
 * 容器样式控制。danmu（弹幕）属小程序特有功能，第一版未实现，预留 props。
 */
export default function Video() {
  const t = template(
    `<minix-video><video style="width:100%;height:100%;display:block"></video></minix-video>`,
  );
  return defineVaporComponent({
    name: "minix-video",
    props: videoProps,
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const video = n0.firstChild as HTMLVideoElement;

      const fire = (name: string, detail: Record<string, any> = {}) => {
        ctx.emit?.(name, { detail });
        const fn = (ctx.attrs as any)[`on${name[0].toUpperCase()}${name.slice(1)}`];
        if (typeof fn === "function") fn({ detail });
      };

      renderEffect(() => {
        setProp(video, "src", props.src);
        setProp(video, "poster", props.poster);
        video.controls = props.controls;
        video.autoplay = props.autoplay;
        video.loop = props.loop;
        video.muted = props.muted;
        if (Number(props.initialTime) > 0) video.currentTime = Number(props.initialTime);
        video.style.objectFit = props.objectFit;
      });

      on(video, "play", () => fire("play"));
      on(video, "pause", () => fire("pause"));
      on(video, "ended", () => fire("ended"));
      on(video, "timeupdate", () =>
        fire("timeupdate", {
          currentTime: video.currentTime,
          duration: video.duration,
        }),
      );
      on(video, "waiting", () => fire("waiting"));
      on(video, "error", () => fire("error", { errMsg: video.error?.message ?? "" }));
      on(video, "fullscreenchange", () =>
        fire("fullscreenchange", { fullScreen: document.fullscreenElement === video }),
      );
      on(video, "loadedmetadata", () => {
        if (Number(props.initialTime) > 0) video.currentTime = Number(props.initialTime);
      });

      return n0;
    },
  });
}
