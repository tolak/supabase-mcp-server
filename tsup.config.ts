import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/stdio.ts', 'src/sse.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist',
    sourcemap: true,
    dts: true,
    minify: true,
    splitting: true,
  },
]);
