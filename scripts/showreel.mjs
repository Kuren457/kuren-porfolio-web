// Monta el showreel (fuentes/showreel/salida/showreel.mp4: 1920x1080 a 30 fps, sin audio, para ponerle la música
// después) con lo que ya está en la web: clips de gameplay, animaciones y obras de pixel art, un timelapse, los
// showcases de Neorb y los materiales. Cada fragmento sale centrado sobre el fondo oscuro de la web (el pixel art,
// ampliado a escala entera sin suavizar), con un fundido corto desde y hacia negro y su etiqueta abajo a la
// izquierda. Los carteles de entrada y salida se capturan con Chrome de fuentes/showreel/cartel.html.
// Para cambiar el orden, los tiempos o las etiquetas, edita FRAGMENTOS y vuelve a generarlo. Además deja la versión
// para la web (public/showreel/: recomprimida, y el cartel del principio como imagen de portada del vídeo).
// Uso: npm run showreel (necesita ffmpeg; si no está en el PATH: FFMPEG=<ruta> npm run showreel)
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SALIDA = 'fuentes/showreel/salida/';
const ANCHO = 1920;
const ALTO = 1080;
const FONDO = '0x0a0508';
const FUNDIDO = 0.3;            // s
const MAXIMO_PIXEL = [1600, 860]; // Hasta dónde se amplía el pixel art (deja sitio a la etiqueta)
const FUENTE = 'fuentes/cv/Tiny5Duo-Bold.ttf'; // La fuente pixel de la web, en versión fija

const P = 'public/Pixel-art/';
const BR = 'BloodRunner · Lead pixel artist';
const OJ = 'OuroJam · All art · 3-day game jam';
const HG = 'Hells Gamble · All art · 1-week game jam';
const PIXEL = 'Pixel art & animation';
const NEORB = 'Neorb · 3D enemies: modeling, rigging & animation';

// Tipos: cartel (inicio o final), video (desde: segundo de inicio), gif (en bucle), cuadricula (varios GIF en
// bucle, en filas), timelapse (GIF acelerado para que dure lo indicado)
const FRAGMENTOS = [
    { cartel: 'inicio', duracion: 3 },
    { video: P + 'Clips/Clip_2_BloodRunner.mp4', desde: 0.5, duracion: 5, etiqueta: BR },
    { video: P + 'Clips/Clip_5_BloodRunner.mp4', desde: 4.6, duracion: 4.5, etiqueta: 'BloodRunner · Animated cutscenes' },
    { cuadricula: [['Idle', 'Run', 'Jump'], ['Attack2', 'Transform_air']].map((fila) => fila.map((n) => `${P}${n}.gif`)), duracion: 4, etiqueta: 'BloodRunner · Character animation' },
    { video: P + 'Clips/Clip_1_OuroJam.mp4', desde: 11.5, duracion: 5, etiqueta: OJ },
    { video: P + 'Clips/Clip_2_OuroJam.mp4', desde: 1, duracion: 4, etiqueta: OJ },
    { video: P + 'Clips/Clip_4_HellsGamble.mp4', desde: 0.5, duracion: 4.5, etiqueta: HG },
    { video: P + 'Clips/Clip_1_HellsGamble.mp4', desde: 0, duracion: 3.5, etiqueta: HG },
    { gif: P + 'Anim_Dragon.gif', duracion: 3.5, etiqueta: PIXEL },
    { gif: P + 'Psy.gif', duracion: 3, etiqueta: PIXEL },
    { gif: P + 'Strange.gif', duracion: 2.5, etiqueta: PIXEL },
    { gif: P + 'HKDanceWBackGround.gif', duracion: 3, etiqueta: PIXEL },
    { timelapse: P + 'Timelapses/TimelapsePsylocke_1x.gif', duracion: 4, etiqueta: 'Timelapse · Psylocke' },
    { video: P + 'Showcase/Neorb_Frogger_Showcase.mp4', desde: 0, duracion: 4, etiqueta: NEORB },
    { video: P + 'Showcase/Neorb_Horse_Showcase.mp4', desde: 0, duracion: 4, etiqueta: NEORB },
    { video: P + 'Showcase/Neorb_Inception_Showcase.mp4', desde: 0, duracion: 3.5, etiqueta: NEORB },
    { video: 'public/3D/Materials/Neorb/03_Secuencias/Frog_3-4_Cortinilla_AntesDespues.mp4', desde: 0, duracion: 6.5, etiqueta: 'Neorb · Post-process material in Unreal Engine' },
    { video: 'public/3D/Dash.mp4', desde: 0, duracion: 4, etiqueta: 'Neorb · Gameplay' },
    { video: 'public/3D/Materials/Arcane/Arcane_Goliath_Turntable.mp4', desde: 0, duracion: 4, etiqueta: 'Arcane-style material · Blender' },
    { video: 'public/3D/ComicMat.webm', desde: 0, duracion: 3.5, etiqueta: 'Comic-style material · Blender' },
    { video: 'public/3D/FrogCrystal.webm', desde: 0, duracion: 3.5, etiqueta: 'Crystal material · Blender' },
    { cartel: 'final', duracion: 4 },
];

