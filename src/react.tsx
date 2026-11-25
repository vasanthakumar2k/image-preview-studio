import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ImageStudio, type ImageStudioOptions, type ToolName, type Values, type DownloadOptions } from './index';

export * from './index';

export interface ImageStudioEditorProps extends ImageStudioOptions {
  className?: string;
  style?: CSSProperties;
}

export interface ImageStudioHandle {
  getValues(): Values;
  setValues(values: Partial<Values>): void;
  reset(tool?: ToolName): void;
  toBlob(type?: DownloadOptions['type'], quality?: number): Promise<Blob>;
  toDataURL(type?: DownloadOptions['type'], quality?: number): string;
  toCanvas(): HTMLCanvasElement;
  download(opts?: DownloadOptions): Promise<void>;
  instance(): ImageStudio | null;
}

/**
 * React component.
 *
 * ```tsx
 * <ImageStudioEditor src={url} tools={{ grain: false }} onChange={setValues} />
 * ```
 */
export const ImageStudioEditor = forwardRef<ImageStudioHandle, ImageStudioEditorProps>(function ImageStudioEditor(
  { className, style, ...options },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const inst = useRef<ImageStudio | null>(null);
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    const editor = new ImageStudio(hostRef.current!, {
      ...latest.current,
      onChange: (v, t) => latest.current.onChange?.(v, t),
      onReady: (i) => latest.current.onReady?.(i),
      onError: (e) => (latest.current.onError ? latest.current.onError(e) : console.error(e)),
    });
    inst.current = editor;
    return () => {
      editor.destroy();
      inst.current = null;
    };
  }, []);

  // live updates
  const toolsKey = JSON.stringify(options.tools ?? {});
  const labelsKey = JSON.stringify(options.labels ?? {});
  const dlKey = JSON.stringify(options.download ?? true);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    inst.current?.update({
      tools: options.tools, labels: options.labels, theme: options.theme, accent: options.accent,
      header: options.header, title: options.title, upload: options.upload, reset: options.reset,
      compare: options.compare, download: options.download, height: options.height,
    });
  }, [toolsKey, labelsKey, dlKey, options.theme, options.accent, options.header, options.title,
    options.upload, options.reset, options.compare, options.height]);

  useEffect(() => {
    if (options.src && inst.current) inst.current.update({ src: options.src });
  }, [options.src]);

  const valuesKey = JSON.stringify(options.values ?? null);
  useEffect(() => {
    if (options.values && inst.current) inst.current.setValues(options.values);
  }, [valuesKey]);

  useImperativeHandle(ref, () => ({
    getValues: () => inst.current!.getValues(),
    setValues: (v) => inst.current?.setValues(v),
    reset: (t) => inst.current?.reset(t),
    toBlob: (t, q) => inst.current!.toBlob(t, q),
    toDataURL: (t, q) => inst.current!.toDataURL(t, q),
    toCanvas: () => inst.current!.toCanvas(),
    download: (o) => inst.current!.download(o),
    instance: () => inst.current,
  }), []);

  return <div ref={hostRef} className={className} style={{ width: '100%', height: options.height ?? '100%', ...style }} />;
});

export default ImageStudioEditor;
