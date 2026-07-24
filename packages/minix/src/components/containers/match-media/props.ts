export const matchMediaProps = {
  minWidth: { type: [Number, String], default: null },
  maxWidth: { type: [Number, String], default: null },
  width: { type: [Number, String], default: null },
  minHeight: { type: [Number, String], default: null },
  maxHeight: { type: [Number, String], default: null },
  height: { type: [Number, String], default: null },
  orientation: { type: String as () => "landscape" | "portrait", default: null },
};