const ffmpeg = (args) => {
    const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg falló:\n${r.stderr || r.error}`);
};
const medidas = async (gif) => {
    const m = await sharp(gif, { animated: true }).metadata();
    return { ancho: m.width, alto: m.pageHeight ?? m.height, duracion: (m.delay ?? []).reduce((a, b) => a + b, 0) / 1000 };
};
// La mayor escala entera a la que cabe
const escalaPixel = (ancho, alto) => Math.max(1, Math.floor(Math.min(MAXIMO_PIXEL[0] / ancho, MAXIMO_PIXEL[1] / alto)));

// Etiqueta y fundidos, comunes a todos los fragmentos
const acabado = (fragmento, i) => {
    const filtros = [`fade=t=in:st=0:d=${FUNDIDO}`, `fade=t=out:st=${fragmento.duracion - FUNDIDO}:d=${FUNDIDO}`];
    if (fragmento.etiqueta) {
        const texto = `${SALIDA}etiqueta_${i}.txt`;
        writeFileSync(texto, fragmento.etiqueta);
        filtros.unshift(`drawtext=fontfile=${FUENTE}:textfile=${texto}:fontsize=38:fontcolor=white:box=1:boxcolor=${FONDO}@0.85:boxborderw=18:x=64:y=h-th-72`);
    }
    return filtros.join(',');
};
const codificar = ['-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-an'];
const lienzo = (duracion) => ['-f', 'lavfi', '-i', `color=c=${FONDO}:s=${ANCHO}x${ALTO}:r=30:d=${duracion}`];

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

// Los carteles, capturados con Chrome
for (const cartel of ['inicio', 'final']) {
    const url = `${pathToFileURL(resolve('fuentes/showreel/cartel.html')).href}?${cartel}`;
    const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=3000',
        `--window-size=${ANCHO},${ALTO}`, `--screenshot=${resolve(SALIDA, `cartel_${cartel}.png`)}`, url], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`Chrome falló con el cartel ${cartel}`);
}

const trozos = [];
for (const [i, f] of FRAGMENTOS.entries()) {
    const trozo = `${SALIDA}${String(i).padStart(2, '0')}.mp4`;
    const fin = acabado(f, i);
    if (f.cartel) {
        ffmpeg(['-loop', '1', '-t', String(f.duracion), '-i', `${SALIDA}cartel_${f.cartel}.png`, '-vf', `${fin}`, ...codificar, '-t', String(f.duracion), trozo]);
    } else if (f.video) {
        ffmpeg(['-ss', String(f.desde), '-t', String(f.duracion), '-i', f.video, ...lienzo(f.duracion), '-filter_complex',
            `[0:v]scale=${ANCHO}:${ALTO}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1,fps=30[v];[1:v][v]overlay=(W-w)/2:(H-h)/2:shortest=1,${fin}`,
            ...codificar, '-t', String(f.duracion), trozo]);
    } else if (f.gif || f.timelapse) {
        const archivo = f.gif ?? f.timelapse;
        const { ancho, alto, duracion } = await medidas(archivo);
        const k = escalaPixel(ancho, alto);
        // El GIF en bucle; el timelapse, una vez y acelerado para que dure f.duracion
        const entrada = f.gif ? ['-ignore_loop', '0', '-t', String(f.duracion), '-i', archivo] : ['-i', archivo];
        const tiempo = f.timelapse ? `setpts=PTS/${(duracion / f.duracion).toFixed(4)},` : '';
        ffmpeg([...entrada, ...lienzo(f.duracion), '-filter_complex',
            `[0:v]${tiempo}scale=${ancho * k}:${alto * k}:flags=neighbor,fps=30[g];[1:v][g]overlay=(W-w)/2:(H-h)/2:eof_action=repeat,${fin}`,
            ...codificar, '-t', String(f.duracion), trozo]);
    } else if (f.cuadricula) {
        // Todos a la misma escala (la mayor a la que caben las filas), cada fila centrada y el conjunto también
        const filas = await Promise.all(f.cuadricula.map((fila) => Promise.all(fila.map(medidas))));
        const separacion = 40;
        const anchoFila = (fila, k) => fila.reduce((s, d) => s + d.ancho * k, 0) + separacion * (fila.length - 1);
        const altoFila = (fila, k) => Math.max(...fila.map((d) => d.alto)) * k;
        const altoTotal = (k) => filas.reduce((s, fila) => s + altoFila(fila, k), 0) + separacion * (filas.length - 1);
        let k = MAXIMO_PIXEL[1];
        while (k > 1 && (altoTotal(k) > MAXIMO_PIXEL[1] || filas.some((fila) => anchoFila(fila, k) > MAXIMO_PIXEL[0]))) k--;
        const gifs = filas.flat();
        const entradas = f.cuadricula.flat().flatMap((g) => ['-ignore_loop', '0', '-t', String(f.duracion), '-i', g]);
        const escalas = gifs.map((d, j) => `[${j}:v]scale=${d.ancho * k}:${d.alto * k}:flags=neighbor,fps=30[g${j}]`);
        // Dónde va cada uno
        const posiciones = [];
        let y = (ALTO - altoTotal(k)) / 2;
        for (const fila of filas) {
            let x = (ANCHO - anchoFila(fila, k)) / 2;
            for (const d of fila) {
                posiciones.push([Math.round(x), Math.round(y + (altoFila(fila, k) - d.alto * k) / 2)]);
                x += d.ancho * k + separacion;
            }
            y += altoFila(fila, k) + separacion;
        }
        let anterior = `[${gifs.length}:v]`;
        const capas = posiciones.map(([x, y], j) => {
            const salida = j === gifs.length - 1 ? '' : `[c${j}]`;
            const capa = `${anterior}[g${j}]overlay=${x}:${y}:eof_action=repeat${salida}`;
            anterior = `[c${j}]`;
            return capa;
        });
        ffmpeg([...entradas, ...lienzo(f.duracion), '-filter_complex', [...escalas, ...capas].join(';') + `,${fin}`, ...codificar, '-t', String(f.duracion), trozo]);
    }
    trozos.push(trozo);
    console.log(`${String(i + 1).padStart(2)}/${FRAGMENTOS.length} ${(f.etiqueta ?? `cartel ${f.cartel}`).slice(0, 60)}`);
}

// Todos seguidos (mismo formato: se copian sin volver a codificar)
writeFileSync(`${SALIDA}lista.txt`, trozos.map((t) => `file '${resolve(t).replaceAll('\\', '/')}'`).join('\n'));
ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${SALIDA}lista.txt`, '-c', 'copy', '-movflags', '+faststart', `${SALIDA}showreel.mp4`]);
const total = FRAGMENTOS.reduce((s, f) => s + f.duracion, 0);
console.log(`Generado ${SALIDA}showreel.mp4 (${total} s)`);

// La versión para la web
mkdirSync('public/showreel', { recursive: true });
ffmpeg(['-i', `${SALIDA}showreel.mp4`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', 'public/showreel/showreel.mp4']);
await sharp(`${SALIDA}cartel_inicio.png`).resize(1280, 720).webp({ quality: 85 }).toFile('public/showreel/showreel.webp');
console.log('Generada la versión para la web en public/showreel/');
