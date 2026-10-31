// Prepara los timelapses de la galería de pixel art: los reduce a 1x (la web los amplía sin suavizar, y así
// pesan mucho menos) y los deja sin bucle (src/scripts/timelapses.ts decide cuándo se repiten).
// Los navegadores no respetan los fotogramas de menos de 20 ms (los muestran 100 ms y el timelapse iría a
// cámara lenta), así que esos fotogramas se saltan y su tiempo pasa al siguiente.
// Los originales están en fuentes/Timelapses/ (fuera de public/ para que no se publiquen con la web); genera
// public/Pixel-art/Timelapses/<nombre>_1x.gif para cada uno. Uso: npm run timelapses
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const ORIGEN = 'fuentes/Timelapses/';
const DESTINO = 'public/Pixel-art/Timelapses/';
const ESCALA = 10;                                     // Escala de exportación de los timelapses...
const OTRA_ESCALA = { 'TimelapseKittyExplosion.gif': 1 }; // ...salvo estos
const RETARDO_MINIMO = 20;                             // ms

const opciones = { animated: true, limitInputPixels: false };

for (const archivo of readdirSync(ORIGEN).filter((f) => f.endsWith('.gif'))) {
    const escala = OTRA_ESCALA[archivo] ?? ESCALA;
    const { width, pageHeight, pages, delay } = await sharp(ORIGEN + archivo, opciones).metadata();
    const ancho = width / escala, alto = pageHeight / escala;
    const fotogramas = await sharp(ORIGEN + archivo, opciones)
        .resize(ancho, alto, { kernel: 'nearest' }) // Por fotograma
        .ensureAlpha().raw().toBuffer();

    const tam = ancho * alto * 4;
    const elegidos = [], retardos = [];
    let acumulado = 0;
    for (let i = 0; i < pages; i++) {
        acumulado += delay[i];
        if (acumulado < RETARDO_MINIMO && i < pages - 1) continue;
        elegidos.push(fotogramas.subarray(i * tam, (i + 1) * tam));
        retardos.push(Math.max(acumulado, RETARDO_MINIMO));
        acumulado = 0;
    }

    const salida = DESTINO + archivo.replace(/\.gif$/, '_1x.gif');
    // dither: 0, reuse: false e interPaletteMaxError: 0 (cada fotograma con su paleta exacta) para no tocar los colores del pixel art
    // (salvo en fotogramas de más de 256 colores, el máximo de un GIF, que se aproximan); loop: 1 = se reproduce una vez
    await sharp(Buffer.concat(elegidos), { raw: { width: ancho, height: alto * elegidos.length, channels: 4, pageHeight: alto } })
        .gif({ loop: 1, delay: retardos, dither: 0, reuse: false, interPaletteMaxError: 0 })
        .toFile(salida);
    console.log('Generado', salida, `(${elegidos.length} de ${pages} fotogramas)`);
}
