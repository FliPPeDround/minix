import { defineVaporComponent, renderEffect, on, type VaporComponent } from "@vue/runtime-vapor";
import { compileTemplate, defineSlotElementComponent, insertDefaultSlot } from "./_shared.ts";

/**
 * 表单类组件：input / textarea / button / label / form / checkbox / radio / slider / switch。
 * 根元素统一为 minix-* 自定义元素；需要原生表单功能（输入、提交、change 事件）
 * 的组件在 minix-* 外壳内部嵌套对应原生标签。
 *
 * 小程序表单语义与 HTML 原生表单接近但有差异：
 * - 事件参数包一层 { detail: { value, ... } }，而非原生 Event
 * - input 的 value 是单向 prop，用户在 bindinput 回调里 setData 回写
 */

function fireValueEvent(
  ctx: any,
  eventName: string,
  rawEvent: Event,
  extra: Record<string, any> = {},
) {
  const target = rawEvent.target as HTMLInputElement | HTMLTextAreaElement;
  const detail = { value: target.value, ...extra };
  ctx.emit?.(eventName, { detail });
  const fn = ctx.attrs?.[`on${eventName[0].toUpperCase()}${eventName.slice(1)}`];
  if (typeof fn === "function") fn({ detail });
}

// ---------------------------------------------------------------------------
// input：minix-input 外壳包原生 <input>，type 映射 + password + confirm-type

const INPUT_TYPE_MAP: Record<string, string> = {
  text: "text",
  number: "number",
  idcard: "text",
  digit: "text",
};

const INPUT_INPUTMODE: Record<string, string> = {
  number: "numeric",
  idcard: "numeric",
  digit: "decimal",
};

const t_input = compileTemplate(
  `<minix-input style="display:inline-block"><input style="border:0;outline:0" /></minix-input>`,
);

