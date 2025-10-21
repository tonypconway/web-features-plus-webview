import { defineConfig } from 'rolldown';

export default defineConfig({
  input: './src/index.ts',
  output: {
    dir: './dist',
    format: 'es',
  },
  external: ["web-features", "@mdn/browser-compat-data"]
});
