// src/utils/hojas.ts
// Hojas de sprites: al generar la página se mira qué celdas de la hoja tienen dibujo para saber qué fotogramas
// tiene cada animación; la tarjeta (PixelCard con `hoja`) las reproduce con src/scripts/hojas.ts.
import sharp from 'sharp';
import { join } from 'node:path';

export interface Hoja {
    celda: [number, number];  // Ancho y alto de cada fotograma
    fotogramas?: (number | [number, number])[]; // Por fila, cuántos fotogramas tiene su animación (si no, hasta el
                              // último con dibujo; hace falta si la fila lleva el nombre escrito al final), o
                              // [cuántos, ancho] si sus fotogramas son más anchos que la celda
    seguida?: boolean;        // Toda la hoja es una sola animación (las celdas con dibujo, fila a fila), no una por fila
    saltar?: number[];        // Celdas que no son fotogramas, contando fila a fila desde 0
    fps?: number;             // 10 si no se da
}

export interface Animaciones {
    ancho: number;
    alto: number;
    fps: number;
    animaciones: Animacion[];
}

export interface Animacion {
    ancho: number;                    // De sus fotogramas (se dibujan centrados en el ancho de la tarjeta)
    fotogramas: [number, number][];   // La posición (x, y) en la hoja de cada uno
}

const cache = new Map<string, Promise<Animaciones>>();

const analizar = async (src: string, hoja: Hoja): Promise<Animaciones> => {
    const { data, info } = await sharp(join(process.cwd(), 'public', src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const [ancho, alto] = hoja.celda;
    const columnas = Math.floor(info.width / ancho);
    const filas = Math.floor(info.height / alto);
    const conDibujo = (columna: number, fila: number) => {
        for (let y = fila * alto; y < (fila + 1) * alto; y++)
            for (let x = columna * ancho; x < (columna + 1) * ancho; x++)
                if (data[(y * info.width + x) * 4 + 3]) return true;
        return false;
    };
    const vale = (columna: number, fila: number) => !hoja.saltar?.includes(fila * columnas + columna);
    const posicion = (columna: number, fila: number): [number, number] => [columna * ancho, fila * alto];

    const animaciones: Animacion[] = [];
    if (hoja.seguida) {
        const todas: [number, number][] = [];
        for (let fila = 0; fila < filas; fila++)
            for (let columna = 0; columna < columnas; columna++)
                if (vale(columna, fila) && conDibujo(columna, fila)) todas.push(posicion(columna, fila));
        animaciones.push({ ancho, fotogramas: todas });
    } else {
        for (let fila = 0; fila < filas; fila++) {
            const dato = hoja.fotogramas?.[fila];
            let [cuantos, anchoFila] = Array.isArray(dato) ? dato : [dato, ancho];
            if (cuantos === undefined) {
                cuantos = 0;
                for (let columna = 0; columna < columnas; columna++) if (conDibujo(columna, fila)) cuantos = columna + 1;
            }
            // Los huecos en medio de una fila se quedan: son fotogramas en blanco de la animación
            const fotogramas: [number, number][] = [];
            for (let i = 0; i < cuantos; i++)
                if (anchoFila !== ancho || vale(i, fila)) fotogramas.push([i * anchoFila, fila * alto]);
            if (fotogramas.length) animaciones.push({ ancho: anchoFila, fotogramas });
        }
    }
    // La tarjeta, del ancho del fotograma más ancho
    return { ancho: Math.max(...animaciones.map((animacion) => animacion.ancho)), alto, fps: hoja.fps ?? 10, animaciones };
};

export const animacionesDe = (src: string, hoja: Hoja) => {
    const clave = src + JSON.stringify(hoja);
    if (!cache.has(clave)) cache.set(clave, analizar(src, hoja));
    return cache.get(clave)!;
};
