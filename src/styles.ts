export const STYLE_ID = 'image-preview-studio-styles';

export const CSS = `
.it-root{--it-accent:#4f8cff;--it-bg:#0f1115;--it-surface:#171a21;--it-surface-2:#20242d;--it-border:#2a2f3a;--it-text:#e8eaf0;--it-muted:#8b92a3;--it-track:#343a47;--it-stage:#0b0d10;
  position:relative;display:flex;flex-direction:column;width:100%;height:100%;min-height:360px;overflow:hidden;
  background:var(--it-bg);color:var(--it-text);border-radius:14px;box-sizing:border-box;
  font:500 13px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.it-root *,.it-root *::before,.it-root *::after{box-sizing:border-box}
.it-root.it-light{--it-bg:#f6f7f9;--it-surface:#ffffff;--it-surface-2:#eef0f4;--it-border:#e2e5eb;--it-text:#151821;--it-muted:#6b7280;--it-track:#d9dde5;--it-stage:#eceef2}

.it-header{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--it-border);background:var(--it-surface)}
.it-title{font-weight:600;font-size:14px;margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it-hbtn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--it-border);
  background:var(--it-surface-2);color:var(--it-text);font:inherit;cursor:pointer;transition:background .15s,border-color .15s,opacity .15s}
.it-hbtn svg{width:18px;height:18px}
.it-hbtn:hover{border-color:var(--it-muted)}
.it-hbtn:disabled{opacity:.4;cursor:default}
.it-hbtn.it-primary{background:var(--it-accent);border-color:var(--it-accent);color:#fff}
.it-hbtn.it-pressed{background:var(--it-accent);border-color:var(--it-accent);color:#fff}

.it-stage{position:relative;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--it-stage);padding:16px}
.it-canvas{display:block;flex:none;max-width:none;max-height:none;border-radius:4px;box-shadow:0 6px 30px rgba(0,0,0,.25)}
.it-badge{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:4px 10px;border-radius:99px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;pointer-events:none;opacity:0;transition:opacity .15s}
.it-badge.it-show{opacity:1}
.it-empty{display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--it-muted);text-align:center}
.it-empty>svg{width:44px;height:44px;opacity:.7}

.it-panel{padding:14px 18px 6px;background:var(--it-surface);border-top:1px solid var(--it-border)}
.it-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.it-panel-name{font-weight:600;font-size:13px}
.it-panel-right{display:flex;align-items:center;gap:10px}
.it-value{min-width:44px;text-align:center;font-variant-numeric:tabular-nums;padding:3px 8px;border-radius:7px;background:var(--it-surface-2);font-size:12px}
.it-tool-reset{border:0;background:none;color:var(--it-muted);font:inherit;font-size:12px;cursor:pointer;padding:2px 4px}
.it-tool-reset:hover{color:var(--it-text)}
.it-tool-reset:disabled{opacity:.35;cursor:default}

.it-range{-webkit-appearance:none;appearance:none;width:100%;height:28px;margin:0;background:transparent;cursor:pointer;touch-action:pan-y;display:block}
.it-range:focus{outline:none}
.it-range::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:var(--it-fill)}
.it-range::-moz-range-track{height:4px;border-radius:4px;background:var(--it-fill)}
.it-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-9px;border-radius:50%;background:#fff;border:3px solid var(--it-accent);box-shadow:0 1px 4px rgba(0,0,0,.35);transition:transform .1s}
.it-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid var(--it-accent);box-shadow:0 1px 4px rgba(0,0,0,.35)}
.it-range:active::-webkit-slider-thumb{transform:scale(1.12)}
.it-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px color-mix(in srgb,var(--it-accent) 35%,transparent)}
.it-scale{display:flex;justify-content:space-between;color:var(--it-muted);font-size:11px;margin-top:2px;font-variant-numeric:tabular-nums}

.it-tools{display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;padding:8px 10px calc(10px + env(safe-area-inset-bottom));background:var(--it-surface);
  scroll-snap-type:x proximity;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.it-tools::-webkit-scrollbar{display:none}
.it-tools:not(.it-center){background:linear-gradient(to right,var(--it-surface) 30%,transparent) left center/40px 100% no-repeat local,linear-gradient(to left,var(--it-surface) 30%,transparent) right center/40px 100% no-repeat local,linear-gradient(to right,rgba(0,0,0,.16),transparent) left center/18px 100% no-repeat scroll,linear-gradient(to left,rgba(0,0,0,.16),transparent) right center/18px 100% no-repeat scroll,var(--it-surface)}
.it-tools.it-center{justify-content:center}
.it-tool{position:relative;flex:0 0 auto;width:72px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 2px;border:0;background:none;color:var(--it-muted);font:inherit;font-size:11.5px;cursor:pointer;scroll-snap-align:center;border-radius:10px;transition:color .15s}
.it-tool:hover{color:var(--it-text)}
.it-tool-ic{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--it-surface-2);border:1.5px solid transparent;transition:background .15s,border-color .15s,color .15s}
.it-tool.it-active{color:var(--it-text)}
.it-tool.it-active .it-tool-ic{border-color:var(--it-accent);color:var(--it-accent);background:color-mix(in srgb,var(--it-accent) 14%,var(--it-surface-2))}
.it-tool.it-changed::after{content:"";position:absolute;top:6px;right:15px;width:7px;height:7px;border-radius:50%;background:var(--it-accent);border:2px solid var(--it-surface)}
.it-tool-label{white-space:nowrap}

@media (max-width:520px){
  .it-root{border-radius:0}
  .it-hbtn .it-hlabel{display:none}
  .it-hbtn{padding:0 10px}
  .it-stage{padding:10px}
  .it-panel{padding:12px 16px 4px}
  .it-tool{width:66px}
  .it-tool-ic{width:44px;height:44px}
}
`;

export function injectStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
