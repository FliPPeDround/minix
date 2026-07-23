import { defineVaporComponent, on, renderEffect, setProp, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import audioCss from "./audio.css?inline";
import { audioProps } from "./props.ts";

pushStyle("minix:components", audioCss);

/**
 * audio：minix-audio 外壳包原生 <audio>。
 *
 * 注意：小程序 audio 组件已在官方文档标注「不再维护，建议使用
 * InnerAudioContext」。本实现仅提供基础播放控件，事件语义与小程序对齐：
 * play / pause / ended / timeupdate / error / canplay。
 */
export default function Audio() {
  const t = template(`<minix-audio><audio style="width:100%"></audio></minix-audio>`);
  return defineVaporComponent({
    name: "minix-audio",
    props: audioProps,
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const audio = n0.firstChild as HTMLAudioElement;

      const fire = (name: string, detail: Record<string, any> = {}) => {
        ctx.emit?.(name, { detail });
        const fn = (ctx.attrs as any)[`on${name[0].toUpperCase()}${name.slice(1)}`];
        if (typeof fn === "function") fn({ detail });
      };

      renderEffect(() => {
        setProp(audio, "src", props.src);
        audio.controls = true;
        audio.loop = props.loop;
        audio.autoplay = props.autoplay;
        audio.muted = props.muted;
      });

      on(audio, "play", () => fire("play"));
      on(audio, "pause", () => fire("pause"));
      on(audio, "ended", () => fire("ended"));
      on(audio, "timeupdate", () =>
        fire("timeupdate", {
          currentTime: audio.currentTime,
          duration: audio.duration,
        }),
      );
      on(audio, "error", () => fire("error", { errMsg: audio.error?.message ?? "" }));
      on(audio, "canplay", () => fire("canplay"));

      return n0;
    },
  });
}
