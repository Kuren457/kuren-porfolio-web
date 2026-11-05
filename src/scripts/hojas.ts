// Hojas de sprites de las tarjetas (canvas[data-hoja], src/utils/hojas.ts): reproducen sus animaciones dibujando
// cada fotograma desde la propia hoja (la misma imagen que abre el visor). Si la hoja tiene varias (una por fila),
// las va pasando: cada una se repite hasta durar al menos DURACION_MINIMA. Como los vídeos, no se descargan ni se
// mueven hasta que están cerca de la pantalla.
// Debajo, los controles ([data-controles], PixelCard): pausa, fotograma anterior y siguiente (pausan), velocidad,
// papel cebolla (el fotograma anterior en rojo y el siguiente en azul, como en Aseprite) y, si hay varias
// animaciones, cuál ver (al elegirla a mano deja de pasar sola a la siguiente). Los clicks en los controles no
// abren el visor.
import type { Animaciones } from '../utils/hojas';

const DURACION_MINIMA = 2000;
const VELOCIDADES = [0.25, 0.5, 1, 2];
const CEBOLLA = [
    { desfase: -1, color: 'rgb(255, 60, 60)' },  // El anterior
    { desfase: 1, color: 'rgb(60, 160, 255)' },  // El siguiente
];
const OPACIDAD_CEBOLLA = 0.35;

const iniciar = (canvas: HTMLCanvasElement) => {
    const { ancho, alto, fps, animaciones }: Animaciones = JSON.parse(canvas.dataset.hoja!);
    const contexto = canvas.getContext('2d')!;
    const imagen = new Image();
    const controles = canvas.closest('.pixel-card')?.querySelector<HTMLElement>('[data-controles]');
    let cargada = false;
    let visible = false;
    let pedido = 0;
    let animacion = 0;
    let fotograma = 0;
    let inicioAnimacion = 0;
    let ultimo = 0;
    let reproduciendo = true;
    let velocidad = VELOCIDADES.indexOf(1);
    let cebolla = false;
    let fijada = false; // Elegida a mano: no pasa sola a la siguiente

    // Un fotograma de la animación actual (con vuelta al principio o al final)
    const pintar = (destino: CanvasRenderingContext2D, indice: number) => {
        const { ancho: anchoFotograma, fotogramas } = animaciones[animacion];
        const [x, y] = fotogramas[(indice + fotogramas.length) % fotogramas.length];
        destino.drawImage(imagen, x, y, anchoFotograma, alto, Math.floor((ancho - anchoFotograma) / 2), 0, anchoFotograma, alto);
    };

    // Para teñir los fotogramas del papel cebolla sin manchar el fondo transparente
    const tinte = document.createElement('canvas');
    tinte.width = ancho;
    tinte.height = alto;
    const contextoTinte = tinte.getContext('2d')!;

    const dibujar = () => {
        contexto.clearRect(0, 0, ancho, alto);
        if (cebolla && animaciones[animacion].fotogramas.length > 1) {
            for (const { desfase, color } of CEBOLLA) {
                contextoTinte.globalCompositeOperation = 'source-over';
                contextoTinte.clearRect(0, 0, ancho, alto);
                pintar(contextoTinte, fotograma + desfase);
                contextoTinte.globalCompositeOperation = 'source-atop';
                contextoTinte.fillStyle = color;
                contextoTinte.fillRect(0, 0, ancho, alto);
                contexto.globalAlpha = OPACIDAD_CEBOLLA;
                contexto.drawImage(tinte, 0, 0);
            }
            contexto.globalAlpha = 1;
        }
        pintar(contexto, fotograma);
        actualizarControles();
    };

    const paso = (ahora: number) => {
        pedido = requestAnimationFrame(paso);
        const intervalo = 1000 / (fps * VELOCIDADES[velocidad]);
        if (ahora - ultimo < intervalo) return;
        // Sin acumular retraso si la pestaña estuvo parada
        ultimo = ahora - ((ahora - ultimo) % intervalo);
        fotograma++;
        if (fotograma >= animaciones[animacion].fotogramas.length) {
            fotograma = 0;
            if (!fijada && ahora - inicioAnimacion >= DURACION_MINIMA / VELOCIDADES[velocidad]) {
                animacion = (animacion + 1) % animaciones.length;
                inicioAnimacion = ahora;
            }
        }
        dibujar();
    };

    const detener = () => {
        cancelAnimationFrame(pedido);
        pedido = 0;
    };

    const arrancar = () => {
        if (!cargada || !visible) return;
        dibujar();
        if (!reproduciendo || pedido) return;
        ultimo = inicioAnimacion = performance.now();
        pedido = requestAnimationFrame(paso);
    };

    imagen.addEventListener('load', () => {
        cargada = true;
        arrancar();
    });

    new IntersectionObserver(([entrada]) => {
        visible = entrada.isIntersecting;
        if (visible) {
            if (!imagen.getAttribute('src')) imagen.src = canvas.dataset.src!;
            arrancar();
        } else {
            detener();
        }
    }, { rootMargin: '200px' }).observe(canvas);

    // --- Controles ---
    function actualizarControles() {
        if (!controles) return;
        const elemento = (selector: string) => controles.querySelector<HTMLElement>(selector);
        const boton = elemento('[data-accion="pausa"]');
        if (boton) {
            boton.dataset.reproduciendo = String(reproduciendo);
            boton.setAttribute('aria-label', (reproduciendo ? boton.dataset.pausar : boton.dataset.reproducir) ?? '');
            boton.title = boton.getAttribute('aria-label')!;
        }
        const contador = elemento('[data-contador]');
        if (contador) contador.textContent = `${fotograma + 1}/${animaciones[animacion].fotogramas.length}`;
        const cual = elemento('[data-animacion]');
        if (cual) cual.textContent = `${animacion + 1}/${animaciones.length}`;
        const rapidez = elemento('[data-accion="velocidad"]');
        if (rapidez) rapidez.textContent = `${String(VELOCIDADES[velocidad]).replace('.', document.documentElement.lang === 'es' ? ',' : '.')}×`;
        elemento('[data-accion="cebolla"]')?.setAttribute('aria-pressed', String(cebolla));
    }

    const pausar = () => {
        reproduciendo = false;
        detener();
    };

    const acciones: Record<string, () => void> = {
        pausa: () => {
            if (reproduciendo) pausar();
            else {
                reproduciendo = true;
                arrancar();
            }
        },
        anterior: () => {
            pausar();
            const total = animaciones[animacion].fotogramas.length;
            fotograma = (fotograma - 1 + total) % total;
        },
        siguiente: () => {
            pausar();
            fotograma = (fotograma + 1) % animaciones[animacion].fotogramas.length;
        },
        velocidad: () => { velocidad = (velocidad + 1) % VELOCIDADES.length; },
        cebolla: () => { cebolla = !cebolla; },
        'animacion-anterior': () => {
            fijada = true;
            animacion = (animacion - 1 + animaciones.length) % animaciones.length;
            fotograma = 0;
        },
        'animacion-siguiente': () => {
            fijada = true;
            animacion = (animacion + 1) % animaciones.length;
            fotograma = 0;
        },
    };

    controles?.addEventListener('click', (e) => {
        e.stopPropagation(); // Los controles no abren el visor
        const accion = (e.target as Element).closest<HTMLElement>('[data-accion]')?.dataset.accion;
        if (!accion || !acciones[accion]) return;
        acciones[accion]();
        if (cargada) dibujar();
    });
};

document.querySelectorAll<HTMLCanvasElement>('canvas[data-hoja]').forEach(iniciar);
