// Prepara las animaciones de aparición de los logos (Logo*_Anim.gif, exportadas a 10x desde Aseprite):
// las reduce a 1x y las deja sin bucle, para que se reproduzcan una vez y se queden en el último fotograma.
// Genera Logo*_intro.gif. Uso: npm run marcos
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const DIR = 'public/Pixel-art/UI Elements/';
const ESCALA = 10;

for (const archivo of readdirSync(DIR).filter((f) => /^Logo.*_Anim\.gif$/.test(f))) {
    const { width, pageHeight, delay } = await sharp(DIR + archivo, { animated: true }).metadata();
    const salida = DIR + archivo.replace('_Anim.gif', '_intro.gif');
    await sharp(DIR + archivo, { animated: true })
        .resize(width / ESCALA, pageHeight / ESCALA, { kernel: 'nearest' })
        .gif({ loop: 1, delay })
        .toFile(salida);
    console.log('Generado', salida);
}
