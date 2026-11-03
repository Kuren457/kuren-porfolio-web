// Guarda a 1x el pixel art de la galería (public/Pixel-art/*.gif|png) que está guardado ya ampliado a una escala
// entera (x2, x3, x5...). La web lo amplía sin suavizar (image-rendering: pixelated), así que se ve igual y pesa
// mucho menos. Antes de reemplazar un archivo comprueba que la animación es idéntica píxel a píxel, con los mismos
// tiempos y el mismo bucle; el original se mueve a fuentes/PixelArt-original/.
// Uso: npm run pixel-1x (con --prueba solo dice lo que haría)
import sharp from 'sharp';
import { mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';

const DIR = 'public/Pixel-art/';
const ORIGINALES = 'fuentes/PixelArt-original/';
// El fondo de la página se amplía suavizado (no es una tarjeta), así que se queda como está
const EXCLUIDOS = ['FundaAjoloteSinAgujero.png'];
const prueba = process.argv.includes('--prueba');

// Todos los fotogramas ya compuestos, uno debajo de otro, en RGBA
const leer = async (entrada) => {
    const imagen = sharp(entrada, { animated: true, limitInputPixels: false });
    const meta = await imagen.metadata();
    const { data, info } = await imagen.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const fotogramas = meta.pages ?? 1;
    return { data, ancho: info.width, alto: info.height, altoFotograma: info.height / fotogramas, fotogramas, delay: meta.delay ?? [], loop: meta.loop ?? 0 };
};

// Mismo color (los píxeles transparentes cuentan como iguales sea cual sea su color)
const igual = (a, i, b, j) => (a[i + 3] === 0 && b[j + 3] === 0) || a.readUInt32BE(i) === b.readUInt32BE(j);

// La mayor escala entera a la que está ampliada (1 si no lo está): cada bloque de k x k de cada fotograma es de un
// solo color
const escalaDe = ({ data, ancho, alto, altoFotograma }) => {
    for (const k of [8, 6, 5, 4, 3, 2]) {
        if (ancho % k || altoFotograma % k) continue;
        let vale = true;
        for (let y = 0; y < alto && vale; y++)
            for (let x = 0; x < ancho && vale; x++)
                if (!igual(data, (y * ancho + x) * 4, data, ((y - (y % altoFotograma) % k) * ancho + (x - x % k)) * 4)) vale = false;
        if (vale) return k;
    }
    return 1;
};

// Un píxel de cada bloque de k x k (la esquina): la imagen a 1x, sin ningún redondeo
const reducir = ({ data, ancho, alto }, k) => {
    const nuevoAncho = ancho / k;
    const nuevoAlto = alto / k;
    const salida = Buffer.alloc(nuevoAncho * nuevoAlto * 4);
    for (let y = 0; y < nuevoAlto; y++)
        for (let x = 0; x < nuevoAncho; x++)
            data.copy(salida, (y * nuevoAncho + x) * 4, (y * k * ancho + x * k) * 4, (y * k * ancho + x * k) * 4 + 4);
    return salida;
};

// La animación tal como se ve: los fotogramas iguales seguidos cuentan como uno que dura la suma de sus tiempos
// (el codificador de GIF los junta)
const secuencia = (data, ancho, altoFotograma, fotogramas, delay) => {
    const tamano = ancho * altoFotograma * 4;
    const lista = [];
    for (let f = 0; f < fotogramas; f++) {
        const pixeles = data.subarray(f * tamano, (f + 1) * tamano);
        const anterior = lista.at(-1);
        if (anterior && anterior.pixeles.equals(pixeles)) anterior.tiempo += delay[f] ?? 0;
        else lista.push({ pixeles, tiempo: delay[f] ?? 0 });
    }
    return lista;
};

const mismaSecuencia = (a, b) => {
    if (a.length !== b.length) return `fotogramas (${a.length} y ${b.length})`;
    for (let f = 0; f < a.length; f++) {
        if (a[f].tiempo !== b[f].tiempo) return `tiempo del fotograma ${f}`;
        for (let i = 0; i < a[f].pixeles.length; i += 4)
            if (!igual(a[f].pixeles, i, b[f].pixeles, i)) return `píxel del fotograma ${f}`;
    }
    return null;
};

mkdirSync(ORIGINALES, { recursive: true });
let antes = 0;
let despues = 0;
for (const nombre of readdirSync(DIR).filter((f) => /\.(gif|png)$/i.test(f) && !EXCLUIDOS.includes(f))) {
    const archivo = DIR + nombre;
    const original = await leer(archivo);
    const k = escalaDe(original);
    if (k === 1) continue;

    const ancho = original.ancho / k;
    const altoFotograma = original.altoFotograma / k;
    const reducida = reducir(original, k);
    const raw = { width: ancho, height: altoFotograma * original.fotogramas, channels: 4, pageHeight: altoFotograma };
    const buffer = /\.gif$/i.test(nombre)
        ? await sharp(reducida, { raw }).gif({ dither: 0, reuse: false, interPaletteMaxError: 0, effort: 10, delay: original.delay, loop: original.loop }).toBuffer()
        : await sharp(reducida, { raw }).png({ compressionLevel: 9 }).toBuffer();

    // Comprobación: el archivo nuevo, leído de vuelta, es la misma animación que el original reducido
    const nueva = await leer(buffer);
    let fallo = nueva.ancho !== ancho || nueva.altoFotograma !== altoFotograma ? 'tamaño'
        : nueva.loop !== original.loop ? 'bucle'
        : mismaSecuencia(secuencia(reducida, ancho, altoFotograma, original.fotogramas, original.delay),
            secuencia(nueva.data, ancho, altoFotograma, nueva.fotogramas, nueva.delay));

    const pesoAntes = statSync(archivo).size;
    if (!fallo && buffer.length >= pesoAntes) fallo = 'no pesa menos';
    const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
    console.log(`${nombre.padEnd(34)} x${k}  ${kb(pesoAntes).padStart(8)} -> ${kb(buffer.length).padStart(7)}  ${fallo ? `NO (${fallo})` : prueba ? 'ok' : 'hecho'}`);
    if (fallo) continue;
    antes += pesoAntes;
    despues += buffer.length;
    if (!prueba) {
        renameSync(archivo, ORIGINALES + nombre);
        writeFileSync(archivo, buffer);
    }
}
console.log(`Total: ${Math.round(antes / 1024)} KB -> ${Math.round(despues / 1024)} KB${prueba ? ' (prueba: no se ha cambiado nada)' : ''}`);
