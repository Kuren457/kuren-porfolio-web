// Genera una versión de color del marco por cada tema, sustituyendo los 5 grises
// del marco original por la rampa del tema (de exterior/claro a interior/oscuro).
// Uso: npm run marcos
import sharp from 'sharp';

const DIR = 'public/Pixel-art/UI Elements/';
const ORIGEN = DIR + 'MarcoUniversal_1x.png';

// Grises del marco original, de fuera hacia dentro
const GRISES = ['#ffffff', '#b4b6b4', '#838583', '#5a5d5a', '#393c39'];

// Retoca aquí los colores y vuelve a ejecutar el script
const TEMAS = {
    amarillo:    ['#fff69c', '#fff273', '#ffc229', '#ffaa20', '#f67d00'],
    naranja:     ['#ffb64a', '#ff8d00', '#f67d00', '#c45200', '#8a3400'],
    rojo:        ['#ff6a6a', '#ff2429', '#d51818', '#ac1418', '#7b0c18'],
    rojoOscuro:  ['#ac1418', '#7b0c18', '#520820', '#390820', '#200810'],
    gris:        GRISES,
    verde:       ['#8ee6a0', '#4cc27a', '#2a9a64', '#186d52', '#0f4a38'],
    azul:        ['#94ffff', '#00ceff', '#0095e0', '#0069ac', '#003c6e'],
};

const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const { data, info } = await sharp(ORIGEN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const grises = GRISES.map(hexARgb);

for (const [nombre, rampa] of Object.entries(TEMAS)) {
    const colores = rampa.map(hexARgb);
    const salida = Buffer.from(data);

    for (let i = 0; i < salida.length; i += 4) {
        if (salida[i + 3] === 0) continue;
        const tono = grises.findIndex(([r, g, b]) => r === data[i] && g === data[i + 1] && b === data[i + 2]);
        if (tono === -1) throw new Error(`Color inesperado en el marco: ${data[i]},${data[i + 1]},${data[i + 2]}`);
        salida.set(colores[tono], i);
    }

    const archivo = `${DIR}MarcoUniversal_1x_${nombre}.png`;
    await sharp(salida, { raw: info }).png().toFile(archivo);
    console.log('Generado', archivo);
}
