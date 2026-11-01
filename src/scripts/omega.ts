// Omega (BloodRunner, Omega.astro). El ciclo:
//  1. Cuando la tarjeta del proyecto está en pantalla, el coche llega por la derecha y se para con la puerta
//     sobre la tarjeta; en la escena de salir, en cuanto se abre la puerta, Omega salta de ella al borde
//     superior de la tarjeta y se queda ahí de pie (idle sin brazo). El coche sigue su camino hacia la izquierda.
//  2. Mientras, el brazo aparece en un sitio libre de la página, como los de las mascotas (sitioLibre en
//     mascotas.ts), y se puede arrastrar (con ratón o con el dedo; cerca del borde de la ventana, la página se desplaza).
//  3. Al soltarlo encima de Omega desaparece: Omega se lo acopla, se activa y se transforma (el remolino va por
//     encima y Omega deja de verse cuando lo cubre entero). A los ESPERA_CICLO ms, vuelta a empezar.
// Al pasar el ratón por Omega o por el brazo sale un bocadillo con lo que hay que hacer; en pantallas sin ratón
// están siempre a la vista (parpadeando, ver global.css) mientras Omega espera.
// Sin el modo de animaciones completo (.intro-activa) no hay coche: Omega aparece directamente.
import { duracionGif, descargar, esperar, ponerGif } from './gifs';
import { chocan, enPagina, sitioLibre, type Caja } from './mascotas';

const ESPERA_CICLO = 5000;  // ms desde que Omega desaparece hasta que vuelve el coche
const PUERTA = 197;         // Centro de la puerta del coche, en píxeles del sprite: por ahí sale Omega
const ABRE_PUERTA = 100;    // ms de la escena del coche en los que se empieza a abrir la puerta
const PUERTA_ALTO = 14;     // Altura del suelo de la puerta sobre el de la tarjeta, en píxeles del sprite
const SALTO = 450;          // ms que dura el salto de Omega
const ALTURA_SALTO = 20;    // Cuánto sube por encima de la recta entre la puerta y el suelo, en píxeles del sprite
const VELOCIDAD = 900;      // px por segundo del coche a toda marcha
const CUBIERTO = 600;       // ms de la transformación en los que el remolino ya tapa a Omega entero
const HUNDIDO = 2;          // px que se hunden los pies en el borde de la tarjeta (1 píxel del marco)
// Las animaciones no tienen al personaje en el mismo sitio del lienzo: lo que hay que moverlas (en píxeles del
// sprite) para que los pies queden donde los del idle
const AJUSTE: Record<string, [number, number]> = { acoplar: [-2, -2], activacion: [0, -1] };
const BORDE_SCROLL = 60;    // px del borde de la ventana desde los que la página se desplaza al arrastrar
const PASO_SCROLL = 12;     // px que se desplaza por fotograma

const sinRaton = matchMedia('(hover: none)').matches;

