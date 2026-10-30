// Prepara los sprites de las mascotas de la página principal: los reduce a 1x (la web los muestra a 2 px por
// píxel) y deja sin bucle las animaciones que solo deben verse una vez (se quedan en el último fotograma).
// Genera <nombre>_1x.<ext>. Uso: npm run marcos
import sharp from 'sharp';

const DIR = 'public/Pixel-art/UI Elements/';

// archivo: [escala de exportación, se repite en bucle]
const SPRITES = {
    'HKDanceIdle.gif':             [5, true],
    'HKDanceBreakdance.gif':       [5, true],
    'KittyExplosionIdle.png':      [10],
    'KittyExplosionExplosion.gif': [10, false],
    'HandAnim.gif':                [10, false],
    'Juno.png':                    [10],
};

for (const [archivo, [escala, bucle]] of Object.entries(SPRITES)) {
    const animado = archivo.endsWith('.gif');
    const { width, pageHeight, height, delay } = await sharp(DIR + archivo, { animated: animado }).metadata();
    const salida = DIR + archivo.replace(/\.(gif|png)$/, '_1x.$1');
    const imagen = sharp(DIR + archivo, { animated: animado })
        .resize(width / escala, (pageHeight ?? height) / escala, { kernel: 'nearest' });  // En animaciones, por fotograma
    // loop: 0 = bucle infinito; 1 = se reproduce una vez
    await (animado ? imagen.gif({ loop: bucle ? 0 : 1, delay }) : imagen.png()).toFile(salida);
    console.log('Generado', salida);
}
