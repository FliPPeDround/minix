/** WXML 事件名到 Vue 事件名的映射 */
const EVENT_NAME_MAP: Record<string, string> = {
  tap: "click",
  longtap: "longpress",
  longpress: "longpress",
};

function mapEventName(event: string): string {
  return EVENT_NAME_MAP[event] ?? event;
}

/**
 * 绑定类型 → Vue 修饰符。
 *
 * `capture-catch` / `capture-bind` 始终带冒号（`capture-catch:`），
 * `mut-bind` / `catch` / `bind` 的冒号可选（`bindtap` 与 `bind:tap` 均合法）。
 */
const EVENT_MODIFIERS: Record<string, string> = {
  "capture-catch": ".capture.stop",
  "capture-bind": ".capture",
  "mut-bind": "",
  catch: ".stop",
  bind: "",
};

const EVENT_BINDING_RE = /^(capture-catch:|capture-bind:|(?:mut-bind|catch|bind):?)(.+)$/;

export interface ParsedEvent {
  name: string;
  modifiers: string;
}

/** 解析 WXML 事件绑定，返回 Vue 事件名和修饰符 */
export function parseEventBinding(key: string): ParsedEvent | null {
  const match = key.match(EVENT_BINDING_RE);
  if (!match) return null;
  const type = match[1].replace(/:$/, "");
  return { name: mapEventName(match[2]), modifiers: EVENT_MODIFIERS[type] };
}
