// Mascotas de la página principal (Mascotas.astro): las coloca al azar sobre las tarjetas y les da vida.
//
// Colocación: cada mascota se pone de pie sobre el borde superior de una tarjeta [data-sitio-mascota] o, por
// dentro, sobre su borde inferior, pero solo en un hueco libre: sin tapar nada de lo que hay en OBSTACULOS
// (texto, imágenes, carruseles, botones) ni a otra mascota. Se prueban todas las posiciones posibles y se elige
// una al azar entre las libres, mejor en una tarjeta que no tenga ya otra mascota; si no queda ningún hueco
// (p. ej. en pantallas estrechas), esa mascota no sale. Al cambiar el tamaño de la página, cada una se queda
// donde estaba si su sitio sigue libre, y si no busca otro.
// Las mascotas van en el <body> y no dentro de la tarjeta: así no quedan dentro de un enlace (las tarjetas de
// proyectos lo son) ni se mueven con el pop de la tarjeta. Si la tarjeta aún no ha aparecido (aparicion.ts),
// la mascota espera a que lo haga.
//
// Comportamientos:
//  - todas: al pasar el ratón sale el bocadillo con el corazón (.bocadillo); al hacer click se esconde hasta
//    que el ratón vuelva a entrar. En pantallas sin ratón está siempre a la vista (parpadeando, ver global.css)
//  - data-mascota="hk": cada click alterna entre su sprite y data-baile
//  - data-mascota="mimos": cada click reproduce una vez la mano; con data-explota="N", al click N reproduce
//    data-explosion, desaparece 5 s y vuelve
//    Sonidos opcionales: data-sonido (cada click), data-sonido-mano (con la mano), data-sonido-explosion
import { duracionGif, esperar, ponerGif } from './gifs';
import { cargarSonido, sonar } from './sonidos';

const PX = 2;                // Píxeles de pantalla por píxel de los marcos vegetales
const BORDE = 3;             // Grosor en píxeles del borde de los marcos vegetales
const MARGEN = 16;           // Distancia mínima a las esquinas del marco, en píxeles del marco
const PASO = 8;              // px entre las posiciones que se prueban a lo largo de cada borde
const AIRE = 6;              // px de separación mínima con cada obstáculo
const TIEMPO_FUERA = 5000;   // ms que desaparece el gato tras explotar

// Lo que una mascota no puede tapar (también Omega y su brazo, ver omega.ts)
const OBSTACULOS = 'h1, h2, h3, p, img, video, .carrusel__ventana, .marco-boton, span.inline-block, .persecucion, .omega, .omega-brazo';


// --- COLOCACIÓN ---

export interface Caja { x: number; y: number; ancho: number; alto: number }
interface Sitio { tarjeta: HTMLElement; arriba: boolean; x: number } // x: desde el borde izquierdo de la tarjeta

// Posición en la página sin contar transformaciones (el pop de las tarjetas, el movimiento de los carruseles)
export const enPagina = (el: HTMLElement): Caja => {
    let x = 0, y = 0;
    for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) {
        x += e.offsetLeft;
        y += e.offsetTop;
    }
    return { x, y, ancho: el.offsetWidth, alto: el.offsetHeight };
};

export const chocan = (a: Caja, b: Caja) =>
    a.x < b.x + b.ancho + AIRE && b.x < a.x + a.ancho + AIRE && a.y < b.y + b.alto + AIRE && b.y < a.y + a.alto + AIRE;

// Medidas del sprite en pantalla: --px es 2 px por píxel, o 1 en móvil (ver .mascota en global.css)
const medidas = (mascota: HTMLElement) => {
    const estilo = getComputedStyle(mascota);
    const px = parseFloat(estilo.getPropertyValue('--px'));
    const valor = (nombre: string) => parseFloat(estilo.getPropertyValue(nombre)) * px;
    return { ancho: valor('--ancho'), alto: valor('--alto'), pies: valor('--pies') };
};

// Caja que ocupa la mascota en un sitio (el dibujo, sin las filas vacías bajo los pies) y su posición
const cajaEn = (mascota: HTMLElement, sitio: Sitio) => {
    const { ancho, alto, pies } = medidas(mascota);
    const t = enPagina(sitio.tarjeta);
    // Línea donde se apoyan los pies: el borde superior (1 px de sprite hundido, para que no flote)
    // o la cara interior del borde inferior
    const suelo = sitio.arriba ? t.y + PX : t.y + t.alto - BORDE * PX;
    return { x: t.x + sitio.x, y: suelo - (alto - pies), ancho, alto: alto - pies };
};

const sitiosPosibles = (mascota: HTMLElement, tarjetas: HTMLElement[]) => {
    const { ancho } = medidas(mascota);
    return tarjetas.flatMap((tarjeta) => {
        const sitios: Sitio[] = [];
        for (let x = MARGEN * PX; x + ancho <= tarjeta.offsetWidth - MARGEN * PX; x += PASO) {
            sitios.push({ tarjeta, arriba: true, x }, { tarjeta, arriba: false, x });
        }
        return sitios;
    });
};

