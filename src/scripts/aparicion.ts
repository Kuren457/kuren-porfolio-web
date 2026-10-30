// Aparición de las tarjetas: cuando un elemento [data-aparicion] entra en pantalla, aparece con un "pop"
// (clase .aparecido, ver global.css) y en ese momento arrancan, una sola vez, las animaciones de su marco
// (data-intro-marco, sustituye al --marco fijo) y de su logo (img[data-intro], sustituye al src fijo).
//
// Cada tarjeta usa su propia copia del GIF (ver gifs.ts): sin esto, las tarjetas que aparecen más tarde
// verían el GIF ya terminado.
//
// El modo lo marca una clase en <html> (la pone el layout y la cambia BotonAnimaciones):
//  - .intro-activa: todo lo anterior
//  - .intro-suave: la tarjeta y el marco se ven fijos desde el principio y solo se anima el logo
import { copiaPropia, descargar } from './gifs';

const RETARDO_ENTRE_TARJETAS = 80; // ms entre tarjetas que entran en pantalla a la vez

const copias = new WeakMap<HTMLElement, string[]>(); // URLs blob: de cada tarjeta, para liberarlas al repetir
let observador: IntersectionObserver | null = null;
let ronda = 0; // Cambia en cada reinicio, para descartar apariciones que estaban a medias

const leerModo = () => {
    const clases = document.documentElement.classList;
    return clases.contains('intro-activa') ? 'completo' : clases.contains('intro-suave') ? 'suave' : null;
};

// Deja la tarjeta como estaba antes de aparecer (marco y logo fijos), para poder repetir la aparición
const restaurar = (tarjeta: HTMLElement) => {
    const logo = tarjeta.querySelector<HTMLImageElement>('img[data-intro]');
    if (logo) {
        logo.dataset.fijo ??= logo.getAttribute('src')!;
        logo.src = logo.dataset.fijo;
        logo.classList.remove('intro-lista');
    }
    tarjeta.style.removeProperty('--marco');
    tarjeta.classList.remove('aparecido');
    copias.get(tarjeta)?.forEach((url) => URL.revokeObjectURL(url));
    copias.delete(tarjeta);
};

const aparecer = async (tarjeta: HTMLElement, modo: 'completo' | 'suave', rondaActual: number) => {
    const suave = modo === 'suave';
    const logo = tarjeta.querySelector<HTMLImageElement>('img[data-intro]');
    const [marco, logoIntro] = await Promise.all([
        suave ? null : copiaPropia(tarjeta.dataset.introMarco),
        copiaPropia(logo?.dataset.intro),
    ]);
    if (rondaActual !== ronda) return; // Se cambió de modo mientras tanto
    copias.set(tarjeta, [marco, logoIntro].filter((url): url is string => !!url));

    // Esperar a que el GIF del logo esté listo para que arranque a la vez que el pop
    if (logo && logoIntro) {
        logo.src = logoIntro;
        await logo.decode().catch(() => {});
        if (rondaActual !== ronda) return;
    }
    logo?.classList.add('intro-lista'); // En modo suave, el logo estaba oculto hasta ahora (ver global.css)
    if (suave) return;

    if (marco) tarjeta.style.setProperty('--marco', `url('${marco}')`);
    tarjeta.classList.add('aparecido');
};

// Prepara todas las tarjetas según el modo actual. Se puede volver a llamar (al cambiar de modo):
// las tarjetas vuelven a su estado inicial y las que están en pantalla aparecen de nuevo
export const iniciarAparicion = () => {
    observador?.disconnect();
    const rondaActual = ++ronda;
    const modo = leerModo();
    const tarjetas = document.querySelectorAll<HTMLElement>('[data-aparicion]');
    tarjetas.forEach(restaurar);
    if (!modo) return;

    // Precargar los GIF (son de 1-3 KB) para que estén listos cuando cada tarjeta entre en pantalla
    tarjetas.forEach((tarjeta) => {
        if (modo === 'completo' && tarjeta.dataset.introMarco) descargar(tarjeta.dataset.introMarco);
        const intro = tarjeta.querySelector<HTMLImageElement>('img[data-intro]')?.dataset.intro;
        if (intro) descargar(intro);
    });

    observador = new IntersectionObserver((entradas, obs) => {
        entradas
            .filter((entrada) => entrada.isIntersecting)
            .forEach((entrada, i) => {
                obs.unobserve(entrada.target);
                setTimeout(() => {
                    if (rondaActual === ronda) aparecer(entrada.target as HTMLElement, modo, rondaActual);
                }, i * RETARDO_ENTRE_TARJETAS);
            });
    }, { rootMargin: '0px 0px -10% 0px' });

    tarjetas.forEach((tarjeta) => observador!.observe(tarjeta));
};

iniciarAparicion();
