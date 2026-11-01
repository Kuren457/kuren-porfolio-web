// Timelapses (PixelCard con timelapse). En la sección de timelapses, mientras la tarjeta está en pantalla:
//  1. Enseña la obra terminada MOSTRAR_FINAL ms.
//  2. Se desvanece al timelapse, que empieza desde su primer fotograma (una barra marca por dónde va).
//  3. Al terminar, se desvanece otra vez a la obra, que se queda ESPERA_ENTRE ms antes de repetir.
// Al salir de pantalla se para y vuelve a la obra; al volver, empieza de nuevo.
// En un carrusel ([data-al-pasar]) es igual, pero mientras el ratón está encima de la tarjeta y esperando
// solo MANTENER ms antes del timelapse. Con el dedo, manteniendo pulsada la tarjeta MANTENER_DEDO ms: se
// reproduce una vez, con la tarjeta ampliada y el carrusel quieto (.pixel-card--fija); un toque normal abre el
// visor como siempre.
//
// La obra terminada es la imagen final y no el último fotograma del timelapse, que no aplica bien las
// opacidades ni las capas con modos especiales. El timelapse va encima con fondo opaco (.timelapse__proceso
// en global.css), así que los fundidos son solo su opacidad.
import { descargar, duracionGif, esperar, ponerGif } from './gifs';

const MOSTRAR_FINAL = 1500; // ms
const MANTENER = 500;       // ms
const MANTENER_DEDO = 1000; // ms
const MOVIMIENTO = 5;       // px que puede moverse el dedo sin que deje de contar como mantener pulsado
                            // (el mismo umbral con el que el carrusel empieza a arrastrarse)
const ESPERA_ENTRE = 4000;  // ms
const FUNDIDO = 1000;       // ms, el de la transición de .timelapse__proceso en global.css

// El timelapse que se está reproduciendo con el dedo: al empezar otro, se para
let pararDedo: (() => void) | null = null;

const preparar = (caja: HTMLElement) => {
    const proceso = caja.querySelector<HTMLImageElement>('.timelapse__proceso')!;
    const barra = caja.querySelector<HTMLElement>('.timelapse__progreso')!;
    const url = caja.dataset.timelapse!;
    let ronda = 0; // Cambia al empezar o parar, para cortar el ciclo que estuviera en marcha

    const reproduciendo = (si: boolean, duracion = 0) => {
        caja.classList.toggle('timelapse--reproduciendo', si);
        barra.style.animation = si ? `timelapse-progreso ${duracion}ms linear forwards` : '';
    };

    // repetir: false, una sola vez (termina cuando la obra ha vuelto a aparecer)
    const empezar = async (espera: number, repetir = true) => {
        const actual = ++ronda;
        const sigue = () => actual === ronda;
        descargar(url); // Se va descargando mientras se ve la obra
        await esperar(espera);

        while (sigue()) {
            const duracion = await duracionGif(url);
            await ponerGif(proceso, url);
            await proceso.decode().catch(() => {});
            if (!sigue()) return;
            reproduciendo(true, duracion);
            await esperar(duracion);
            if (!sigue()) return;
            caja.classList.remove('timelapse--reproduciendo'); // La barra se queda llena mientras se desvanece
            if (!repetir) return esperar(FUNDIDO);
            await esperar(ESPERA_ENTRE);
        }
    };

    const parar = () => {
        const actual = ++ronda;
        reproduciendo(false);
        // Cuando ya no se ve, se suelta el GIF para que el navegador deje de animarlo
        setTimeout(() => {
            if (actual !== ronda || !proceso.src.startsWith('blob:')) return;
            URL.revokeObjectURL(proceso.src);
            proceso.removeAttribute('src');
        }, FUNDIDO);
    };

    if (caja.hasAttribute('data-al-pasar')) {
        // Solo con ratón: en pantallas táctiles, tocar la tarjeta abre el visor
        const tarjeta = caja.closest<HTMLElement>('.pixel-card')!;
        tarjeta.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && empezar(MANTENER));
        tarjeta.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && parar());

        // Con el dedo
        let pulsacion = 0;
        let inicio = { x: 0, y: 0 };
        let evitarClick = false;

        const conElDedo = async () => {
            evitarClick = true; // Al soltar llega un click: no debe abrir el visor
            pararDedo?.();
            const detener = () => {
                parar();
                tarjeta.classList.remove('pixel-card--fija');
            };
            pararDedo = detener;
            tarjeta.classList.add('pixel-card--fija');
            await empezar(0, false);
            if (pararDedo !== detener) return; // Se paró al empezar otro
            detener();
            pararDedo = null;
        };

        const cancelar = () => clearTimeout(pulsacion);
        tarjeta.addEventListener('pointerdown', (e) => {
            evitarClick = false; // Por si al mantener pulsado no llegó a haber click
            if (e.pointerType === 'mouse') return;
            inicio = { x: e.clientX, y: e.clientY };
            cancelar();
            pulsacion = window.setTimeout(conElDedo, MANTENER_DEDO);
        });
        tarjeta.addEventListener('pointermove', (e) => {
            if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > MOVIMIENTO) cancelar();
        });
        tarjeta.addEventListener('pointerup', cancelar);
        tarjeta.addEventListener('pointercancel', cancelar); // El navegador se queda el gesto (p. ej. para desplazar)
        tarjeta.addEventListener('click', (e) => {
            if (!evitarClick) return;
            evitarClick = false;
            e.stopPropagation();
            e.preventDefault();
        }, true);
        // Sin el menú de "guardar imagen" de mantener pulsado
        tarjeta.addEventListener('contextmenu', (e) => {
            if ((e as PointerEvent).pointerType !== 'mouse') e.preventDefault();
        });
        return;
    }
    new IntersectionObserver(([entrada]) => (entrada.isIntersecting ? empezar(MOSTRAR_FINAL) : parar()), { threshold: 0.5 })
        .observe(caja);
};

document.querySelectorAll<HTMLElement>('[data-timelapse]').forEach(preparar);
