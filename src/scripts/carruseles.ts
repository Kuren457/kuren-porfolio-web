// Carruseles (Carrusel.astro): la pista avanza sola en bucle y se puede mover a mano arrastrando (ratón o dedo),
// con la rueda horizontal / el gesto lateral del touchpad, o con Mayús + rueda. La rueda normal sigue bajando la
// página. Se para mientras el ratón está encima, mientras se pulsa o se arrastra y mientras alguna tarjeta está
// fija (.pixel-card--fija, p. ej. reproduciendo su timelapse); al soltar un arrastre rápido sigue por inercia.
// En el modo de animaciones suaves no avanza sola, pero se puede mover igual.
//
// El bucle: la pista tiene las tarjetas dos veces seguidas y la posición se mantiene entre 0 y el ancho de una
// tanda (más el hueco hasta la copia): al dar la vuelta, la copia ocupa justo el sitio del original y no se nota.
// Si una tanda cabe entera en pantalla, no hay bucle posible: la fila se queda quieta y centrada (.carrusel--quieto).

const VELOCIDAD = 40;       // px por segundo
const UMBRAL_ARRASTRE = 5;  // px que hay que mover para que cuente como arrastre y no como click
const FRENADO = 4;          // Cuánto frena la inercia (más alto, se para antes)

interface Estado {
    carrusel: HTMLElement;
    ventana: HTMLElement;
    pista: HTMLElement;
    vuelta: number;    // Ancho de una tanda más el hueco: lo que hay que avanzar para dar una vuelta
    posicion: number;  // px desplazados, entre 0 y vuelta
    sentido: 1 | -1;   // 1: hacia la izquierda; -1 (data-inverso): hacia la derecha
    quieto: boolean;
    visible: boolean;
    encima: boolean;   // Ratón encima
    inercia: number;   // px por segundo tras soltar un arrastre
    arrastre: { id: number; inicioX: number; inicioPosicion: number; moviendo: boolean; ultimaX: number; ultimoT: number; velocidad: number } | null;
    evitarClick: boolean;
}

const avanzaSola = () => document.documentElement.classList.contains('intro-activa');

const envolver = (e: Estado) => {
    if (e.vuelta > 0) e.posicion = ((e.posicion % e.vuelta) + e.vuelta) % e.vuelta;
};

const pintar = (e: Estado) => {
    e.pista.style.transform = e.quieto ? '' : `translateX(${-e.posicion}px)`;
};

const medir = (e: Estado) => {
    const originales = [...e.pista.children].filter((t) => !t.hasAttribute('data-copia')) as HTMLElement[];
    if (!originales.length || !e.ventana.clientWidth) return; // Oculto (p. ej. en la vista "Todos")

    const primera = originales[0];
    const ultima = originales[originales.length - 1];
    const anchoTanda = ultima.offsetLeft + ultima.offsetWidth - primera.offsetLeft;
    const hueco = parseFloat(getComputedStyle(e.pista).columnGap) || 0;

    e.vuelta = anchoTanda + hueco;
    e.quieto = anchoTanda <= e.ventana.clientWidth;
    e.carrusel.classList.toggle('carrusel--quieto', e.quieto);
    envolver(e);
    pintar(e);
};

