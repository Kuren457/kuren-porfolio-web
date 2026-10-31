// Timelapses (PixelCard con timelapse). En la sección de timelapses, mientras la tarjeta está en pantalla:
//  1. Enseña la obra terminada MOSTRAR_FINAL ms.
//  2. Se desvanece al timelapse, que empieza desde su primer fotograma (una barra marca por dónde va).
//  3. Al terminar, se desvanece otra vez a la obra, que se queda ESPERA_ENTRE ms antes de repetir.
// Al salir de pantalla se para y vuelve a la obra; al volver, empieza de nuevo.
// En un carrusel ([data-al-pasar]) es igual, pero mientras el ratón está encima de la tarjeta y esperando
// solo MANTENER ms antes del timelapse.
//
// La obra terminada es la imagen final y no el último fotograma del timelapse, que no aplica bien las
// opacidades ni las capas con modos especiales. El timelapse va encima con fondo opaco (.timelapse__proceso
// en global.css), así que los fundidos son solo su opacidad.
import { descargar, duracionGif, esperar, ponerGif } from './gifs';

const MOSTRAR_FINAL = 1500; // ms
const MANTENER = 500;       // ms
const ESPERA_ENTRE = 4000;  // ms
const FUNDIDO = 1000;       // ms, el de la transición de .timelapse__proceso en global.css

const preparar = (caja: HTMLElement) => {
    const proceso = caja.querySelector<HTMLImageElement>('.timelapse__proceso')!;
    const barra = caja.querySelector<HTMLElement>('.timelapse__progreso')!;
    const url = caja.dataset.timelapse!;
    let ronda = 0; // Cambia al empezar o parar, para cortar el ciclo que estuviera en marcha

    const reproduciendo = (si: boolean, duracion = 0) => {
        caja.classList.toggle('timelapse--reproduciendo', si);
        barra.style.animation = si ? `timelapse-progreso ${duracion}ms linear forwards` : '';
    };

    const empezar = async (espera: number) => {
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
        tarjeta.addEventListener('pointerleave', parar);
        return;
    }
    new IntersectionObserver(([entrada]) => (entrada.isIntersecting ? empezar(MOSTRAR_FINAL) : parar()), { threshold: 0.5 })
        .observe(caja);
};

document.querySelectorAll<HTMLElement>('[data-timelapse]').forEach(preparar);
