// Prepara los sprites de las mascotas y de los marcos animados de los proyectos de la página principal: los
// reduce a 1x (la web los amplía sin suavizar) y deja sin bucle las animaciones que solo deben verse una vez
// (se quedan en el último fotograma).
// Genera <nombre>_1x.<ext>. Para los marcos propios de los proyectos (64x64 a 1x, se ven a 3x), además:
//  - FINALES: el último fotograma de una animación como imagen fija (el marco ya terminado)
//  - FONDOS: <nombre>_fondo.png, la máscara del fondo oscuro de la tarjeta: todo lo que no queda por fuera
//    del marco, ya a 3x para que el borde no salga suavizado
// Uso: npm run marcos
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
    // OuroJam: marco del dragón
    'Dar_vueltas_dragon.gif':      [10, true],
    // Hells Gamble: el demonio persigue a la galleta alrededor de la tarjeta
    'Cookie_Idle.gif':             [10, true],
    'Cookie_Explosion.gif':        [10, false],
    'Personaje_Demon_Run.gif':     [10, true],
    'Personaje_Demon_Sad.gif':     [6, false],
    'Personaje_Demon_Cry.gif':     [10, true],
    'Personaje_Demon_WakeUp.gif':  [10, false],
    // BloodRunner: Omega (ya están a 1x; solo se les quita el bucle)
    'Omega_Escena_Coche_Salir.gif': [1, false],
    'Omega_Acoplar.gif':            [1, false],
    'Omega_Activation.gif':         [1, false],
    'Omega_Transform_base.gif':     [1, false],
    // Neorb: marco y decoraciones que se dibujan al aparecer la tarjeta
    'MarcoNeorb_Anim.gif':             [1, false],
    'MarcoNeorb_Decorations_Anim.gif': [1, false],
};

const FINALES = {
    'MarcoNeorb_Anim.gif':             'MarcoNeorb_Solo.png',
    'MarcoNeorb_Decorations_Anim.gif': 'MarcoNeorb_Decoraciones.png',
};

const FONDOS = ['MarcoBR.png', 'MarcoNeorb.png'];
const ESCALA_FONDO = 3;

for (const [archivo, [escala, bucle]] of Object.entries(SPRITES)) {
    const animado = archivo.endsWith('.gif');
    const { width, pageHeight, height, delay } = await sharp(DIR + archivo, { animated: animado }).metadata();
    const salida = DIR + archivo.replace(/\.(gif|png)$/, '_1x.$1');
    const imagen = sharp(DIR + archivo, { animated: animado })
        .resize(width / escala, (pageHeight ?? height) / escala, { kernel: 'nearest' });  // En animaciones, por fotograma
    // loop: 0 = bucle infinito; 1 = se reproduce una vez. dither, reuse e interPaletteMaxError: colores exactos
    // (cada fotograma con su paleta, ver timelapses.mjs)
    await (animado ? imagen.gif({ loop: bucle ? 0 : 1, delay, dither: 0, reuse: false, interPaletteMaxError: 0 }) : imagen.png()).toFile(salida);
    console.log('Generado', salida);
}

for (const [archivo, salida] of Object.entries(FINALES)) {
    const { pages } = await sharp(DIR + archivo).metadata();
    await sharp(DIR + archivo, { page: pages - 1 }).png().toFile(DIR + salida);
    console.log('Generado', DIR + salida);
}

for (const archivo of FONDOS) {
    const { data, info } = await sharp(DIR + archivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: ancho, height: alto } = info;
    // Lo de fuera: los píxeles transparentes a los que se llega desde el borde de la imagen
    const fuera = new Uint8Array(ancho * alto);
    const pendientes = [];
    const visitar = (x, y) => {
        const i = y * ancho + x;
        if (x < 0 || y < 0 || x >= ancho || y >= alto || fuera[i] || data[i * 4 + 3]) return;
        fuera[i] = 1;
        pendientes.push([x, y]);
    };
    for (let x = 0; x < ancho; x++) { visitar(x, 0); visitar(x, alto - 1); }
    for (let y = 0; y < alto; y++) { visitar(0, y); visitar(ancho - 1, y); }
    while (pendientes.length) {
        const [x, y] = pendientes.pop();
        visitar(x + 1, y); visitar(x - 1, y); visitar(x, y + 1); visitar(x, y - 1);
    }
    const mascara = Buffer.alloc(ancho * alto * 4);
    fuera.forEach((f, i) => { if (!f) mascara.fill(255, i * 4, i * 4 + 4); });
    const salida = DIR + archivo.replace(/.png$/, '_fondo.png');
    await sharp(mascara, { raw: { width: ancho, height: alto, channels: 4 } })
        .resize(ancho * ESCALA_FONDO, alto * ESCALA_FONDO, { kernel: 'nearest' })
        .png().toFile(salida);
    console.log('Generado', salida);
}
