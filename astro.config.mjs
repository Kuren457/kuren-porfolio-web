// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  // Fuente pixel art (OFL). Es variable: grosor 100-900
  fonts: [{
    provider: fontProviders.local(),
    name: 'Tiny5 Duo',
    cssVariable: '--font-tiny5',
    options: {
      variants: [
        { src: ['./src/assets/fonts/Tiny5Duo.ttf'], weight: '100 900', style: 'normal' },
        { src: ['./src/assets/fonts/Tiny5Duo-Italic.ttf'], weight: '100 900', style: 'italic' },
      ],
    },
  }]
});