const obstaculos = () => [...document.querySelectorAll<HTMLElement>(OBSTACULOS)]
    // Fuera: lo que no está en la página (oculto o fijo en pantalla), las propias mascotas, los marcos animados
    // (se puede estar de pie encima) y lo que va dentro de un carrusel o de una persecución (ya cuentan enteros)
    .filter((el) => el.offsetParent && !el.closest('header, .mascota, .omega, .omega-brazo, #boton-animaciones, #lightbox') && !el.matches('.proyecto__marco')
        && (el.matches('.carrusel__ventana') || !el.closest('.carrusel__ventana'))
        && (el.matches('.persecucion') || !el.closest('.persecucion')))
    .map(enPagina);

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

const mascotas = [...document.querySelectorAll<HTMLElement>('#mascotas .mascota')];
const sitioActual = new Map<HTMLElement, Sitio>();

const repartir = () => {
    const tarjetas = [...document.querySelectorAll<HTMLElement>('[data-sitio-mascota]')].filter((t) => t.offsetParent);
    const ocupado = obstaculos();
    const tarjetasConMascota = new Set<HTMLElement>();

    // En orden aleatorio, para que ninguna mascota tenga siempre preferencia
    for (const mascota of [...mascotas].sort(() => Math.random() - 0.5)) {
        const libre = (sitio: Sitio) => !ocupado.some((o) => chocan(cajaEn(mascota, sitio), o));
        const anterior = sitioActual.get(mascota);

        let sitio = anterior && anterior.tarjeta.offsetParent && libre(anterior) ? anterior : undefined;
        if (!sitio) {
            const libres = sitiosPosibles(mascota, tarjetas).filter(libre);
            const enTarjetaVacia = libres.filter((s) => !tarjetasConMascota.has(s.tarjeta));
            const opciones = enTarjetaVacia.length ? enTarjetaVacia : libres;
            sitio = opciones[Math.floor(Math.random() * opciones.length)];
        }

        if (!sitio) {
            // No cabe sin tapar nada: no sale (y si ya estaba, se esconde)
            sitioActual.delete(mascota);
            mascota.hidden = true;
            continue;
        }

        const caja = cajaEn(mascota, sitio);
        mascota.style.left = `${caja.x}px`;
        mascota.style.top = `${caja.y}px`;
        mascota.hidden = false;
        ocupado.push(caja);
        tarjetasConMascota.add(sitio.tarjeta);
        sitioActual.set(mascota, sitio);
        if (!anterior) mostrarCuandoAparezca(mascota, sitio.tarjeta);
    }
};

// Un sitio libre al azar, como los de las mascotas, para otro elemento con sus mismas medidas (--ancho, --alto,
// --pies, --px): sin tapar nada ni a las mascotas y fuera de la tarjeta evitar. Devuelve su caja en la página
export const sitioLibre = (elemento: HTMLElement, evitar?: HTMLElement): Caja | null => {
    const tarjetas = [...document.querySelectorAll<HTMLElement>('[data-sitio-mascota]')]
        .filter((t) => t.offsetParent && t !== evitar);
    const ocupado = [...obstaculos(), ...[...sitioActual].map(([mascota, sitio]) => cajaEn(mascota, sitio))];
    const libres = sitiosPosibles(elemento, tarjetas).filter((s) => !ocupado.some((o) => chocan(cajaEn(elemento, s), o)));
    const sitio = libres[Math.floor(Math.random() * libres.length)];
    return sitio ? cajaEn(elemento, sitio) : null;
};

// Las mascotas pasan al <body> y se colocan cuando la fuente ya está cargada (cambia el tamaño de los textos);
// después se recolocan cada vez que la página cambia de tamaño
document.body.append(...mascotas);
let pendiente = 0;
const recolocar = () => {
    clearTimeout(pendiente);
    pendiente = window.setTimeout(repartir, 150);
};
document.fonts.ready.then(() => {
    repartir();
    new ResizeObserver(recolocar).observe(document.body);
});

// --- COMPORTAMIENTOS ---

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

const bocadillo = (mascota: HTMLElement) => {
    const globo = mascota.querySelector<HTMLElement>('.bocadillo');
    if (!globo) return;
    if (matchMedia('(hover: none)').matches) {
        globo.hidden = false;
        return;
    }
    mascota.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') globo.hidden = false;
    });
    mascota.addEventListener('pointerleave', () => (globo.hidden = true));
    mascota.addEventListener('click', () => (globo.hidden = true));
};

mascotas.forEach((mascota) => {
    bocadillo(mascota);
    if (mascota.dataset.mascota === 'hk') hk(mascota);
    if (mascota.dataset.mascota === 'mimos') mimos(mascota);
});
