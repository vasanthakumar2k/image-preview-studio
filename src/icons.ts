import type { ToolName } from './filters';

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const TOOL_ICONS: Record<ToolName, string> = {
  brightness: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  contrast: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
  exposure: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 9h4M9 7v4M13 16h4M3 21 21 3"/>'),
  saturation: svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M12 20a6 6 0 0 0 6-6H6a6 6 0 0 0 6 6z" fill="currentColor"/>'),
  vibrance: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>'),
  temperature: svg('<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>'),
  tint: svg('<circle cx="9" cy="10" r="5.5"/><circle cx="15" cy="10" r="5.5"/><circle cx="12" cy="15" r="5.5"/>'),
  highlights: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 7l5-3M12 11l7.5-4M12 15l8.5-3.5M12 19l6-2"/>'),
  shadows: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  hue: svg('<path d="M3 17a9 9 0 0 1 18 0"/><path d="M6.5 17a5.5 5.5 0 0 1 11 0"/><path d="M10 17a2 2 0 0 1 4 0"/>'),
  fade: svg('<path d="M4 7h16M6 12h12M8 17h8"/>'),
  sharpness: svg('<path d="M12 3 21 20H3z"/><path d="M12 9l4.5 8"/>'),
  vignette: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><ellipse cx="12" cy="12" rx="5" ry="4"/>'),
  grain: svg('<circle cx="6" cy="6" r=".8" fill="currentColor"/><circle cx="12" cy="7" r=".8" fill="currentColor"/><circle cx="18" cy="6" r=".8" fill="currentColor"/><circle cx="8" cy="12" r=".8" fill="currentColor"/><circle cx="15" cy="11" r=".8" fill="currentColor"/><circle cx="6" cy="18" r=".8" fill="currentColor"/><circle cx="12" cy="16" r=".8" fill="currentColor"/><circle cx="18" cy="17" r=".8" fill="currentColor"/><circle cx="19" cy="12" r=".8" fill="currentColor"/>'),
};

export const UI_ICONS = {
  open: svg('<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/><path d="M12 4v12M7 9l5-5 5 5"/>'),
  reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  compare: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 2v20"/><path d="M12 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7z" fill="currentColor" opacity=".35"/>'),
  download: svg('<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/><path d="M12 4v12M7 11l5 5 5-5"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
};
