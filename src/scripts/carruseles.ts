// Ajusta cada carrusel (Carrusel.astro) a su contenido: cuánto tiene que desplazarse para que el bucle cuadre
// (el ancho de una tanda de tarjetas más el hueco hasta la copia) y cuánto tarda, para que todas las filas
// vayan a la misma velocidad. Si una tanda cabe entera en pantalla, no hay bucle posible sin que se vea el
// corte: la fila se queda quieta y centrada (.carrusel--quieto).
// Se recalcula si cambia el tamaño de la ventana o de las tarjetas (p. ej. cuando un vídeo carga sus medidas).

const VELOCIDAD = 40; // px por segundo

const ajustar = (carrusel: HTMLElement) => {
    const ventana = carrusel.querySelector<HTMLElement>('.carrusel__ventana')!;
    const pista = carrusel.querySelector<HTMLElement>('.carrusel__pista')!;
    const originales = [...pista.children].filter((tarjeta) => !tarjeta.hasAttribute('data-copia')) as HTMLElement[];
    if (!originales.length || !ventana.clientWidth) return; // Oculto (p. ej. en la vista "Todos")

    const primera = originales[0];
    const ultima = originales[originales.length - 1];
    const anchoTanda = ultima.offsetLeft + ultima.offsetWidth - primera.offsetLeft;
    const hueco = parseFloat(getComputedStyle(pista).columnGap) || 0;
    const desplazamiento = anchoTanda + hueco;

    carrusel.classList.toggle('carrusel--quieto', anchoTanda <= ventana.clientWidth);
    carrusel.style.setProperty('--desplazamiento', `${desplazamiento}px`);
    carrusel.style.setProperty('--duracion', `${desplazamiento / VELOCIDAD}s`);
};

const carruseles = document.querySelectorAll<HTMLElement>('.carrusel');
const observador = new ResizeObserver((entradas) => {
    entradas.forEach((entrada) => ajustar(entrada.target.closest<HTMLElement>('.carrusel')!));
});

carruseles.forEach((carrusel) => {
    observador.observe(carrusel.querySelector('.carrusel__ventana')!);
    observador.observe(carrusel.querySelector('.carrusel__pista')!);
});
