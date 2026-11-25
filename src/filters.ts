export type ToolName =
  | 'brightness'
  | 'contrast'
  | 'exposure'
  | 'saturation'
  | 'vibrance'
  | 'temperature'
  | 'tint'
  | 'highlights'
  | 'shadows'
  | 'hue'
  | 'fade'
  | 'sharpness'
  | 'vignette'
  | 'grain';

export type Values = Record<ToolName, number>;

export interface ToolDef {
  name: ToolName;
  label: string;
  min: number;
  max: number;
}

/** All tools, in the order they appear in the bottom bar. */
export const TOOLS: ToolDef[] = [
  { name: 'brightness', label: 'Brightness', min: -100, max: 100 },
  { name: 'contrast', label: 'Contrast', min: -100, max: 100 },
  { name: 'exposure', label: 'Exposure', min: -100, max: 100 },
  { name: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { name: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
  { name: 'temperature', label: 'Temp', min: -100, max: 100 },
  { name: 'tint', label: 'Tint', min: -100, max: 100 },
  { name: 'highlights', label: 'Highlights', min: -100, max: 100 },
  { name: 'shadows', label: 'Shadows', min: -100, max: 100 },
  { name: 'hue', label: 'Hue', min: -180, max: 180 },
  { name: 'fade', label: 'Fade', min: 0, max: 100 },
  { name: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
  { name: 'vignette', label: 'Vignette', min: 0, max: 100 },
  { name: 'grain', label: 'Grain', min: 0, max: 100 },
];

export const TOOL_NAMES = TOOLS.map((t) => t.name);

export function defaultValues(): Values {
  const v = {} as Values;
  for (const t of TOOLS) v[t.name] = 0;
  return v;
}

/** Clamp incoming values to each tool's range; unknown keys are dropped. */
export function normalizeValues(input?: Partial<Values>, base: Values = defaultValues()): Values {
  const out = { ...base };
  if (!input) return out;
  for (const t of TOOLS) {
    const raw = input[t.name];
    if (typeof raw === 'number' && isFinite(raw)) {
      out[t.name] = Math.max(t.min, Math.min(t.max, Math.round(raw)));
    }
  }
  return out;
}

let scratch: Uint8ClampedArray | null = null;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h & 0xffff) / 0xffff;
}

/**
 * Apply every adjustment to RGBA pixels.
 * `src` and `dst` may not be the same array. Values of 0 are no-ops.
 */
export function processPixels(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  v: Values,
): void {
  const ex = Math.pow(2, (v.exposure / 100) * 1.5);
  const br = (v.brightness / 100) * 100;
  const C = v.contrast * 1.5;
  const cf = (259 * (C + 255)) / (255 * (259 - C));
  const sat = 1 + v.saturation / 100;
  const vib = v.vibrance / 100;
  const temp = (v.temperature / 100) * 40;
  const tint = (v.tint / 100) * 40;
  const hl = v.highlights / 100;
  const sh = v.shadows / 100;
  const fade = v.fade / 100;

  const useHue = v.hue !== 0;
  let m0 = 1, m1 = 0, m2 = 0, m3 = 0, m4 = 1, m5 = 0, m6 = 0, m7 = 0, m8 = 1;
  if (useHue) {
    const a = (v.hue * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    m0 = 0.213 + c * 0.787 - s * 0.213;
    m1 = 0.715 - c * 0.715 - s * 0.715;
    m2 = 0.072 - c * 0.072 + s * 0.928;
    m3 = 0.213 - c * 0.213 + s * 0.143;
    m4 = 0.715 + c * 0.285 + s * 0.14;
    m5 = 0.072 - c * 0.072 - s * 0.283;
    m6 = 0.213 - c * 0.213 - s * 0.787;
    m7 = 0.715 - c * 0.715 + s * 0.715;
    m8 = 0.072 + c * 0.928 + s * 0.072;
  }

  const len = w * h * 4;
  for (let i = 0; i < len; i += 4) {
    let r = src[i], g = src[i + 1], b = src[i + 2];

    if (ex !== 1) { r *= ex; g *= ex; b *= ex; }
    if (br !== 0) { r += br; g += br; b += br; }
    if (temp !== 0) { r += temp; b -= temp; }
    if (tint !== 0) { g -= tint; r += tint * 0.3; b += tint * 0.3; }

    if (hl !== 0 || sh !== 0) {
      let l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      l = l < 0 ? 0 : l > 1 ? 1 : l;
      const d = sh * (1 - l) * (1 - l) * 80 + hl * l * l * 80;
      r += d; g += d; b += d;
    }

    if (cf !== 1) {
      r = (r - 128) * cf + 128;
      g = (g - 128) * cf + 128;
      b = (b - 128) * cf + 128;
    }

    if (useHue) {
      const nr = r * m0 + g * m1 + b * m2;
      const ng = r * m3 + g * m4 + b * m5;
      const nb = r * m6 + g * m7 + b * m8;
      r = nr; g = ng; b = nb;
    }

    if (sat !== 1 || vib !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let k = sat;
      if (vib !== 0) {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        let level = (mx - mn) / 255;
        level = level > 1 ? 1 : level;
        k *= 1 + vib * (1 - level);
      }
      r = gray + (r - gray) * k;
      g = gray + (g - gray) * k;
      b = gray + (b - gray) * k;
    }

    if (fade !== 0) {
      const f1 = 1 - 0.18 * fade, f2 = 42 * fade;
      r = r * f1 + f2; g = g * f1 + f2; b = b * f1 + f2;
    }

    dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = src[i + 3];
  }

  if (v.sharpness > 0) sharpen(dst, w, h, (v.sharpness / 100) * 1.6);
  if (v.vignette > 0 || v.grain > 0) vignetteGrain(dst, w, h, v.vignette / 100, v.grain / 100);
}

function sharpen(px: Uint8ClampedArray, w: number, h: number, amt: number): void {
  if (w < 3 || h < 3) return;
  if (!scratch || scratch.length !== px.length) scratch = new Uint8ClampedArray(px.length);
  const s = scratch;
  s.set(px);
  const row = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * row + x * 4;
      for (let c = 0; c < 3; c++) {
        const j = i + c;
        const blur =
          (s[j - row - 4] + s[j - row] + s[j - row + 4] +
            s[j - 4] + s[j] + s[j + 4] +
            s[j + row - 4] + s[j + row] + s[j + row + 4]) / 9;
        px[j] = s[j] + (s[j] - blur) * amt;
      }
    }
  }
}

function vignetteGrain(px: Uint8ClampedArray, w: number, h: number, vig: number, grain: number): void {
  const cx = w / 2, cy = h / 2;
  const maxD = Math.sqrt(cx * cx + cy * cy) || 1;
  // keep grain size similar on preview and full-size export
  const gScale = Math.max(1, Math.round(Math.max(w, h) / 1600));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let f = 1;
      if (vig > 0) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy) / maxD;
        let t = (d - 0.35) / 0.65;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = t * t * (3 - 2 * t);
        f = 1 - vig * t * 0.85;
      }
      const n = grain > 0 ? (hash((x / gScale) | 0, (y / gScale) | 0) - 0.5) * grain * 70 : 0;
      px[i] = px[i] * f + n;
      px[i + 1] = px[i + 1] * f + n;
      px[i + 2] = px[i + 2] * f + n;
    }
  }
}
