// Hojas de sprites de las tarjetas (canvas[data-hoja], src/utils/hojas.ts): reproducen sus animaciones dibujando
// cada fotograma desde la propia hoja (la misma imagen que abre el visor). Si la hoja tiene varias (una por fila),
// las va pasando: cada una se repite hasta durar al menos DURACION_MINIMA. Como los vídeos, no se descargan ni se
// mueven hasta que están cerca de la pantalla.
import type { Animaciones } from '../utils/hojas';

const DURACION_MINIMA = 2000;

const iniciar = (canvas: HTMLCanvasElement) => {
    const { ancho, alto, fps, animaciones }: Animaciones = JSON.parse(canvas.dataset.hoja!);
    const contexto = canvas.getContext('2d')!;
    const intervalo = 1000 / fps;
    const imagen = new Image();
    let cargada = false;
    let visible = false;
    let pedido = 0;
    let animacion = 0;
    let fotograma = 0;
    let inicioAnimacion = 0;
    let ultimo = 0;

    const dibujar = () => {
        const { ancho: anchoFotograma, fotogramas } = animaciones[animacion];
        const [x, y] = fotogramas[fotograma];
        const centrado = Math.floor((ancho - anchoFotograma) / 2);
        contexto.clearRect(0, 0, ancho, alto);
        contexto.drawImage(imagen, x, y, anchoFotograma, alto, centrado, 0, anchoFotograma, alto);
    };

    const paso = (ahora: number) => {
        pedido = requestAnimationFrame(paso);
        if (ahora - ultimo < intervalo) return;
        // Sin acumular retraso si la pestaña estuvo parada
        ultimo = ahora - ((ahora - ultimo) % intervalo);
        fotograma++;
        if (fotograma >= animaciones[animacion].fotogramas.length) {
            fotograma = 0;
            if (ahora - inicioAnimacion >= DURACION_MINIMA) {
                animacion = (animacion + 1) % animaciones.length;
                inicioAnimacion = ahora;
            }
        }
        dibujar();
    };

    const arrancar = () => {
        if (!cargada || !visible || pedido) return;
        dibujar();
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
            cancelAnimationFrame(pedido);
            pedido = 0;
        }
    }, { rootMargin: '200px' }).observe(canvas);
};

document.querySelectorAll<HTMLCanvasElement>('canvas[data-hoja]').forEach(iniciar);
