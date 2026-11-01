// Aparición de las tarjetas: cuando un elemento [data-aparicion] entra en pantalla, aparece con un "pop"
// (clase .aparecido, ver global.css) y en ese momento arrancan, una sola vez y todas a la vez, las animaciones
// de su marco (data-intro-marco, sustituye al --marco fijo) y de sus imágenes: logos y decoraciones
// (img[data-intro]) y marcos que son una imagen (img[data-intro-completo]); cada una sustituye a su src fijo.
//
// Cada tarjeta usa su propia copia del GIF (ver gifs.ts): sin esto, las tarjetas que aparecen más tarde
// verían el GIF ya terminado.
//
// El modo lo marca una clase en <html> (la pone el layout y la cambia BotonAnimaciones):
//  - .intro-activa: todo lo anterior
//  - .intro-suave: la tarjeta y el marco se ven fijos desde el principio y solo se animan los img[data-intro]
import { copiaPropia, descargar } from './gifs';

const RETARDO_ENTRE_TARJETAS = 80; // ms entre tarjetas que entran en pantalla a la vez

const copias = new WeakMap<HTMLElement, string[]>(); // URLs blob: de cada tarjeta, para liberarlas al repetir
let observador: IntersectionObserver | null = null;
let ronda = 0; // Cambia en cada reinicio, para descartar apariciones que estaban a medias

const leerModo = () => {
    const clases = document.documentElement.classList;
    return clases.contains('intro-activa') ? 'completo' : clases.contains('intro-suave') ? 'suave' : null;
};

// Las imágenes de la tarjeta que se animan en cada modo, y la animación de cada una
const imagenes = (tarjeta: HTMLElement, modo: 'completo' | 'suave' | 'todas') => [...tarjeta.querySelectorAll<HTMLImageElement>(
    modo === 'suave' ? 'img[data-intro]' : 'img[data-intro], img[data-intro-completo]')];
const introDe = (imagen: HTMLImageElement) => imagen.dataset.intro ?? imagen.dataset.introCompleto;

// Deja la tarjeta como estaba antes de aparecer (marco e imágenes fijos), para poder repetir la aparición
const restaurar = (tarjeta: HTMLElement) => {
    imagenes(tarjeta, 'todas').forEach((imagen) => {
        imagen.dataset.fijo ??= imagen.getAttribute('src')!;
        imagen.src = imagen.dataset.fijo;
        imagen.classList.remove('intro-lista');
    });
    tarjeta.style.removeProperty('--marco');
    tarjeta.classList.remove('aparecido');
    copias.get(tarjeta)?.forEach((url) => URL.revokeObjectURL(url));
    copias.delete(tarjeta);
};

const aparecer = async (tarjeta: HTMLElement, modo: 'completo' | 'suave', rondaActual: number) => {
    const suave = modo === 'suave';
    const animadas = imagenes(tarjeta, modo);
    const [marco, ...intros] = await Promise.all([
        suave ? null : copiaPropia(tarjeta.dataset.introMarco),
        ...animadas.map((imagen) => copiaPropia(introDe(imagen))),
    ]);
    if (rondaActual !== ronda) return; // Se cambió de modo mientras tanto
    copias.set(tarjeta, [marco, ...intros].filter((url): url is string => !!url));

    // Esperar a que todos los GIF estén listos para que arranquen a la vez, y a la vez que el pop
    animadas.forEach((imagen, i) => {
        if (intros[i]) imagen.src = intros[i];
    });
    await Promise.all(animadas.map((imagen) => imagen.decode().catch(() => {})));
    if (rondaActual !== ronda) return;
    // En modo suave, los img[data-intro] estaban ocultos hasta ahora (ver global.css)
    animadas.forEach((imagen) => imagen.classList.add('intro-lista'));
    if (suave) return;

    if (marco) tarjeta.style.setProperty('--marco', `url('${marco}')`);
    tarjeta.classList.add('aparecido');
};

// Repite la aparición de algo que ya está en pantalla y no lleva data-aparicion (la ficha del visor, cada
// vez que se abre o se cambia de obra). Sin modo de animaciones, solo lo deja en su estado fijo
export const aparecerDeNuevo = (tarjeta: HTMLElement) => {
    restaurar(tarjeta);
    void tarjeta.offsetWidth; // Para que el pop vuelva a empezar aunque la clase se quite y se ponga seguidas
    const modo = leerModo();
    if (modo) aparecer(tarjeta, modo, ronda);
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
        imagenes(tarjeta, modo).forEach((imagen) => descargar(introDe(imagen)!));
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
