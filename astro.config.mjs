// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kuren-porfolio-web.vercel.app',

  // Español en la raíz y la versión en inglés bajo /en/ (textos en src/i18n/)
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },

  // Mapa del sitio para los buscadores (/sitemap-index.xml, enlazado en public/robots.txt), con las dos versiones
  // de cada página
  integrations: [sitemap({
    i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } },
  })],

  vite: {
    plugins: [tailwindcss()]
  },

  // Fuente pixel art (OFL). Es variable: grosor 100-900. Las WOFF2 son versiones ligeras de las TTF (solo el eje de
  // grosor y los caracteres latinos): se generan con python scripts/fuente-web.py
  fonts: [{
    provider: fontProviders.local(),
    name: 'Tiny5 Duo',
    cssVariable: '--font-tiny5',
    options: {
      variants: [
        { src: ['./src/assets/fonts/Tiny5Duo.woff2'], weight: '100 900', style: 'normal' },
        { src: ['./src/assets/fonts/Tiny5Duo-Italic.woff2'], weight: '100 900', style: 'italic' },
      ],
    },
  }]
});
