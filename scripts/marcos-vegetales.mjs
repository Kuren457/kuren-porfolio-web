// Prepara los marcos decorados (Marco2Vegetal, Marco2VegetalAjolote) para usarlos en cualquier tamaño:
//  - <Marco>_base.png: el borde liso (cuadrante superior izquierdo reflejado), que se estira en 9-slice
//  - <Marco>_<esquina>.png: la decoración de cada esquina, que se pega encima sin estirar
//  - EnredaderasBorde_izq.gif / _der.gif: la enredadera animada recortada a 1x, y su versión invertida
//  - src/styles/marcos-vegetales.css: las clases .marco-vegetal / .marco-ajolote con las medidas de cada sprite,
//    y .enredadera-izq / .enredadera-der para añadir la enredadera sobre un borde lateral
// Uso: npm run marcos
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const DIR = 'public/Pixel-art/UI Elements/';
const URL = '/Pixel-art/UI Elements/';
const ESCALA = 10;          // Los PNG se exportan a 10x desde Aseprite
const MAX_ALTO_BOTON = 28;  // En botones se omite la decoración más alta que esto (p. ej. la enredadera)

const MARCOS = {
    Marco2Vegetal: 'marco-vegetal',
    Marco2VegetalAjolote: 'marco-ajolote',
};

const ENREDADERA = 'EnredaderasBorde';
const TALLO_X = 23;  // Columna (a 1x) del tallo de la enredadera en su lienzo: es la que se alinea con el borde

// El ::before es más ancho que el elemento (--marco-margen por cada lado) para que la enredadera
// pueda sobresalir del borde; las esquinas se colocan descontando ese margen
const M = 'var(--marco-margen)';
const POSICION = {
    tl: `left ${M} top 0`, tr: `right ${M} top 0`,
    bl: `left ${M} bottom 0`, br: `right ${M} bottom 0`,
};

let css = '/* GENERADO por scripts/marcos-vegetales.mjs (npm run marcos). No editar a mano. */\n';

// --- Enredadera animada: recorte a 1x (unión de todos los fotogramas) y versión invertida ---
{
    const gif = sharp(DIR + ENREDADERA + '.gif', { animated: true });
    const { width, pageHeight, pages, delay, loop } = await gif.metadata();
    const { data } = await gif.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = width, y0 = pageHeight, x1 = -1, y1 = -1;
    for (let y = 0; y < pageHeight * pages; y++) {
        for (let x = 0; x < width; x++) {
            if (!data[(y * width + x) * 4 + 3]) continue;
            const fy = y % pageHeight;
            x0 = Math.min(x0, x); y0 = Math.min(y0, fy); x1 = Math.max(x1, x); y1 = Math.max(y1, fy);
        }
    }
    const recorte = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
    const ancho = recorte.width / ESCALA, alto = recorte.height / ESCALA;
    const tallo = TALLO_X - x0 / ESCALA;
    const izq = gif.clone().extract(recorte).resize(ancho, alto, { kernel: 'nearest' });
    await izq.clone().gif({ delay, loop }).toFile(`${DIR}${ENREDADERA}_izq.gif`);
    await izq.clone().flop().gif({ delay, loop }).toFile(`${DIR}${ENREDADERA}_der.gif`);

    // El centro del tallo se alinea con el centro del borde (que mide 3 px)
    const desplazamiento = `calc(${M} + ${1 - tallo} * var(--px))`;
    for (const [lado, borde] of [['izq', 'left'], ['der', 'right']]) {
        css += `\n.enredadera-${lado} {\n` +
            `    --enredadera: url('${URL}${ENREDADERA}_${lado}.gif');\n` +
            `    --enredadera-pos: ${borde} ${desplazamiento} center;\n` +
            `    --enredadera-size: calc(${ancho} * var(--px)) calc(${alto} * var(--px));\n}\n`;
    }
    console.log(`${ENREDADERA}: ${ancho}x${alto}, ${pages} fotogramas`);
}

