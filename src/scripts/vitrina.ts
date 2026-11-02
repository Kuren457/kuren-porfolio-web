// Vitrinas (Vitrina.astro): cada PAUSA ms la obra del centro deja paso a la siguiente. Cada obra lleva una clase
// según su sitio (en el centro, a un lado o escondida) y global.css las coloca y anima. Se para mientras el ratón
// está encima o no se ve, y con el visor abierto.
// Pulsar una obra de un lado la trae al centro (sin abrir el visor); la del centro se abre en el visor como
// cualquier tarjeta (galeria.ts).
// Cada obra tiene su tamaño, así que las de los lados se colocan según el ancho de la del centro: pegadas a ella
// y metidas por detrás solo un poco (SOLAPE), para que siempre se vean y se puedan pulsar.

const PAUSA = 3500;       // ms
const ESCALA_LADO = 0.55; // La de .vitrina__obra[data-sitio='previa'/'siguiente'] en global.css
const SOLAPE = 0.3;       // Parte de una obra de un lado que queda por detrás de la del centro
const MARGEN = 8;         // px entre una obra de un lado y el borde de la vitrina

const preparar = (vitrina: HTMLElement) => {
    const escenario = vitrina.querySelector<HTMLElement>('.vitrina__escenario')!;
    const obras = [...vitrina.querySelectorAll<HTMLElement>('.vitrina__obra')];
    const puntos = [...vitrina.querySelectorAll<HTMLElement>('.vitrina__punto')];
    const n = obras.length;
    let actual = 0;

    // La forma de cada obra (ancho / alto, de los atributos que pone PixelCard), para que global.css la dibuje
    // a su tamaño
    obras.forEach((obra) => {
        const media = obra.querySelector('.pixel-card__media');
        const ancho = Number(media?.getAttribute('width')), alto = Number(media?.getAttribute('height'));
        if (ancho && alto) obra.style.setProperty('--aspecto', String(ancho / alto));
    });
    let encima = false;
    let visible = false;

    const mostrar = (indice: number) => {
        actual = (indice + n) % n;
        obras.forEach((obra, i) => {
            // Con dos obras, la otra va solo a la derecha
            const sitio = i === actual ? 'actual'
                : i === (actual + 1) % n ? 'siguiente'
                : n > 2 && i === (actual - 1 + n) % n ? 'previa'
                : 'escondida';
            obra.dataset.sitio = sitio;
            obra.querySelector('.pixel-card')?.setAttribute('tabindex', sitio === 'escondida' ? '-1' : '0');
        });
        puntos.forEach((punto, i) => punto.setAttribute('aria-current', String(i === actual)));
        colocarLados();
    };

    // Las de los lados, a la distancia justa de la del centro (el ancho sin transformar: offsetWidth)
    const colocarLados = () => {
        const centro = escenario.clientWidth / 2;
        const anchoActual = obras[actual].offsetWidth;
        obras.forEach((obra) => {
            const lado = obra.dataset.sitio === 'siguiente' ? 1 : obra.dataset.sitio === 'previa' ? -1 : 0;
            if (!lado) return obra.style.removeProperty('left');
            const ancho = obra.offsetWidth * ESCALA_LADO;
            // Sin salirse de la vitrina (lo que sobresale no se ve ni se puede pulsar), aunque quede más por detrás
            const distancia = Math.min(anchoActual / 2 + ancho / 2 - ancho * SOLAPE, centro - ancho / 2 - MARGEN);
            obra.style.left = `${centro + lado * distancia}px`;
        });
    };
    new ResizeObserver(colocarLados).observe(escenario);

    // Las de los lados vienen al centro en vez de abrirse en el visor
    obras.forEach((obra, i) => obra.addEventListener('click', (e) => {
        if (obra.dataset.sitio === 'actual') return;
        e.preventDefault();
        e.stopPropagation();
        mostrar(i);
    }, true));
    puntos.forEach((punto, i) => punto.addEventListener('click', () => mostrar(i)));

    vitrina.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') encima = true; });
    vitrina.addEventListener('pointerleave', () => (encima = false));
    new IntersectionObserver(([entrada]) => (visible = entrada.isIntersecting)).observe(vitrina);

    const visorAbierto = () => !document.getElementById('lightbox')?.classList.contains('hidden');
    if (n > 1) setInterval(() => {
        if (visible && !encima && !visorAbierto()) mostrar(actual + 1);
    }, PAUSA);

    mostrar(0);
};

document.querySelectorAll<HTMLElement>('.vitrina').forEach(preparar);
