// src/i18n/idioma.ts
// Los dos idiomas de la web: español en la raíz e inglés bajo /en/ (astro.config.mjs). Las páginas de cada idioma
// solo cargan su vista de src/vistas/; los componentes saben en qué idioma están con idiomaDe(Astro).

export type Idioma = 'es' | 'en';

export const idiomaDe = (astro: { currentLocale?: string }): Idioma => (astro.currentLocale === 'en' ? 'en' : 'es');

// Dirección de cada página en cada idioma
const RUTAS = {
    es: { inicio: '/', pixelArt: '/pixel-art', tresD: '/3d', proyecto: (slug: string) => `/proyectos/${slug}` },
    en: { inicio: '/en/', pixelArt: '/en/pixel-art', tresD: '/en/3d', proyecto: (slug: string) => `/en/projects/${slug}` },
};

export const rutas = (idioma: Idioma) => RUTAS[idioma];

// La misma página en otro idioma (para el selector de idioma y los enlaces alternativos para los buscadores)
export const equivalente = (ruta: string, idioma: Idioma) => {
    const limpia = ruta.replace(/\/$/, '') || '/';
    const sinIdioma = limpia.replace(/^\/en(?=\/|$)/, '') || '/';
    const proyecto = sinIdioma.match(/^\/(?:proyectos|projects)\/([^/]+)$/);
    if (proyecto) return RUTAS[idioma].proyecto(proyecto[1]);
    if (sinIdioma === '/') return RUTAS[idioma].inicio;
    return idioma === 'en' ? `/en${sinIdioma}` : sinIdioma;
};
