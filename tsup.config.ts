import { defineConfig } from 'tsup';
export default defineConfig([
  { entry: { index: 'src/index.ts' }, format: ['esm', 'cjs'], dts: true, clean: true, sourcemap: true, target: 'es2019' },
  { entry: { react: 'src/react.tsx' }, format: ['esm', 'cjs'], dts: true, sourcemap: true, target: 'es2019',
    external: ['react', 'react/jsx-runtime'], banner: { js: '"use client";' } },
  { entry: { 'image-preview-studio': 'src/global.ts' }, format: ['iife'], globalName: 'ImagePreviewStudio', minify: true, target: 'es2019',
    outExtension: () => ({ js: '.global.js' }) },
]);