const preparar = (carrusel: HTMLElement): Estado => {
    const e: Estado = {
        carrusel,
        ventana: carrusel.querySelector<HTMLElement>('.carrusel__ventana')!,
        pista: carrusel.querySelector<HTMLElement>('.carrusel__pista')!,
        vuelta: 0, posicion: 0, sentido: carrusel.hasAttribute('data-inverso') ? -1 : 1,
        quieto: false, visible: false, encima: false, inercia: 0, arrastre: null, evitarClick: false,
    };
    const { ventana } = e;

    ventana.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') e.encima = true; });
    ventana.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') e.encima = false; });

    // --- Arrastre ---
    ventana.addEventListener('pointerdown', (ev) => {
        if (e.quieto || ev.button !== 0) return;
        e.inercia = 0;
        e.arrastre = { id: ev.pointerId, inicioX: ev.clientX, inicioPosicion: e.posicion, moviendo: false, ultimaX: ev.clientX, ultimoT: ev.timeStamp, velocidad: 0 };
    });

    ventana.addEventListener('pointermove', (ev) => {
        const a = e.arrastre;
        if (!a || ev.pointerId !== a.id) return;
        const dx = ev.clientX - a.inicioX;
        if (!a.moviendo) {
            if (Math.abs(dx) < UMBRAL_ARRASTRE) return;
            // Solo se captura el puntero al empezar a arrastrar: si se capturase al pulsar, el click no llegaría
            // a la tarjeta y no se abriría el visor
            a.moviendo = true;
            ventana.setPointerCapture(ev.pointerId);
            e.carrusel.classList.add('carrusel--arrastrando');
        }
        const dt = (ev.timeStamp - a.ultimoT) / 1000;
        if (dt > 0) a.velocidad = (ev.clientX - a.ultimaX) / dt;
        a.ultimaX = ev.clientX;
        a.ultimoT = ev.timeStamp;
        e.posicion = a.inicioPosicion - dx;
        envolver(e);
        pintar(e);
    });

    const soltar = (ev: PointerEvent) => {
        const a = e.arrastre;
        if (!a || ev.pointerId !== a.id) return;
        if (a.moviendo) {
            e.inercia = -a.velocidad;
            e.evitarClick = true; // El click que llega al soltar no debe abrir el visor
            e.carrusel.classList.remove('carrusel--arrastrando');
        }
        e.arrastre = null;
    };
    ventana.addEventListener('pointerup', soltar);
    ventana.addEventListener('pointercancel', soltar);

    ventana.addEventListener('click', (ev) => {
        if (!e.evitarClick) return;
        e.evitarClick = false;
        ev.stopPropagation();
        ev.preventDefault();
    }, true);

    // Que el navegador no intente arrastrar las imágenes como archivos
    ventana.addEventListener('dragstart', (ev) => ev.preventDefault());

    // --- Rueda: horizontal (touchpad, rueda inclinable) o Mayús + rueda ---
    ventana.addEventListener('wheel', (ev) => {
        if (e.quieto) return;
        const delta = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.shiftKey ? ev.deltaY : 0;
        if (!delta) return; // Rueda normal: baja la página
        ev.preventDefault();
        e.inercia = 0;
        e.posicion += ev.deltaMode === 1 ? delta * 16 : delta; // deltaMode 1: en líneas, no en px
        envolver(e);
        pintar(e);
    }, { passive: false });

    return e;
};

const estados = [...document.querySelectorAll<HTMLElement>('.carrusel')].map(preparar);

// Medidas: al cargar y cada vez que cambia el tamaño de la ventana o de las tarjetas
const porElemento = new Map<Element, Estado>();
const medidor = new ResizeObserver((entradas) => entradas.forEach((en) => medir(porElemento.get(en.target)!)));
estados.forEach((e) => {
    porElemento.set(e.ventana, e).set(e.pista, e);
    medidor.observe(e.ventana);
    medidor.observe(e.pista);
});

// Solo se mueven los carruseles que están en pantalla
const vigia = new IntersectionObserver((entradas) => entradas.forEach((en) => (porElemento.get(en.target)!.visible = en.isIntersecting)));
estados.forEach((e) => vigia.observe(e.ventana));

let anterior = performance.now();
const animar = (ahora: number) => {
    const dt = Math.min((ahora - anterior) / 1000, 0.1); // Tope por si la pestaña estuvo en segundo plano
    anterior = ahora;
    for (const e of estados) {
        if (!e.visible || e.quieto || e.arrastre?.moviendo) continue;
        if (e.inercia) {
            e.posicion += e.inercia * dt;
            e.inercia *= Math.exp(-FRENADO * dt);
            if (Math.abs(e.inercia) < 10) e.inercia = 0;
        } else if (avanzaSola() && !e.encima && !e.arrastre && !e.pista.querySelector('.pixel-card--fija')) {
            e.posicion += e.sentido * VELOCIDAD * dt;
        } else {
            continue;
        }
        envolver(e);
        pintar(e);
    }
    requestAnimationFrame(animar);
};
requestAnimationFrame(animar);
