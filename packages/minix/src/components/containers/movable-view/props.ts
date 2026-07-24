export const movableViewProps = {
  direction: {
    type: String as () => "all" | "vertical" | "horizontal" | "none",
    default: "none",
  },
  inertia: { type: Boolean, default: false },
  outOfBounds: { type: Boolean, default: false },
  x: { type: [Number, String], default: 0 },
  y: { type: [Number, String], default: 0 },
  damping: { type: [Number, String], default: 20 },
  friction: { type: [Number, String], default: 2 },
  disabled: { type: Boolean, default: false },
  scale: { type: Boolean, default: false },
  scaleMin: { type: [Number, String], default: 0.5 },
  scaleMax: { type: [Number, String], default: 10 },
  scaleValue: { type: [Number, String], default: 1 },
};
