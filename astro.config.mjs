// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],

  site: 'https://blog.duchi.click',
  output: 'static',
  image: {
    domains: ['cdn.duchi.click'],
  },

  env: {
    schema: {
      GHOST_API_URL: envField.string({
        context: 'server',
        access: 'public',
        default: 'https://cms.duchi.click/ghost',
      }),
      GHOST_CONTENT_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
      }),
    },
  },
});