export const MinixInput: VaporComponent = defineVaporComponent({
  name: "minix-input",
  props: {
    value: { type: [String, Number], default: "" },
    type: { type: String, default: "text" },
    password: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    maxlength: { type: [Number, String], default: 140 },
    focus: { type: Boolean, default: false },
    confirmType: { type: String, default: "done" },
  },
  setup(props, ctx) {
    const n0 = t_input();
    const input = n0.firstChild as HTMLInputElement;
    renderEffect(() => {
      input.type = props.password ? "password" : (INPUT_TYPE_MAP[props.type] ?? "text");
      input.value = String(props.value ?? "");
      input.placeholder = props.placeholder;
      input.disabled = props.disabled;
      const ml = Number(props.maxlength);
      input.maxLength = ml < 0 ? -1 : ml;
      const inputmode = INPUT_INPUTMODE[props.type];
      if (inputmode) input.inputMode = inputmode as any;
    });
    on(input, "input", (e: Event) => fireValueEvent(ctx, "input", e));
    on(input, "focus", (e: FocusEvent) =>
      fireValueEvent(ctx, "focus", e as unknown as Event, { height: 0 }),
    );
    on(input, "blur", (e: Event) => fireValueEvent(ctx, "blur", e));
    on(input, "keydown", (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      fireValueEvent(ctx, "confirm", e as unknown as Event);
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// textarea：minix-textarea 外壳包原生 <textarea>

const t_textarea = compileTemplate(
  `<minix-textarea style="display:inline-block"><textarea style="border:0;outline:0"></textarea></minix-textarea>`,
);

export const MinixTextarea: VaporComponent = defineVaporComponent({
  name: "minix-textarea",
  props: {
    value: { type: [String, Number], default: "" },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    maxlength: { type: [Number, String], default: 140 },
    focus: { type: Boolean, default: false },
    autoHeight: { type: Boolean, default: false },
  },
  setup(props, ctx) {
    const n0 = t_textarea();
    const ta = n0.firstChild as HTMLTextAreaElement;
    renderEffect(() => {
      ta.value = String(props.value ?? "");
      ta.placeholder = props.placeholder;
      ta.disabled = props.disabled;
      const ml = Number(props.maxlength);
      ta.maxLength = ml < 0 ? -1 : ml;
    });
    on(ta, "input", (e: Event) => fireValueEvent(ctx, "input", e));
    return n0;
  },
});

// ---------------------------------------------------------------------------
// button：minix-button 自定义元素，点击触发 bindtap（不需要原生 button 表单语义）

const BUTTON_TYPE_COLOR: Record<string, string> = {
  primary: "#07C160",
  warn: "#E64340",
  default: "#F8F8F8",
};

const t_button = compileTemplate(
  `<minix-button style="display:inline-block;cursor:pointer"></minix-button>`,
);

export const MinixButton: VaporComponent = defineVaporComponent({
  name: "minix-button",
  props: {
    type: { type: String, default: "default" },
    size: { type: String, default: "default" },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    plain: { type: Boolean, default: false },
  },
  setup(props) {
    const n0 = t_button();
    renderEffect(() => {
      const el = n0 as HTMLElement;
      const color = BUTTON_TYPE_COLOR[props.type] ?? BUTTON_TYPE_COLOR.default;
      if (props.disabled || props.loading) {
        el.style.opacity = "0.6";
        el.style.pointerEvents = "none";
      } else {
        el.style.opacity = "1";
        el.style.pointerEvents = "";
      }
      if (props.plain) {
        el.style.background = "transparent";
        el.style.color = color;
        el.style.border = `1px solid ${color}`;
      } else {
        el.style.background = color;
        el.style.color = props.type === "default" ? "#000" : "#fff";
        el.style.border = "none";
      }
      if (props.size === "mini") {
        el.style.display = "inline-block";
        el.style.padding = "0 8px";
        el.style.fontSize = "13px";
      } else {
        el.style.display = "block";
        el.style.padding = "0 14px";
        el.style.fontSize = "18px";
      }
    });
    insertDefaultSlot(n0);
    return n0;
  },
});

// ---------------------------------------------------------------------------
// label：minix-label 自定义元素，等价小程序 label（点击触发关联表单项）

export const MinixLabel: VaporComponent = defineSlotElementComponent(
  "minix-label",
  "display:inline",
);

// ---------------------------------------------------------------------------
// form：minix-form 外壳包原生 <form>，submit 时收集 FormData

const t_form = compileTemplate(`<minix-form style="display:block"><form></form></minix-form>`);

export const MinixForm: VaporComponent = defineVaporComponent({
  name: "minix-form",
  props: {
    reportSubmit: { type: Boolean, default: false },
  },
  setup(props, ctx) {
    const n0 = t_form();
    const form = n0.firstChild as HTMLFormElement;
    on(form, "submit", (e: Event) => {
      e.preventDefault();
      const data: Record<string, any> = {};
      new FormData(form).forEach((v, k) => (data[k] = v));
      ctx.emit?.("submit", { detail: { formId: "", value: data } });
      const fn = (ctx.attrs as any).onSubmit;
      if (typeof fn === "function") fn({ detail: { formId: "", value: data } });
    });
    on(form, "reset", () => {
      setTimeout(() => {
        ctx.emit?.("reset", { detail: {} });
        const fn = (ctx.attrs as any).onReset;
        if (typeof fn === "function") fn({ detail: {} });
      }, 0);
    });
    // form 的子节点要插入到内部 <form> 里，否则 FormData 收集不到
    insertDefaultSlot(form);
    return n0;
  },
});

// ---------------------------------------------------------------------------
// checkbox / radio / switch：minix-* 外壳包原生 <input>

const t_checkbox = compileTemplate(
  `<minix-checkbox style="display:inline-block"><input type="checkbox" /></minix-checkbox>`,
);

export const MinixCheckbox: VaporComponent = defineVaporComponent({
  name: "minix-checkbox",
  props: {
    value: { type: [String, Number, Boolean], default: "" },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    color: { type: String, default: "#09BB07" },
  },
  setup(props, ctx) {
    const n0 = t_checkbox();
    const input = n0.firstChild as HTMLInputElement;
    renderEffect(() => {
      input.checked = props.checked;
      input.disabled = props.disabled;
      input.style.accentColor = props.color;
    });
    on(input, "change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      ctx.emit?.("change", { detail: { value: target.checked } });
      const fn = (ctx.attrs as any).onChange;
      if (typeof fn === "function") fn({ detail: { value: target.checked } });
    });
    return n0;
  },
});

const t_radio = compileTemplate(
  `<minix-radio style="display:inline-block"><input type="radio" /></minix-radio>`,
);

export const MinixRadio: VaporComponent = defineVaporComponent({
  name: "minix-radio",
  props: {
    value: { type: [String, Number, Boolean], default: "" },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    color: { type: String, default: "#09BB07" },
  },
  setup(props, ctx) {
    const n0 = t_radio();
    const input = n0.firstChild as HTMLInputElement;
    renderEffect(() => {
      input.checked = props.checked;
      input.disabled = props.disabled;
      input.style.accentColor = props.color;
    });
    on(input, "change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      ctx.emit?.("change", { detail: { value: target.value } });
      const fn = (ctx.attrs as any).onChange;
      if (typeof fn === "function") fn({ detail: { value: target.value } });
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// slider：minix-slider 外壳包原生 <input type="range"> + 可选数值 label

const t_slider = compileTemplate(
  `<minix-slider style="display:flex;align-items:center"><input type="range" /><span style="margin-left:8px;font-size:12px"></span></minix-slider>`,
);

export const MinixSlider: VaporComponent = defineVaporComponent({
  name: "minix-slider",
  props: {
    min: { type: [Number, String], default: 0 },
    max: { type: [Number, String], default: 100 },
    step: { type: [Number, String], default: 1 },
    value: { type: [Number, String], default: 0 },
    showValue: { type: Boolean, default: false },
    activeColor: { type: String, default: "#1AAD19" },
    disabled: { type: Boolean, default: false },
  },
  setup(props, ctx) {
    const n0 = t_slider();
    const input = (n0 as HTMLElement).firstChild as HTMLInputElement;
    const label = (n0 as HTMLElement).lastChild as HTMLElement;
    renderEffect(() => {
      input.min = String(props.min);
      input.max = String(props.max);
      input.step = String(props.step);
      input.value = String(props.value);
      input.disabled = props.disabled;
      input.style.accentColor = props.activeColor;
      label.textContent = props.showValue ? String(props.value) : "";
      label.style.display = props.showValue ? "" : "none";
    });
    on(input, "input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      ctx.emit?.("changing", { detail: { value: Number(target.value) } });
      const fn = (ctx.attrs as any).onChanging;
      if (typeof fn === "function") fn({ detail: { value: Number(target.value) } });
    });
    on(input, "change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      ctx.emit?.("change", { detail: { value: Number(target.value) } });
      const fn = (ctx.attrs as any).onChange;
      if (typeof fn === "function") fn({ detail: { value: Number(target.value) } });
    });
    return n0;
  },
});

// ---------------------------------------------------------------------------
// switch：minix-switch 外壳包原生 <input type="checkbox">

const t_switch = compileTemplate(
  `<minix-switch style="display:inline-block"><input type="checkbox" /></minix-switch>`,
);

export const MinixSwitch: VaporComponent = defineVaporComponent({
  name: "minix-switch",
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    color: { type: String, default: "#04BE02" },
  },
  setup(props, ctx) {
    const n0 = t_switch();
    const input = n0.firstChild as HTMLInputElement;
    renderEffect(() => {
      input.checked = props.checked;
      input.disabled = props.disabled;
      input.style.accentColor = props.color;
    });
    on(input, "change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      ctx.emit?.("change", { detail: { value: target.checked } });
      const fn = (ctx.attrs as any).onChange;
      if (typeof fn === "function") fn({ detail: { value: target.checked } });
    });
    return n0;
  },
});
