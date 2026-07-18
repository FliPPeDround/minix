import type { Device } from "./types.ts";

/**
 * 设备预设列表。CSS 尺寸取自设备规格（逻辑像素），UA 取对应平台近期稳定版本。
 * 添加新设备只需追加一项。
 */
export const DEVICES: readonly Device[] = [
  {
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    pixelRatio: 3,
    touch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "iPhone 15 Pro Max",
    width: 430,
    height: 932,
    pixelRatio: 3,
    touch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "iPhone SE",
    width: 375,
    height: 667,
    pixelRatio: 2,
    touch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "Pixel 7",
    width: 412,
    height: 915,
    pixelRatio: 2.625,
    touch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "Pixel 7 Pro",
    width: 412,
    height: 892,
    pixelRatio: 3.5,
    touch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "Galaxy S23",
    width: 360,
    height: 780,
    pixelRatio: 3,
    touch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
  {
    name: "iPad Pro 11",
    width: 834,
    height: 1194,
    pixelRatio: 2,
    touch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "Responsive",
    width: 390,
    height: 844,
    pixelRatio: 3,
    touch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
] as const;

/** 默认设备名称 */
export const DEFAULT_DEVICE_NAME = "iPhone 15 Pro";

/** 根据名称查找设备，找不到则返回默认设备 */
export function findDevice(name?: string): Device {
  if (name) {
    const hit = DEVICES.find((d) => d.name === name);
    if (hit) return hit;
  }
  return DEVICES.find((d) => d.name === DEFAULT_DEVICE_NAME)!;
}
