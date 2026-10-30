// Mascotas de la página principal (Mascotas.astro): las coloca al azar sobre las tarjetas y les da vida.
//
// Colocación: cada mascota va a una tarjeta [data-sitio-mascota] distinta, arriba (de pie sobre el borde
// superior del marco) o abajo (por dentro, de pie sobre el borde inferior), en un punto al azar a lo ancho.
// No va dentro de la tarjeta sino en su contenedor, posicionada encima: así no queda dentro de un enlace (las
// tarjetas de proyectos lo son) ni se mueve con el pop de la tarjeta. Se recoloca si cambia el tamaño.
// Si la tarjeta aún no ha aparecido (aparicion.ts), la mascota espera a que lo haga.
//
// Comportamientos:
//  - data-mascota="hk": cada click alterna entre su sprite y data-baile
//  - data-mascota="mimos": cada click reproduce una vez la mano; con data-explota="N", al click N reproduce
//    data-explosion, desaparece 5 s y vuelve
//    Sonidos opcionales: data-sonido (cada click), data-sonido-mano (con la mano), data-sonido-explosion
import { copiaPropia, duracionGif } from './gifs';

const PX = 2;                // Píxeles de pantalla por píxel del sprite (como los marcos)
const BORDE = 3;             // Grosor en píxeles del borde de los marcos vegetales
const MARGEN = 16;           // Distancia mínima a las esquinas del marco, en píxeles del sprite
const TIEMPO_FUERA = 5000;   // ms que desaparece el gato tras explotar

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cargarSonido = (url?: string) => (url ? new Audio(url) : null);

// Reproduce desde el principio (si ya estaba sonando, vuelve a empezar)
const sonar = (sonido: HTMLAudioElement | null) => {
    if (!sonido) return;
    sonido.currentTime = 0;
    sonido.play().catch(() => {});
};

// --- COLOCACIÓN ---

const colocar = (mascota: HTMLElement, tarjeta: HTMLElement, arriba: boolean, posicion: number) => {
    const estilo = getComputedStyle(mascota);
    const ancho = parseFloat(estilo.getPropertyValue('--ancho')) * PX;
    const alto = parseFloat(estilo.getPropertyValue('--alto')) * PX;
    const pies = parseFloat(estilo.getPropertyValue('--pies')) * PX;

    // Línea donde se apoyan los pies: el borde superior (1 px de sprite hundido, para que no flote)
    // o la cara interior del borde inferior
    const suelo = arriba
        ? tarjeta.offsetTop + PX
        : tarjeta.offsetTop + tarjeta.offsetHeight - BORDE * PX;
    const hueco = tarjeta.offsetWidth - ancho - 2 * MARGEN * PX;

    mascota.style.left = `${tarjeta.offsetLeft + (hueco > 0 ? MARGEN * PX + posicion * hueco : (tarjeta.offsetWidth - ancho) / 2)}px`;
    mascota.style.top = `${suelo - (alto - pies)}px`;
};

const mostrarCuandoAparezca = (mascota: HTMLElement, tarjeta: HTMLElement) => {
    const mostrar = () => mascota.classList.add('mascota--visible');
    const esperaPop = document.documentElement.classList.contains('intro-activa')
        && tarjeta.hasAttribute('data-aparicion') && !tarjeta.classList.contains('aparecido');
    if (!esperaPop) return mostrar();

    const observador = new MutationObserver(() => {
        if (!tarjeta.classList.contains('aparecido')) return;
        observador.disconnect();
        setTimeout(mostrar, 300); // Cuando la tarjeta ya casi ha terminado su pop
    });
    observador.observe(tarjeta, { attributes: true, attributeFilter: ['class'] });
};

const repartir = () => {
    const mascotas = [...document.querySelectorAll<HTMLElement>('#mascotas .mascota')];
    const sitios = [...document.querySelectorAll<HTMLElement>('[data-sitio-mascota]')]
        .sort(() => Math.random() - 0.5);

    mascotas.forEach((mascota, i) => {
        const tarjeta = sitios[i];
        if (!tarjeta?.offsetParent) return mascota.remove(); // Más mascotas que tarjetas
        const arriba = Math.random() < 0.5;
        const posicion = Math.random();
        tarjeta.offsetParent.append(mascota);
        mascota.classList.add(arriba ? 'mascota--arriba' : 'mascota--abajo');

        const recolocar = () => colocar(mascota, tarjeta, arriba, posicion);
        recolocar();
        new ResizeObserver(recolocar).observe(tarjeta);
        window.addEventListener('resize', recolocar);
        mostrarCuandoAparezca(mascota, tarjeta);
    });
};

// --- COMPORTAMIENTOS ---

// Pone en una imagen una copia propia del GIF (empieza desde el primer fotograma) y libera la anterior
const ponerGif = async (imagen: HTMLImageElement, url: string) => {
    const copia = await copiaPropia(url);
    if (imagen.src.startsWith('blob:')) URL.revokeObjectURL(imagen.src);
    imagen.src = copia ?? url;
};

const hk = (mascota: HTMLElement) => {
    const sprite = mascota.querySelector<HTMLImageElement>('.mascota__sprite')!;
    const idle = sprite.getAttribute('src')!;
    let bailando = false;

    mascota.addEventListener('click', () => {
        bailando = !bailando;
        ponerGif(sprite, bailando ? sprite.dataset.baile! : idle);
    });
};

const mimos = (mascota: HTMLElement) => {
    const sprite = mascota.querySelector<HTMLImageElement>('.mascota__sprite')!;
    const mano = mascota.querySelector<HTMLImageElement>('.mascota__mano')!;
    const reposo = sprite.getAttribute('src')!;
    const sonido = cargarSonido(mascota.dataset.sonido);
    const sonidoMano = cargarSonido(mascota.dataset.sonidoMano);
    const sonidoExplosion = cargarSonido(mascota.dataset.sonidoExplosion);
    const explotaA = Number(mascota.dataset.explota) || 0;
    let clicks = 0;
    let ocupada = false;
    let ocultarMano = 0;

    const explotar = async () => {
        ocupada = true;
        mano.hidden = true;
        await ponerGif(sprite, sprite.dataset.explosion!);
        sonar(sonidoExplosion);
        await esperar(await duracionGif(sprite.dataset.explosion!));
        mascota.classList.remove('mascota--visible');
        await esperar(TIEMPO_FUERA);
        sprite.src = reposo;
        clicks = 0;
        ocupada = false;
        mascota.classList.add('mascota--visible');
    };

    mascota.addEventListener('click', async () => {
        if (ocupada) return;
        clicks++;
        if (explotaA && clicks >= explotaA) return explotar();

        sonar(sonido);
        // Un ciclo de la mano por encima del sprite; si se vuelve a hacer click, empieza de nuevo
        await ponerGif(mano, mano.dataset.mano!);
        mano.hidden = false;
        sonar(sonidoMano);
        clearTimeout(ocultarMano);
        ocultarMano = window.setTimeout(() => (mano.hidden = true), await duracionGif(mano.dataset.mano!));
    });
};

document.querySelectorAll<HTMLElement>('#mascotas .mascota').forEach((mascota) => {
    if (mascota.dataset.mascota === 'hk') hk(mascota);
    if (mascota.dataset.mascota === 'mimos') mimos(mascota);
});
repartir();
