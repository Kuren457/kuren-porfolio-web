// src/data/timelapses.ts
// Sección de timelapses de la galería de pixel art: cada tarjeta enseña un momento la obra terminada (src) y
// se desvanece al timelapse de cómo se dibujó (src/scripts/timelapses.ts).
// Los timelapses *_1x.gif se generan a partir de los originales con `npm run timelapses`.
import type { Obra } from './tipos';

const T = '/Pixel-art/Timelapses/';
const P = '/Pixel-art/';

const timelapse = (title: string, final: string, archivo: string, tema: Obra['tema']): Obra => ({
    src: P + final,
    timelapse: `${T}${archivo}_1x.gif`,
    alt: title,
    category: 'Timelapse',
    title,
    description: 'Timelapse',
    tema,
});

export const timelapses: Obra[] = [
    // Marvel Rivals
    timelapse('Adam Warlock',       'AdamP.png',       'TimelapseAdam',       'marvel'),
    timelapse('Cyclops',            'Cyclops.png',     'TimelapseCyclops',    'marvel'),
    timelapse('Daredevil',          'Daredevil.png',   'TimelapseDD',         'marvel'),
    timelapse('Deadpool',           'Deadpool.png',    'TimelapseDP',         'marvel'),
    timelapse('Devil Dinosaur',     'Dino.png',        'TimelapseDino',       'marvel'),
    timelapse('Doctor Strange',     'Strange.png',     'TimelapseDrStrange',  'marvel'),
    timelapse('Elsa Bloodstone',    'Elsa.png',        'TimelapseElsa',       'marvel'),
    timelapse('Emma Frost',         'Emma.png',        'TimelapseEmma',       'marvel'),
    timelapse('Gambit',             'Gambit.png',      'TimelapseGambit',     'marvel'),
    timelapse('Gorr',               'Gorr.png',        'TimelapseGorr',       'marvel'),
    timelapse('Groot',              'Groot.png',       'TimelapseGroot',      'marvel'),
    timelapse('Hawkeye',            'Hawkeye.png',     'TimelapseHawkeye',    'marvel'),
    timelapse('Hela',               'Hela.png',        'TimelapseHela',       'marvel'),
    timelapse('Human Torch',        'HumanTorch.png',  'TimelapseHumanTorch', 'marvel'),
    timelapse('Invisible Woman',    'Invis.png',       'TimelapseInvis',      'marvel'),
    timelapse('Iron Fist',          'IronFist.png',    'TimelapseIronFist',   'marvel'),
    timelapse('Iron Man',           'IronMan.png',     'TimelapseIronMan',    'marvel'),
    timelapse('Jeff the Land Shark', 'JeffP.png',      'TimelapseJeff',       'marvel'),
    timelapse('Jubilee',            'Jubilee.png',     'TimelapseJubilee',    'marvel'),
    timelapse('Loki',               'Loki.png',        'TimelapseLoki',       'marvel'),
    timelapse('Luna Snow',          'LunaSnow.png',    'TimelapseLuna',       'marvel'),
    timelapse('Magik',              'MagikP.png',      'TimelapseMagik',      'marvel'),
    timelapse('Magneto',            'MagnetoP.png',    'TimelapseMagneto',    'marvel'),
    timelapse('Mantis',             'Mantis.png',      'TimelapseMantis',     'marvel'),
    timelapse('Psylocke',           'Psy.png',         'TimelapsePsylocke',   'marvel'),

    // Memes (sus finales son animaciones)
    timelapse('Juno',               'JunoCute.gif',       'TimelapseJunoSilly',      'memes'),
    timelapse('Kitty Explosion',    'KittyExplosion.gif', 'TimelapseKittyExplosion', 'memes'),

    // Personales
    timelapse('Kimchi',             'Kimchi.png',              'TimelapseKimchi', 'og'),
    timelapse('Ballena',            'WhalePinterestInspo.png', 'TImelapseWhale',  'og'),
];

// Obras de la galería que son otra versión (p. ej. animada) de la final de un timelapse
const MISMA_OBRA: Record<string, string> = { [P + 'Psy.gif']: P + 'Psy.png' };

// El timelapse de una obra de la galería, si lo tiene
export const timelapseDe = (src: string) => timelapses.find((t) => t.src === (MISMA_OBRA[src] ?? src))?.timelapse;
