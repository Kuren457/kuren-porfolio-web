// src/data/tresD.ts
// Obras de la galería 3D. Cada una sale en la vista "Todos" y en los carruseles de sus categorías.
// Los vídeos llevan su ancho y alto en píxeles para que la página les reserve el hueco antes de cargarlos.
import type { Coleccion, Obra } from './tipos';

export const obras: Obra[] = [
    // Tarjeta 1 (WEBM/MP4)
    {
        src: '/3D/ComicMat.webm',
        ancho: 1920,
        alto: 1080,
        category: 'Materiales',
        title: 'Material estilo comic',
        description: 'Materiales',
        tema: 'blender',
    },

    // Tarjeta 2 (WEBM/MP4)
    {
        src: '/3D/FrogCrystal.webm',
        ancho: 1080,
        alto: 1080,
        category: 'Materiales Modelado',
        title: 'Material estilo cristal',
        description: 'Materiales + Modelado',
        tema: 'blender',
    },

    // Tarjeta 3 (WEBM/MP4)
    {
        src: '/3D/Fire.webm',
        ancho: 1080,
        alto: 1080,
        category: 'VFX Animación',
        title: 'Animación y VFX',
        description: 'VFX',
        tema: 'blender',
    },

    // Tarjeta 4 (WEBM/MP4)
    {
        src: '/3D/Flower2.webm',
        ancho: 1920,
        alto: 1080,
        category: 'Procedural Animación',
        title: 'Animación y Nodos de Geometría',
        description: 'Procedural',
        tema: 'blender',
    },

    // Tarjeta 5 (WEBM/MP4)
    {
        src: '/3D/Kato.mp4',
        ancho: 1920,
        alto: 1080,
        category: 'Personaje Animación',
        title: 'Animación de Personaje Idle',
        description: 'Personaje',
        tema: 'blender',
    },

    // Tarjeta 6 (WEBM/MP4)
    {
        src: '/3D/KatoE.mp4',
        ancho: 1342,
        alto: 1124,
        category: 'Personaje Animación',
        title: 'Animación de Personaje',
        description: 'Personaje',
        tema: 'blender',
    },

    // Tarjeta 7 (PNG/JPG)
    {
        src: '/3D/KatoJumpscare.gif',
        alt: 'KatoJumpscare',
        category: 'Personaje Animación',
        title: 'Animación de Personaje Correr',
        description: 'Personaje',
        tema: 'blender',
    },

    // Tarjeta 8 (PNG/JPG)
    {
        src: '/3D/Lego.png',
        alt: 'Lego',
        category: 'Modelado',
        title: 'Primeros modelos',
        description: 'Modelado',
        tema: 'blender',
    },

    // Tarjeta 9 (WEBM/MP4)
    {
        src: '/3D/ProceduralBuilding.webm',
        ancho: 1920,
        alto: 1080,
        category: 'Procedural Animación',
        title: 'Animación y Nodos de Geometría',
        description: 'Procedural',
        tema: 'blender',
    },

    // Tarjeta 10 (WEBM/MP4)
    {
        src: '/3D/ProceduralFlowerGoofy.webm',
        ancho: 1920,
        alto: 1080,
        category: 'Procedural Animación',
        title: 'Animación y Nodos de Geometría',
        description: 'Procedural',
        tema: 'blender',
    },

    // Tarjeta 11 (WEBM/MP4)
    {
        src: '/3D/Projectile.webm',
        ancho: 1920,
        alto: 1080,
        category: 'VFX Animación',
        title: 'Animación y VFX',
        description: 'VFX',
        tema: 'blender',
    },

    // Tarjeta 12 (PNG/JPG)
    {
        src: '/3D/Pyra1.png',
        alt: 'Pyra',
        category: 'Personaje Modelado',
        title: 'Personaje estilo anime',
        description: 'Modelado',
        tema: 'blender',
    },

    // Tarjeta 13 (PNG/JPG)
    {
        src: '/3D/Pyra2.png',
        alt: 'Pyra',
        category: 'Personaje Modelado',
        title: 'Personaje estilo anime',
        description: 'Modelado',
        tema: 'blender',
    },

    // Tarjeta 14 (PNG/JPG)
    {
        src: '/3D/Tanque.png',
        alt: 'Pyra',
        category: 'Modelado',
        title: 'Primeros modelos',
        description: 'Modelado',
        tema: 'blender',
    },

    // Tarjeta 15 (WEBM/MP4)
    {
        src: '/3D/FlowerCrystal.mp4',
        ancho: 1920,
        alto: 1080,
        category: 'Procedural Materiales',
        title: 'Material y Nodos de Geometría',
        description: 'Procedural + Materiales',
        tema: 'blender',
    },

    // Tarjeta 16 (WEBM/MP4)
    {
        src: '/3D/Horse.webm',
        ancho: 1080,
        alto: 1080,
        category: 'Materiales Modelado',
        title: 'Material estilo cristal',
        description: 'Materiales + Modelado',
        tema: 'blender',
    },

    // Tarjeta 17 (WEBM/MP4)
    {
        src: '/3D/IsometricRoom.webm',
        ancho: 1080,
        alto: 1080,
        category: 'Modelado Escenario',
        title: 'Habitación Isométrica',
        description: 'Modelado',
        tema: 'blender',
    },
];

// Carruseles de la vista "Colecciones", en este orden. Una obra con varias categorías sale en varios
const porCategoria = (categoria: string) => (obra: Obra) => obra.category.split(' ').includes(categoria);

export const colecciones: Coleccion[] = [
    { titulo: 'Modelado',   incluye: porCategoria('Modelado') },
    { titulo: 'Personajes', incluye: porCategoria('Personaje') },
    { titulo: 'Animación',  incluye: porCategoria('Animación') },
    { titulo: 'Materiales', incluye: porCategoria('Materiales') },
    { titulo: 'Procedural', incluye: porCategoria('Procedural') },
    { titulo: 'VFX',        incluye: porCategoria('VFX') },
];