const grupo = document.querySelector<HTMLElement>('.omega-grupo');
if (grupo) {
    const tarjeta = grupo.closest('.proyecto__lugar')!.querySelector<HTMLElement>('.proyecto__tarjeta')!;
    const coche = grupo.querySelector<HTMLElement>('.omega-coche')!;
    const omega = grupo.querySelector<HTMLElement>('.omega')!;
    const brazo = grupo.querySelector<HTMLElement>('.omega-brazo')!;
    const imgCoche = coche.querySelector('img')!;
    const sprite = omega.querySelector<HTMLImageElement>('.omega__sprite')!;
    const efecto = omega.querySelector<HTMLImageElement>('.omega__efecto')!;
    const bocadilloOmega = omega.querySelector<HTMLElement>('.bocadillo')!;
    const bocadilloBrazo = brazo.querySelector<HTMLElement>('.bocadillo')!;

    const cocheMoviendose = imgCoche.getAttribute('src')!;
    const idle = sprite.getAttribute('src')!;
    const { escena } = imgCoche.dataset;
    const { acoplar, activacion } = sprite.dataset;
    const { transformacion } = efecto.dataset;
    [escena, acoplar, activacion, transformacion].forEach((url) => descargar(url!)); // Que estén listos a tiempo

    // Como las mascotas: en el <body> y colocados con coordenadas de la página. El coche va dentro de una franja
    // del ancho de la ventana que recorta lo que sobresale: si no, al entrar por la derecha ensancharía la página
    // y en el móvil el navegador se alejaría para que cupiera entera
    const carril = document.createElement('div');
    carril.className = 'omega-carril';
    carril.append(coche);
    document.body.append(carril, omega, brazo);

    // Píxeles de pantalla por píxel del sprite (--px en global.css) y medidas en pantalla
    const px = () => parseFloat(getComputedStyle(omega).getPropertyValue('--px'));
    const medida = (el: HTMLElement, nombre: string) => parseFloat(el.style.getPropertyValue(nombre)) * px();
    const poner = (el: HTMLElement, x: number, y: number) => {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    };

    // Omega, de pie en el centro del borde superior de la tarjeta
    const centro = () => {
        const t = enPagina(tarjeta);
        return { x: t.x + t.ancho / 2, suelo: t.y + HUNDIDO };
    };
    // elevacion: px por encima del suelo (en el salto)
    const colocarOmega = (elevacion = 0) => {
        const { x, suelo } = centro();
        poner(omega, x - medida(omega, '--ancho') / 2, suelo - elevacion - (medida(omega, '--alto') - medida(omega, '--pies')));
    };

    // Pone una animación de Omega (desde su primer fotograma) con el ajuste que necesite para no moverse
    const animar = async (nombre: 'acoplar' | 'activacion') => {
        const [dx, dy] = AJUSTE[nombre] ?? [0, 0];
        await ponerGif(sprite, sprite.dataset[nombre]!);
        sprite.style.transform = `translate(${dx * px()}px, ${dy * px()}px)`;
    };
    const cajaDe = (el: HTMLElement): Caja => ({ x: el.offsetLeft, y: el.offsetTop, ancho: el.offsetWidth, alto: el.offsetHeight });

    // --- LLEGADA EN COCHE ---

    // Mueve el coche de x0 a x1 en la página; curva: de 0 a 1 según el tiempo (frenar o acelerar)
    const conducir = (x0: number, x1: number, curva: (t: number) => number) => new Promise<void>((listo) => {
        const duracion = Math.max((Math.abs(x1 - x0) / VELOCIDAD) * 1000 * 1.6, 1); // Más lento que a toda marcha por la curva
        const inicio = performance.now();
        const paso = (ahora: number) => {
            const t = Math.min((ahora - inicio) / duracion, 1);
            coche.style.left = `${x0 + (x1 - x0) * curva(t)}px`;
            if (t < 1) requestAnimationFrame(paso);
            else listo();
        };
        requestAnimationFrame(paso);
    });
    const frenando = (t: number) => 1 - (1 - t) ** 3;
    const acelerando = (t: number) => t ** 3;

    // Omega se queda esperando su brazo, que aparece en otro sitio de la página
    const mostrarOmega = (elevacion = 0) => {
        sprite.src = idle;
        sprite.style.transform = '';
        sprite.hidden = false;
        colocarOmega(elevacion);
        omega.hidden = false;
    };

    // Omega se queda esperando su brazo, que aparece en otro sitio de la página
    const esperarBrazo = () => {
        estado = 'esperando';
        sacarBrazo();
        bocadillosSinRaton();
    };

    const bocadillosSinRaton = () => {
        if (!sinRaton || estado !== 'esperando') return;
        bocadilloOmega.hidden = false;
        bocadilloBrazo.hidden = false;
    };

    // Salto desde la puerta del coche hasta el suelo, en parábola y de píxel en píxel del sprite
    const saltar = () => new Promise<void>((listo) => {
        const inicio = performance.now();
        const paso = (ahora: number) => {
            const t = Math.min((ahora - inicio) / SALTO, 1);
            const elevacion = PUERTA_ALTO * (1 - t) + ALTURA_SALTO * 4 * t * (1 - t);
            colocarOmega(Math.round(elevacion) * px());
            if (t < 1) requestAnimationFrame(paso);
            else listo();
        };
        requestAnimationFrame(paso);
    });

    let estado: 'fuera' | 'llegando' | 'esperando' | 'transformando' = 'fuera';
    let enPantalla = false;
    let enPausa = false; // Los ESPERA_CICLO ms entre que Omega desaparece y vuelve el coche

    const llegar = async () => {
        estado = 'llegando';
        if (document.documentElement.classList.contains('intro-activa')) {
            const { x, suelo } = centro();
            const parada = x - PUERTA * px();
            const ancho = medida(coche, '--ancho');
            carril.style.top = `${suelo - medida(coche, '--alto')}px`;
            carril.style.height = `${medida(coche, '--alto')}px`;
            imgCoche.src = cocheMoviendose;
            coche.style.left = `${scrollX + innerWidth}px`;
            coche.hidden = false;
            await conducir(scrollX + innerWidth, parada, frenando);

            await ponerGif(imgCoche, escena!);
            await esperar(ABRE_PUERTA);
            mostrarOmega(PUERTA_ALTO * px());
            await saltar();
            esperarBrazo();
            await esperar((await duracionGif(escena!)) - ABRE_PUERTA - SALTO);

            imgCoche.src = cocheMoviendose;
            await conducir(parada, Math.min(scrollX, parada) - ancho, acelerando);
            coche.hidden = true;
        } else {
            mostrarOmega();
            esperarBrazo();
        }
    };

    new IntersectionObserver(([entrada]) => {
        enPantalla = entrada.isIntersecting;
        if (enPantalla && estado === 'fuera' && !enPausa) llegar();
    }, { threshold: 0.6 }).observe(tarjeta);

    // --- EL BRAZO ---

    const sacarBrazo = () => {
        brazo.hidden = true; // Oculto mientras se busca sitio, para que no cuente como obstáculo de sí mismo
        // Si no queda ningún hueco libre, al lado de Omega, en el borde de la tarjeta
        const caja = sitioLibre(brazo, tarjeta);
        if (caja) poner(brazo, caja.x, caja.y);
        else poner(brazo, centro().x - medida(omega, '--ancho'), centro().suelo - medida(brazo, '--alto'));
        brazo.hidden = false;
        brazo.classList.remove('omega--pop');
        void brazo.offsetWidth;
        brazo.classList.add('omega--pop');
    };

    let arrastre: { dx: number; dy: number; x: number; y: number } | null = null;

    const encimaDeOmega = () => estado === 'esperando' && chocan(cajaDe(brazo), cajaDe(omega));

    const moverBrazo = () => {
        if (!arrastre) return;
        const maxX = document.documentElement.scrollWidth - brazo.offsetWidth;
        const maxY = document.documentElement.scrollHeight - brazo.offsetHeight;
        poner(brazo,
            Math.min(Math.max(arrastre.x + scrollX - arrastre.dx, 0), maxX),
            Math.min(Math.max(arrastre.y + scrollY - arrastre.dy, 0), maxY));
        bocadilloOmega.hidden = !encimaDeOmega(); // Omega lo pide al acercárselo
    };

    // Cerca del borde de arriba o de abajo de la ventana, la página se desplaza sola
    const desplazar = () => {
        if (!arrastre) return;
        const { y } = arrastre;
        if (y < BORDE_SCROLL) scrollBy(0, -PASO_SCROLL);
        else if (y > innerHeight - BORDE_SCROLL) scrollBy(0, PASO_SCROLL);
        requestAnimationFrame(desplazar);
    };

    brazo.addEventListener('pointerdown', (e) => {
        if (estado === 'transformando') return;
        e.preventDefault();
        brazo.setPointerCapture(e.pointerId);
        arrastre = { dx: e.pageX - brazo.offsetLeft, dy: e.pageY - brazo.offsetTop, x: e.clientX, y: e.clientY };
        brazo.classList.add('omega-brazo--arrastrando');
        bocadilloBrazo.hidden = true;
        requestAnimationFrame(desplazar);
    });

    brazo.addEventListener('pointermove', (e) => {
        if (!arrastre) return;
        arrastre.x = e.clientX;
        arrastre.y = e.clientY;
        moverBrazo();
    });

    addEventListener('scroll', moverBrazo, { passive: true });

    const soltar = () => {
        if (!arrastre) return;
        arrastre = null;
        brazo.classList.remove('omega-brazo--arrastrando');
        bocadilloOmega.hidden = true;
        if (encimaDeOmega()) transformar();
        else bocadillosSinRaton();
    };
    brazo.addEventListener('pointerup', soltar);
    brazo.addEventListener('pointercancel', soltar);

    // --- BOCADILLOS ---

    const alPasar = (el: HTMLElement, bocadillo: HTMLElement) => {
        el.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse' && !arrastre && estado === 'esperando') bocadillo.hidden = false;
        });
        el.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse' && !arrastre) bocadillo.hidden = true;
        });
    };
    alPasar(omega, bocadilloOmega);
    alPasar(brazo, bocadilloBrazo);

    // --- TRANSFORMACIÓN ---

    const transformar = async () => {
        estado = 'transformando';
        brazo.hidden = true;
        bocadilloOmega.hidden = true;
        bocadilloBrazo.hidden = true;

        await animar('acoplar');
        await esperar(await duracionGif(acoplar!));
        await animar('activacion');
        await esperar(await duracionGif(activacion!));

        await ponerGif(efecto, transformacion!);
        efecto.hidden = false;
        await esperar(CUBIERTO);
        sprite.hidden = true;
        await esperar((await duracionGif(transformacion!)) - CUBIERTO);
        omega.hidden = true;
        efecto.hidden = true;

        estado = 'fuera';
        enPausa = true;
        await esperar(ESPERA_CICLO);
        enPausa = false;
        if (enPantalla) llegar(); // Si no, cuando la tarjeta vuelva a estar en pantalla
    };

    // Al cambiar el tamaño de la página, Omega se queda en su tarjeta
    new ResizeObserver(() => {
        if (!omega.hidden) colocarOmega();
    }).observe(document.body);
}
