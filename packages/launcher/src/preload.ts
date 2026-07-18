import type { Device } from "./types.ts";

/**
 * wry 不支持 CDP 风格的设备模拟，这里通过 preload 脚本做近似：
 *  1. 覆写 navigator.userAgent / platform / vendor / maxTouchPoints
 *  2. 注入 / 修正 <meta name="viewport"> 让页面按设备宽度渲染
 *  3. 把鼠标事件转换为 touch 事件，让小程序代码的 touch 处理器能被触发
 *  4. 覆写 window.matchMedia("(pointer: coarse)") 之类的查询
 *
 * preload 在每个页面脚本之前执行，能影响首屏的 feature detection。
 */
export function buildPreloadScript(device: Device): string {
  const ua = device.userAgent.replace(/'/g, "\\'");
  const touchPoints = device.touch ? 5 : 0;
  // iOS Safari 的 platform 是 "iPhone" / "iPad"，Android 是 "Linux armv8l" 之类
  const platform = /iPhone|iPad|iPod/.test(ua)
    ? /iPad/.test(ua)
      ? "iPad"
      : "iPhone"
    : "Linux armv8l";
  const vendor = /iPhone|iPad|iPod/.test(ua) ? "Apple Computer, Inc." : "Google Inc.";

  return `
(function () {
  var UA = '${ua}';
  var PLATFORM = '${platform}';
  var VENDOR = '${vendor}';
  var TOUCH_POINTS = ${touchPoints};
  var DPR = ${device.pixelRatio};
  var VW = ${device.width};
  var VH = ${device.height};

  function defineProp(obj, key, getter) {
    try {
      Object.defineProperty(obj, key, { get: getter, configurable: true });
    } catch (_) {}
  }

  // ── navigator 覆写 ──────────────────────────────────────────
  defineProp(navigator, 'userAgent', function () { return UA; });
  defineProp(navigator, 'appVersion', function () { return UA.replace(/^Mozilla\\//, ''); });
  defineProp(navigator, 'platform', function () { return PLATFORM; });
  defineProp(navigator, 'vendor', function () { return VENDOR; });
  defineProp(navigator, 'maxTouchPoints', function () { return TOUCH_POINTS; });
  try {
    if (navigator.userAgentData) {
      defineProp(navigator.userAgentData, 'platform', function () { return PLATFORM; });
    }
  } catch (_) {}

  // ── window 维度（接近设备 viewport，不直接锁死，避免破坏布局） ──
  // 注意 innerWidth/innerHeight 是只读的，defineProperty 会被部分浏览器拒绝；
  // 这里只在能覆写时生效，否则以窗口实际尺寸为准。
  try { Object.defineProperty(window, 'innerWidth', { get: function () { return VW; }, configurable: true }); } catch (_) {}
  try { Object.defineProperty(window, 'innerHeight', { get: function () { return VH; }, configurable: true }); } catch (_) {}
  try { Object.defineProperty(window, 'devicePixelRatio', { get: function () { return DPR; }, configurable: true }); } catch (_) {}

  // ── viewport meta ────────────────────────────────────────────
  function ensureViewport() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      (document.head || document.documentElement).appendChild(meta);
    }
    meta.setAttribute('content', 'width=' + VW + ',initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  }
  if (document.head) {
    ensureViewport();
  } else {
    document.addEventListener('DOMContentLoaded', ensureViewport);
  }

  // ── matchMedia pointer 模拟 ─────────────────────────────────
  var origMatch = window.matchMedia ? window.matchMedia.bind(window) : null;
  if (origMatch) {
    window.matchMedia = function (query) {
      var m = origMatch(query);
      if (typeof query === 'string' && TOUCH_POINTS > 0) {
        if (query.indexOf('pointer: coarse') !== -1 || query.indexOf('(any-pointer: coarse)') !== -1) {
          // 强制匹配 coarse pointer（触摸）
          try {
            Object.defineProperty(m, 'matches', { get: function () { return true; }, configurable: true });
          } catch (_) {}
        }
        if (query.indexOf('hover: none') !== -1 || query.indexOf('(any-hover: none)') !== -1) {
          try {
            Object.defineProperty(m, 'matches', { get: function () { return true; }, configurable: true });
          } catch (_) {}
        }
      }
      return m;
    };
  }

  // ── Touch 事件模拟：mouse → touch ───────────────────────────
  if (TOUCH_POINTS > 0) {
    var activeTouch = null;

    function fireTouch(type, x, y, target) {
      var touch = { identifier: 1, target: target, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y, radiusX: 1, radiusY: 1, force: 1 };
      if (type === 'touchstart' || type === 'touchmove') activeTouch = touch;
      else if (type === 'touchend' || type === 'touchcancel') activeTouch = null;
      var evt;
      try {
        evt = new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [touch], targetTouches: [touch], changedTouches: [touch] });
      } catch (_) {
        evt = document.createEvent('TouchEvent');
        evt.initTouchEvent(type, true, true);
      }
      target.dispatchEvent(evt);
      return evt;
    }

    function targetFromEvent(e) {
      return e.target || document.elementFromPoint(e.clientX, e.clientY) || document.body;
    }

    document.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      var t = targetFromEvent(e);
      var evt = fireTouch('touchstart', e.clientX, e.clientY, t);
      if (evt.defaultPrevented) e.preventDefault();
    }, true);

    document.addEventListener('mousemove', function (e) {
      if (!activeTouch) return;
      var t = targetFromEvent(e);
      var evt = fireTouch('touchmove', e.clientX, e.clientY, t);
      if (evt.defaultPrevented) e.preventDefault();
    }, true);

    document.addEventListener('mouseup', function (e) {
      if (!activeTouch) return;
      var t = targetFromEvent(e);
      var evt = fireTouch('touchend', e.clientX, e.clientY, t);
      if (evt.defaultPrevented) e.preventDefault();
    }, true);

    document.addEventListener('mouseleave', function (e) {
      if (!activeTouch) return;
      var t = targetFromEvent(e);
      fireTouch('touchcancel', e.clientX, e.clientY, t);
    }, true);

    // 阻止桌面右键菜单（小程序环境没有右键）
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, true);
  }

  // ── 标记 ─────────────────────────────────────────────────────
  try { Object.defineProperty(window, '__MINIX_DEVICE__', { value: ${JSON.stringify(device.name)}, writable: false, configurable: false }); } catch (_) {}
})();
`;
}
