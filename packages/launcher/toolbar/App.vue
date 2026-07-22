<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

/** Node 侧通过 toolbar.expose("launcher", {...}) 注入的接口 */
interface LauncherApi {
  devices(): Promise<{ name: string; width: number; height: number }[]>;
  currentDevice(): Promise<string>;
  setDevice(name: string): Promise<void>;
  devtoolsOpen(): Promise<boolean>;
  toggleDevtools(): Promise<boolean>;
  alwaysOnTop(): Promise<boolean>;
  toggleAlwaysOnTop(): Promise<boolean>;
  reload(): Promise<void>;
  url(): Promise<string>;
}

declare global {
  interface Window {
    launcher?: LauncherApi;
    __minixUpdateState?: (patch: Record<string, unknown>) => void;
  }
}

const ICONS = {
  reload: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
  devtools: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
} as const;

const devices = ref<{ name: string; width: number; height: number }[]>([]);
const currentDevice = ref("");
const devtoolsOpen = ref(false);
const alwaysOnTop = ref(false);

const currentDim = computed(() => {
  const d = devices.value.find((d) => d.name === currentDevice.value);
  return d ? `${d.width} × ${d.height}` : "";
});

async function refreshState() {
  const api = window.launcher;
  if (!api) return;
  try {
    const [list, cur, dt, onTop] = await Promise.all([
      api.devices(),
      api.currentDevice(),
      api.devtoolsOpen(),
      api.alwaysOnTop(),
    ]);
    devices.value = list;
    currentDevice.value = cur;
    devtoolsOpen.value = !!dt;
    alwaysOnTop.value = !!onTop;
  } catch {
    // launcher 未就绪，忽略
  }
}

async function onDeviceChange() {
  const api = window.launcher;
  if (!api) return;
  try {
    await api.setDevice(currentDevice.value);
  } catch {
    // ignore
  }
}

async function onReload() {
  try {
    await window.launcher?.reload();
  } catch {
    // ignore
  }
}

async function onToggleDevtools() {
  try {
    devtoolsOpen.value = !!(await window.launcher?.toggleDevtools());
  } catch {
    // ignore
  }
}

async function onToggleAlwaysOnTop() {
  try {
    alwaysOnTop.value = !!(await window.launcher?.toggleAlwaysOnTop());
  } catch {
    // ignore
  }
}

function onKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === "r") {
    e.preventDefault();
    void onReload();
  } else if (e.key === "F12") {
    e.preventDefault();
    void onToggleDevtools();
  }
}

// Node 侧通过 evaluateScript("window.__minixUpdateState({...})") 推送状态
window.__minixUpdateState = (patch: Record<string, unknown>) => {
  if (!patch) return;
  if (typeof patch.device === "string") currentDevice.value = patch.device;
  if (typeof patch.devtools === "boolean") devtoolsOpen.value = patch.devtools;
  if (typeof patch.alwaysOnTop === "boolean") alwaysOnTop.value = patch.alwaysOnTop;
};

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => void refreshState());
});
</script>

<template>
  <div class="toolbar">
    <div class="brand">minix</div>
    <div class="divider" />
    <select id="device" v-model="currentDevice" title="切换设备" @change="onDeviceChange">
      <option v-for="d in devices" :key="d.name" :value="d.name">{{ d.name }}</option>
    </select>
    <div class="dim">{{ currentDim }}</div>
    <div class="spacer" />
    <div class="actions">
      <button class="reload" title="重新加载 (⌘R)" @click="onReload" v-html="ICONS.reload" />
      <button
        class="devtools"
        :class="{ active: devtoolsOpen }"
        title="开发者工具 (F12)"
        @click="onToggleDevtools"
        v-html="ICONS.devtools"
      />
      <button
        class="always-on-top"
        :class="{ active: alwaysOnTop }"
        title="窗口置顶"
        @click="onToggleAlwaysOnTop"
        v-html="ICONS.pin"
      />
    </div>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:global(html),
:global(body) {
  height: 100%;
  background: #1c1c1e;
  color: #f5f5f7;
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
  font-size: 12px;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 100%;
  padding: 0 10px 0 14px;
  background: #1c1c1e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  -webkit-app-region: drag;
}

.toolbar button,
.toolbar select,
.toolbar .dim,
.toolbar .actions {
  -webkit-app-region: no-drag;
}

.brand {
  font-size: 12px;
  font-weight: 600;
  color: #8e8e93;
  letter-spacing: 0.6px;
}

.divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f7;
  border: none;
  border-radius: 6px;
  padding: 5px 22px 5px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='none' stroke='%238e8e93' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: background-color 0.15s;
}

select:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

select:active {
  background-color: rgba(255, 255, 255, 0.12);
}

.dim {
  font-variant-numeric: tabular-nums;
  color: #8e8e93;
  font-size: 11px;
  flex-shrink: 0;
}

.spacer {
  flex: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: #8e8e93;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f7;
}

button:active {
  background: rgba(255, 255, 255, 0.12);
}

button.active {
  background: #0a84ff;
  color: #fff;
}

button.active:hover {
  background: #0a84ff;
  color: #fff;
}

button :deep(svg) {
  display: block;
}
</style>
