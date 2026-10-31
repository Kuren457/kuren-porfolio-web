// src/data/proyectos.ts
// Contenido de la página principal: los proyectos (una fila cada uno: tarjeta con enlace, texto y un mini
// carrusel con sus obras) y el carrusel de trabajos personales.
import { obras } from './pixelArt';
import { obras as obras3D } from './tresD';
import type { Obra } from './tipos';

export interface Proyecto {
    nombre: string;
    descripcion: string;
    herramientas: string;
    enlace: string;
    logo: string;
    logoPixelado?: boolean; // El logo es pixel art pequeño y se amplía sin suavizar
    logoAncho?: number;     // Ancho del logo en px (en pixel art, un múltiplo de su tamaño a 1x para que se vea nítido)
    marco?: string;         // GIF propio que envuelve la tarjeta en vez del marco vegetal (64x64 a 1x)
    persecucion?: boolean;  // El demonio persigue a la galleta alrededor de la tarjeta (Persecucion.astro)
    obras: Obra[];
}

const deTema = (...temas: string[]) => obras.filter((obra) => obra.tema && temas.includes(obra.tema));

// Obras de la galería 3D, por su archivo
const de3D = (...srcs: string[]) => srcs.map((src) => obras3D.find((obra) => obra.src === src)!);

export const proyectos: Proyecto[] = [
    {
        nombre: 'BloodRunner',
        descripcion: 'Diseño de personaje principal, animaciones, secuencias animadas del juego y props',
        herramientas: 'Godot & Aseprite',
        enlace: 'https://abelirre.itch.io/bloodrunner',
        logo: '/Logos/BloodRunnerLogo.png',
        obras: deTema('bloodrunner'),
    },
    {
        nombre: 'OuroJam',
        descripcion: 'Diseño de personaje principal, animaciones, secuencias animadas del juego, escenario, tiles y props',
        herramientas: 'Godot & Aseprite',
        enlace: 'https://kurenm.itch.io/ourojam',
        logo: '/Pixel-art/UI Elements/Wukong.png',
        logoPixelado: true,
        logoAncho: 128, // 64 px a 1x, a 2 px por píxel: llena el hueco del dragón
        marco: '/Pixel-art/UI Elements/Dar_vueltas_dragon_1x.gif',
        obras: deTema('ourojam'),
    },
    {
        nombre: 'Hells Gamble',
        descripcion: 'Diseño de personaje principal y enemigos, animaciones, secuencias animadas del juego, escenario, tiles y props.',
        herramientas: 'Godot & Aseprite',
        enlace: 'https://kurenm.itch.io/hells-gamble',
        logo: '/Pixel-art/UI Elements/LogoGambling.png',
        logoPixelado: true,
        persecucion: true,
        obras: deTema('gambling'),
    },
    {
        nombre: 'Neorb',
        descripcion: 'Todos los aspectos visuales del proyecto: desarrollo completo de los enemigos (concept, modelado, rig y animación), material general, props, escenario y VFX.',
        herramientas: 'Unreal Engine & Blender',
        enlace: 'https://kurenm.itch.io/neorb',
        logo: '/Logos/NeorbLogo.png',
        obras: [
            ...de3D('/3D/FrogCrystal.webm', '/3D/Horse.webm'),
            // Fragmentos de gameplay (solo aquí, no en la galería 3D)
            { src: '/3D/Dash.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Dash', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/Intro.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Intro', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/StompAndInception.mp4', ancho: 1280, alto: 720, category: 'Gameplay', title: 'Stomp e Inception', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/Vines.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Vines', description: 'Gameplay de Neorb', tema: 'blender' },
        ],
    },
];

// Mezcla las obras repartiendo cada tema a lo largo de toda la fila (en vez de todas las de un tema seguidas):
// cada obra se ordena por su posición relativa dentro de su tema
const repartir = (lista: Obra[]) => {
    const porTema = new Map<string | undefined, Obra[]>();
    lista.forEach((obra) => porTema.set(obra.tema, [...(porTema.get(obra.tema) ?? []), obra]));
    const posicion = (obra: Obra) => {
        const delTema = porTema.get(obra.tema)!;
        return (delTema.indexOf(obra) + 0.5) / delTema.length;
    };
    return [...lista].sort((a, b) => posicion(a) - posicion(b));
};

// Trabajos personales: todo lo que no es de un proyecto
export const personales = repartir(deTema('marvel', 'og', 'tutorial', 'memes', 'valorant'));