for (const [nombre, clase] of Object.entries(MARCOS)) {
    const original = sharp(DIR + nombre + '.png');
    const { width } = await original.metadata();
    const T = width / ESCALA;
    const { data } = await original.resize(T, T, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pos = (x, y) => (y * T + x) * 4;

    // Base: cuadrante superior izquierdo reflejado en las 4 esquinas
    const base = Buffer.alloc(data.length);
    const mitad = T / 2;
    for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
            const sx = x < mitad ? x : T - 1 - x;
            const sy = y < mitad ? y : T - 1 - y;
            data.copy(base, pos(x, y), pos(sx, sy), pos(sx, sy) + 4);
        }
    }

    // Píxeles de decoración: los que no coinciden con la base
    const esDeco = new Uint8Array(T * T);
    for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
            const i = pos(x, y);
            if (data.compare(base, i, i + 4, i, i + 4) === 0) continue;
            if (data[i + 3] === 0) throw new Error(`${nombre}: la decoración borra el borde en ${x},${y}; la esquina superior izquierda debe ser lisa`);
            esDeco[y * T + x] = 1;
        }
    }

    // Agrupar la decoración en manchas (salvando huecos de 1 px, como el dithering) y asignar cada una a su esquina más cercana
    const esquinas = {};
    const visto = new Uint8Array(T * T);
    for (let inicio = 0; inicio < T * T; inicio++) {
        if (!esDeco[inicio] || visto[inicio]) continue;
        let x0 = T, y0 = T, x1 = -1, y1 = -1;
        const pila = [inicio], pixeles = [];
        visto[inicio] = 1;
        while (pila.length) {
            const p = pila.pop(), x = p % T, y = (p - x) / T;
            pixeles.push(p);
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx, ny = y + dy, n = ny * T + nx;
                if (nx >= 0 && ny >= 0 && nx < T && ny < T && esDeco[n] && !visto[n]) { visto[n] = 1; pila.push(n); }
            }
        }
        const esquina = ((y0 + y1) / 2 < mitad ? 't' : 'b') + ((x0 + x1) / 2 < mitad ? 'l' : 'r');
        const e = esquinas[esquina] ??= { x0, y0, x1, y1, pixeles: [] };
        Object.assign(e, { x0: Math.min(e.x0, x0), y0: Math.min(e.y0, y0), x1: Math.max(e.x1, x1), y1: Math.max(e.y1, y1) });
        e.pixeles.push(...pixeles);
    }

    await sharp(base, { raw: { width: T, height: T, channels: 4 } }).png().toFile(`${DIR}${nombre}_base.png`);

    // Cada sprite lleva solo los píxeles de su decoración (no los de otras esquinas que caigan en su rectángulo)
    // y se recorta desde su esquina, para colocarlo pegado a ella sin desplazamientos
    const capas = [];
    for (const [esquina, { x0, y0, x1, y1, pixeles }] of Object.entries(esquinas)) {
        const sprite = Buffer.alloc(data.length);
        for (const p of pixeles) data.copy(sprite, p * 4, p * 4, p * 4 + 4);
        const left = esquina[1] === 'l' ? 0 : x0;
        const top = esquina[0] === 't' ? 0 : y0;
        const ancho = (esquina[1] === 'l' ? x1 + 1 : T) - left;
        const alto = (esquina[0] === 't' ? y1 + 1 : T) - top;
        await sharp(sprite, { raw: { width: T, height: T, channels: 4 } })
            .extract({ left, top, width: ancho, height: alto }).png().toFile(`${DIR}${nombre}_${esquina}.png`);
        capas.push({ url: `url('${URL}${nombre}_${esquina}.png')`, pos: POSICION[esquina], size: `calc(${ancho} * var(--px)) calc(${alto} * var(--px))`, alto });
    }

    // La enredadera va como última capa (debajo de la decoración de las esquinas); sin .enredadera-* es `none`
    const reglas = (lista) =>
        `    background-image: ${[...lista.map((c) => c.url), 'var(--enredadera, none)'].join(', ')};\n` +
        `    background-position: ${[...lista.map((c) => c.pos), 'var(--enredadera-pos, 0 0)'].join(', ')};\n` +
        `    background-size: ${[...lista.map((c) => c.size), 'var(--enredadera-size, auto)'].join(', ')};\n`;

    css += `\n.${clase}::after {\n    border-image-source: url('${URL}${nombre}_base.png');\n}\n`;
    css += `\n.${clase}::before {\n${reglas(capas)}}\n`;
    css += `\n.marco-boton.${clase}::before {\n${reglas(capas.filter((c) => c.alto <= MAX_ALTO_BOTON))}}\n`;

    console.log(`${nombre}: base ${T}x${T}, decoración en ${Object.keys(esquinas).join(', ')}`);
}

writeFileSync('src/styles/marcos-vegetales.css', css);
console.log('Generado src/styles/marcos-vegetales.css');
