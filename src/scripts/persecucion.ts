// Persecución alrededor de una tarjeta (Persecucion.astro): el demonio corre detrás de la galleta por el borde
// de la tarjeta, en el sentido de las agujas del reloj y con los pies siempre apoyados en el marco (en el lado
// derecho van girados 90°, abajo boca abajo...). Las esquinas las recorren en curva, siguiendo el redondeo.
//
// Al pulsar a cualquiera de los dos se paran: la galleta explota y desaparece, el demonio se pone triste y
// llora TIEMPO_LLORANDO; después vuelve la galleta, el demonio se despierta y siguen corriendo.
// En el modo de animaciones suaves no dan vueltas (se quedan en el borde superior), pero responden igual al click.
import { duracionGif, esperar, ponerGif } from './gifs';
import { cargarSonido, sonar } from './sonidos';

const PX = 2;                   // Píxeles de pantalla por píxel del sprite
const VELOCIDAD = 70;           // px por segundo
const DISTANCIA = 70;           // px de ventaja de la galleta sobre el demonio
const RADIO = 34;               // Radio de las esquinas por las que pasan (el del marco: 17 px de marco a 2 px)
const CARRIL = 64;              // Espacio alrededor de la tarjeta por el que corren (.persecucion en global.css)
const TIEMPO_LLORANDO = 3000;   // ms
const INICIO = 40;              // Punto de partida del demonio, en px desde la esquina superior izquierda

// Punto del borde de un cuadrado de lado S con esquinas redondeadas, a una distancia d del inicio del borde
// superior, y hacia dónde se avanza (ángulo en radianes; 0 es hacia la derecha)
const enBorde = (lado: number, d: number) => {
    const recto = lado - 2 * RADIO;
    const curva = (Math.PI / 2) * RADIO;
    const tramo = recto + curva;
    d = ((d % (4 * tramo)) + 4 * tramo) % (4 * tramo);
    const i = Math.floor(d / tramo); // 0 arriba, 1 derecha, 2 abajo, 3 izquierda
    const resto = d - i * tramo;
    const giro = (i * Math.PI) / 2;
    // Centros de las esquinas, empezando por la superior derecha
    const centros = [[lado - RADIO, RADIO], [lado - RADIO, lado - RADIO], [RADIO, lado - RADIO], [RADIO, RADIO]];
    const inicios = [[RADIO, 0], [lado, RADIO], [lado - RADIO, lado], [0, lado - RADIO]];

    if (resto < recto) {
        const [x0, y0] = inicios[i];
        return { x: x0 + Math.cos(giro) * resto, y: y0 + Math.sin(giro) * resto, angulo: giro };
    }
    const a = giro - Math.PI / 2 + (resto - recto) / RADIO;
    const [cx, cy] = centros[i];
    return { x: cx + Math.cos(a) * RADIO, y: cy + Math.sin(a) * RADIO, angulo: a + Math.PI / 2 };
};

// Coloca un corredor con los pies (el centro de su base, sin las filas vacías) en el punto d del borde
const colocar = (corredor: HTMLElement, lado: number, d: number) => {
    const estilo = getComputedStyle(corredor);
    const valor = (nombre: string) => parseFloat(estilo.getPropertyValue(nombre)) * PX;
    const { x, y, angulo } = enBorde(lado, d);
    corredor.style.transform =
        `translate(${CARRIL + x}px, ${CARRIL + y}px) rotate(${angulo}rad) translate(${-valor('--ancho') / 2}px, ${-(valor('--alto') - valor('--pies'))}px)`;
};

const preparar = (capa: HTMLElement) => {
    const galleta = capa.querySelector<HTMLElement>('[data-corredor="galleta"]')!;
    const demonio = capa.querySelector<HTMLElement>('[data-corredor="demonio"]')!;
    const imgGalleta = galleta.querySelector('img')!;
    const imgDemonio = demonio.querySelector('img')!;
    const galletaQuieta = imgGalleta.getAttribute('src')!;
    const demonioCorre = imgDemonio.getAttribute('src')!;
    const sonidoExplosion = cargarSonido(galleta.dataset.sonidoExplosion);

    let recorrido = INICIO;
    let corriendo = true;
    let ocupado = false;
    let visible = false;

    const lado = () => capa.parentElement!.offsetWidth;
    const pintar = () => {
        colocar(demonio, lado(), recorrido);
        colocar(galleta, lado(), recorrido + DISTANCIA);
    };

    const pillada = async () => {
        if (ocupado) return;
        ocupado = true;
        corriendo = false;

        // La galleta explota y desaparece; el demonio se pone triste y luego llora
        const { explosion } = imgGalleta.dataset;
        const { triste, llora, despierta } = imgDemonio.dataset;
        ponerGif(imgGalleta, explosion!);
        sonar(sonidoExplosion);
        ponerGif(imgDemonio, triste!);
        duracionGif(explosion!).then(esperar).then(() => galleta.classList.add('corredor--fuera'));
        await esperar(await duracionGif(triste!));
        await ponerGif(imgDemonio, llora!);
        await esperar(TIEMPO_LLORANDO);

        // Vuelve la galleta y el demonio se despierta
        await ponerGif(imgGalleta, galletaQuieta);
        galleta.classList.remove('corredor--fuera');
        await ponerGif(imgDemonio, despierta!);
        await esperar(await duracionGif(despierta!));

        await ponerGif(imgDemonio, demonioCorre);
        corriendo = true;
        ocupado = false;
    };

    galleta.addEventListener('click', pillada);
    demonio.addEventListener('click', pillada);
    new IntersectionObserver(([entrada]) => (visible = entrada.isIntersecting)).observe(capa);
    new ResizeObserver(pintar).observe(capa.parentElement!);
    pintar();

    return (dt: number) => {
        const avanza = corriendo && visible && document.documentElement.classList.contains('intro-activa');
        if (!avanza) return;
        recorrido += VELOCIDAD * dt;
        pintar();
    };
};

const avances = [...document.querySelectorAll<HTMLElement>('.persecucion')].map(preparar);

let anterior = performance.now();
const animar = (ahora: number) => {
    const dt = Math.min((ahora - anterior) / 1000, 0.1); // Tope por si la pestaña estuvo en segundo plano
    anterior = ahora;
    avances.forEach((avanzar) => avanzar(dt));
    requestAnimationFrame(animar);
};
requestAnimationFrame(animar);
