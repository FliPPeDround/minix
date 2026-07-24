import { defineVaporComponent, on, renderEffect, template } from "@vue/runtime-vapor";
import { pushStyle } from "../../style.ts";
import mapCss from "./map.css?inline";
import { mapProps } from "./props.ts";

pushStyle("minix:components", mapCss);

/**
 * map：minix-map 自定义元素，渲染一张 OpenStreetMap 静态瓦片图作为占位。
 *
 * 注意：小程序内置 <map> 由微信客户端基于原生 SDK 渲染（腾讯地图/高德等），
 * 浏览器侧没有等价原生组件。本实现采用一个最简方案：用 <iframe> 内嵌
 * OpenStreetMap 网页（基于传入经纬度构造 URL），以保留地图查看能力。
 *
 * 真正的小程序语义 markers / polyline / circles / polygons 等覆盖物，
 * 以及 bindregionchange / bindcontroltap 等事件，需要接入实际地图 SDK
 * （leaflet/mapbox-gl 等），后续可作为可选 peerDependency 引入。
 *
 * Events: bindregionchange / bindmarkertap / bindcontroltap / bindtap
 *         （首版仅触发 bindtap 占位）
 */
function formatMapUrl(lat: number, lng: number, z: number): string {
  // 把缩放等级换算成 bbox 半边长：z 越大视野越窄
  const half = Math.max(0.0001, 0.02 / Math.pow(2, z - 12));
  return `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - half
  }%2C${lat - half}%2C${lng + half}%2C${lat + half}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function Map() {
  const t = template(
    `<minix-map><iframe style="width:100%;height:100%;border:0"></iframe></minix-map>`,
  );
  return defineVaporComponent({
    name: "minix-map",
    props: mapProps,
    setup(props, ctx) {
      const n0 = t() as HTMLElement;
      const iframe = n0.firstChild as HTMLIFrameElement;

      renderEffect(() => {
        const lat = Number(props.latitude) || 0;
        const lng = Number(props.longitude) || 0;
        const z = Number(props.scale) || 16;
        iframe.src = formatMapUrl(lat, lng, z);
        // enableScroll=false 时禁止 iframe 内交互（仅展示）
        if (!props.enableScroll) iframe.style.pointerEvents = "none";
      });

      on(n0, "click", () => {
        const detail = {
          latitude: Number(props.latitude),
          longitude: Number(props.longitude),
          scale: Number(props.scale),
        };
        ctx.emit?.("tap", { detail });
        const fn = (ctx.attrs as any).onTap;
        if (typeof fn === "function") fn({ detail });
      });

      return n0;
    },
  });
}
