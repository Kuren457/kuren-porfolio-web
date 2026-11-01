// La serpiente de OuroJam (Ouro.astro). Al pulsar el anillo del dragón de la tarjeta, el dragón deja el marco y
// aparece a su lado como serpiente (cabeza, cuerpo y cola), y en otro sitio de la pantalla la mermelada:
//  - Se mueve con las flechas o WASD, o deslizando el dedo; empieza a moverse con la primera dirección.
//  - Si la cabeza llega a la mermelada, gana: sigue recto hasta salir de la pantalla y vuelve a su marco.
//  - Si se choca con una tarjeta, con el borde de la pantalla o consigo misma, muere: parpadea, desaparece y
//    a los ESPERA_MUERTO ms vuelve a su marco.
//  - Esc o el botón Salir terminan la partida.
// La pantalla es una cuadrícula de casillas de 16 píxeles del sprite, con el origen en la cola al empezar. Los
// obstáculos se miden en cada paso, así que se puede seguir desplazando la página con la rueda.
// Las piezas están dibujadas avanzando hacia la derecha, con las llamas del lomo arriba (a su izquierda); girándolas
// según la dirección, las llamas quedan siempre del mismo lado y las curvas encajan (al ir hacia la izquierda, el
// dragón entero va boca abajo).

const PASO = 150;            // ms entre pasos
const PASO_SALIDA = 60;      // ms entre pasos al irse tras ganar
const LARGO = 5;             // Piezas: cabeza, 3 de cuerpo y cola
const HUECO = 4;             // px entre la tarjeta y la cola al salir
const MARGEN = 0.25;         // Parte de la casilla que puede pisar un obstáculo sin chocar (para no morir por un roce)
const LEJOS = 6;             // Casillas mínimas entre la cabeza y la mermelada
const DESLIZAR = 24;         // px que hay que deslizar el dedo para girar
const ESPERA_MUERTO = 5000;  // ms hasta que el dragón vuelve a su marco
const HUECO_MARCO = [12, 52]; // Hueco del marco del dragón (de 64): el anillo es lo de fuera
// Con lo que se choca: la barra de navegación, las tarjetas y los botones con marco. Los carruseles y el botón
// flotante de las animaciones no (pasa por encima): si no, en el móvil apenas queda sitio para moverse
const OBSTACULOS = 'header, [data-aparicion]:not(.pixel-card__frame), .marco-boton:not(.boton-animaciones)';

type Dir = 0 | 1 | 2 | 3; // derecha, abajo, izquierda, arriba (cada una, 90° más en el sentido del reloj)
interface Celda { x: number; y: number }
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];
const opuesta = (d: Dir) => ((d + 2) % 4) as Dir;
const horario = (d: Dir) => ((d + 1) % 4) as Dir;
// Dirección para ir de una celda a la de al lado
const haciaDe = (a: Celda, b: Celda): Dir => (b.x > a.x ? 0 : b.y > a.y ? 1 : b.x < a.x ? 2 : 3);

const capa = document.querySelector<HTMLElement>('.ouro');
if (capa) {
    const lugar = document.querySelector('.ouro-aviso')!.closest('.proyecto__lugar')!;
    const tarjeta = lugar.querySelector<HTMLElement>('.proyecto__tarjeta')!;
    const marco = tarjeta.querySelector<HTMLElement>('.proyecto__marco')!;
    const bocadillo = lugar.querySelector<HTMLElement>('.ouro-aviso .bocadillo')!;
    const mermelada = capa.querySelector<HTMLImageElement>('.ouro__mermelada')!;
    const ayuda = capa.querySelector<HTMLElement>('.ouro__ayuda')!;
    const salir = capa.querySelector<HTMLElement>('.ouro__salir')!;
    const { cabeza: srcCabeza, cuerpo: srcCuerpo, curvaHoraria: srcHoraria, curvaAntihoraria: srcAntihoraria, cola: srcCola } = capa.dataset;
    const sinRaton = matchMedia('(hover: none)').matches;

    // A pantalla completa (fixed): fuera de la sección, para que nada la recorte
    document.body.append(capa);
    const piezas = Array.from({ length: LARGO }, () => {
        const img = document.createElement('img');
        img.className = 'ouro__pieza';
        img.alt = '';
        capa.prepend(img);
        return img;
    });

    let estado: 'parado' | 'esperando' | 'jugando' | 'saliendo' | 'muerto' = 'parado';
    let cuerpo: Celda[] = []; // 0: la cabeza
    let dir: Dir = 0;
    let giros: Dir[] = [];    // Pulsaciones pendientes (para poder encadenar dos giros entre pasos)
    let comida: Celda = { x: 0, y: 0 };
    let origen = { x: 0, y: 0 };
    let lado = 48;            // px de una casilla
    let temporizador = 0;
    let obstaculos: HTMLElement[] = [];

    const px = () => parseFloat(getComputedStyle(capa).getPropertyValue('--px'));
    const enPantalla = (c: Celda) => ({ x: origen.x + c.x * lado, y: origen.y + c.y * lado });

    // --- CHOQUES ---

    const choca = (c: Celda, margen = MARGEN * lado) => {
        const { x, y } = enPantalla(c);
        const caja = { izq: x + margen, der: x + lado - margen, arr: y + margen, aba: y + lado - margen };
        if (x < 0 || y < 0 || x + lado > innerWidth || y + lado > innerHeight) return true;
        return obstaculos.some((el) => {
            const r = el.getBoundingClientRect();
            return r.width && r.height && caja.izq < r.right && caja.der > r.left && caja.arr < r.bottom && caja.aba > r.top;
        });
    };
    const enCuerpo = (c: Celda, piezasDe = cuerpo) => piezasDe.some((p) => p.x === c.x && p.y === c.y);

    // --- DIBUJO ---

    const pintar = () => {
        cuerpo.forEach((p, i) => {
            let src: string, giro: number;
            if (i === 0) {
                src = srcCabeza!;
                giro = dir * 90;
            } else if (i === cuerpo.length - 1) {
                src = srcCola!;
                giro = haciaDe(p, cuerpo[i - 1]) * 90;
            } else {
                const entra = haciaDe(cuerpo[i + 1], p);
                const sale = haciaDe(p, cuerpo[i - 1]);
                src = entra === sale ? srcCuerpo! : sale === horario(entra) ? srcHoraria! : srcAntihoraria!;
                giro = entra * 90;
            }
            const img = piezas[i];
            if (img.getAttribute('src') !== src) img.src = src;
            const { x, y } = enPantalla(p);
            img.style.transform = `translate(${x}px, ${y}px) rotate(${giro}deg)`;
        });
    };

    // --- PARTIDA ---

    // La serpiente sale de un lado de la tarjeta, con la cola pegada a ella: el primer lado en el que cabe
    const colocar = () => {
        const t = tarjeta.getBoundingClientRect();
        const medio = { x: t.left + t.width / 2 - lado / 2, y: t.top + t.height / 2 - lado / 2 };
        const colas: Record<Dir, { x: number; y: number }> = {
            0: { x: t.right + HUECO, y: medio.y },
            1: { x: medio.x, y: t.bottom + HUECO },
            2: { x: t.left - HUECO - lado, y: medio.y },
            3: { x: medio.x, y: t.top - HUECO - lado },
        };
        for (const d of [0, 1, 2, 3] as Dir[]) {
            origen = { x: Math.round(colas[d].x), y: Math.round(colas[d].y) };
            const piezasDe = Array.from({ length: LARGO }, (_, i) => ({ x: DX[d] * (LARGO - 1 - i), y: DY[d] * (LARGO - 1 - i) }));
            // Que quepa ella y haya un par de casillas libres por delante
            const delante = [1, 2].map((k) => ({ x: piezasDe[0].x + DX[d] * k, y: piezasDe[0].y + DY[d] * k }));
            if ([...piezasDe, ...delante].every((c) => !choca(c))) {
                cuerpo = piezasDe;
                dir = d;
                return true;
            }
        }
        return false;
    };

    // La mermelada, en una casilla libre de la pantalla y lejos de la cabeza
    const ponerMermelada = () => {
        const desde = { x: Math.ceil(-origen.x / lado), y: Math.ceil(-origen.y / lado) };
        const hasta = { x: Math.floor((innerWidth - lado - origen.x) / lado), y: Math.floor((innerHeight - lado - origen.y) / lado) };
        const libres: Celda[] = [];
        for (let y = desde.y; y <= hasta.y; y++) {
            for (let x = desde.x; x <= hasta.x; x++) {
                const c = { x, y };
                const lejos = Math.abs(x - cuerpo[0].x) + Math.abs(y - cuerpo[0].y) >= LEJOS;
                if (lejos && !enCuerpo(c) && !choca(c, -lado / 4)) libres.push(c); // Sin tocar ninguna tarjeta
            }
        }
        comida = libres[Math.floor(Math.random() * libres.length)] ?? { x: cuerpo[0].x + DX[dir] * LEJOS, y: cuerpo[0].y };
        const { x, y } = enPantalla(comida);
        mermelada.style.transform = `translate(${x}px, ${y}px)`;
        mermelada.hidden = false;
    };

    const empezar = () => {
        lado = 16 * px();
        obstaculos = [...document.querySelectorAll<HTMLElement>(OBSTACULOS)].filter((el) => !el.closest('.ouro'));
        if (!colocar()) return; // No cabe en ningún lado (pantalla muy pequeña)
        estado = 'esperando';
        giros = [];
        bocadillo.hidden = true;
        marco.style.visibility = 'hidden'; // El dragón sale del marco
        tarjeta.blur(); // Sin el contorno de foco que el navegador pone al pulsar las flechas
        capa.classList.remove('ouro--muriendo');
        capa.hidden = false;
        pintar();
        ponerMermelada();

        // Ayuda encima de la cabeza hasta el primer movimiento
        ayuda.textContent = sinRaton ? 'Desliza el dedo para moverte' : 'Flechas o WASD para moverte · Esc para salir';
        const { x, y } = enPantalla(cuerpo[0]);
        ayuda.style.left = `${Math.min(Math.max(x + lado / 2, 120), innerWidth - 120)}px`;
        ayuda.style.top = `${Math.max(y - 8, 90)}px`;
        ayuda.hidden = false;
    };

    const paso = () => {
        const giro = giros.shift();
        if (giro !== undefined && giro !== opuesta(dir)) dir = giro;
        const nueva = { x: cuerpo[0].x + DX[dir], y: cuerpo[0].y + DY[dir] };

        if (estado === 'jugando' && (choca(nueva) || enCuerpo(nueva, cuerpo.slice(0, -1)))) return morir();
        cuerpo = [nueva, ...cuerpo.slice(0, -1)];
        pintar();

        if (estado === 'jugando' && nueva.x === comida.x && nueva.y === comida.y) return ganar();
        if (estado === 'saliendo' && cuerpo.every((c) => {
            const { x, y } = enPantalla(c);
            return x + lado < 0 || y + lado < 0 || x > innerWidth || y > innerHeight;
        })) return volverAlMarco();
        temporizador = window.setTimeout(paso, estado === 'saliendo' ? PASO_SALIDA : PASO);
    };

    // Primera dirección: empieza a moverse
    const girar = (d: Dir) => {
        if (estado === 'esperando') {
            if (d === opuesta(dir)) return; // Se metería en su propio cuerpo
            dir = d;
            estado = 'jugando';
            ayuda.hidden = true;
            paso();
            return;
        }
        if (estado === 'jugando' && giros.length < 2) giros.push(d);
    };

    const ganar = () => {
        estado = 'saliendo';
        mermelada.hidden = true;
        temporizador = window.setTimeout(paso, PASO_SALIDA);
    };

    // El dragón vuelve al marco (con su pop, si hay animaciones)
    const volverAlMarco = () => {
        clearTimeout(temporizador);
        estado = 'parado';
        capa.hidden = true;
        mermelada.hidden = true;
        ayuda.hidden = true;
        marco.style.visibility = '';
        marco.classList.remove('proyecto__marco--vuelve');
        void marco.offsetWidth;
        marco.classList.add('proyecto__marco--vuelve');
        if (sinRaton) bocadillo.hidden = false;
    };

    const morir = () => {
        estado = 'muerto';
        mermelada.hidden = true;
        capa.classList.add('ouro--muriendo'); // Parpadea (global.css)
        window.setTimeout(() => (capa.hidden = true), 900);
        window.setTimeout(volverAlMarco, ESPERA_MUERTO);
    };

    // --- CONTROLES ---

    const enJuego = () => estado === 'esperando' || estado === 'jugando';

    const TECLAS: Record<string, Dir> = {
        ArrowRight: 0, ArrowDown: 1, ArrowLeft: 2, ArrowUp: 3, d: 0, s: 1, a: 2, w: 3, D: 0, S: 1, A: 2, W: 3,
    };
    document.addEventListener('keydown', (e) => {
        if (!enJuego()) return;
        if (e.key === 'Escape') return volverAlMarco();
        const d = TECLAS[e.key];
        if (d === undefined) return;
        e.preventDefault(); // Que las flechas no desplacen la página
        girar(d);
    });

    // Deslizar el dedo: cada DESLIZAR px en una dirección, un giro (se pueden encadenar sin levantar el dedo)
    let ancla: { x: number; y: number } | null = null;
    document.addEventListener('touchstart', (e) => {
        if (enJuego()) ancla = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        if (!enJuego() || !ancla) return;
        e.preventDefault(); // Mientras se juega, deslizar no desplaza la página
        const dx = e.touches[0].clientX - ancla.x;
        const dy = e.touches[0].clientY - ancla.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < DESLIZAR) return;
        girar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3));
        ancla = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: false });

    // Mientras se juega, los clicks (y toques) no abren enlaces ni el visor; solo el botón de salir
    document.addEventListener('click', (e) => {
        if (!enJuego() || salir.contains(e.target as Node)) return;
        e.preventDefault();
        e.stopPropagation();
    }, true);
    salir.addEventListener('click', volverAlMarco);

    // --- EL ANILLO DEL DRAGÓN ---

    // ¿El punto está en el anillo (dentro de la tarjeta pero fuera de su hueco)?
    const enAnillo = (e: MouseEvent) => {
        const r = tarjeta.getBoundingClientRect();
        const fx = ((e.clientX - r.left) / r.width) * 64;
        const fy = ((e.clientY - r.top) / r.height) * 64;
        const dentro = (v: number) => v >= HUECO_MARCO[0] && v < HUECO_MARCO[1];
        return !(dentro(fx) && dentro(fy));
    };

    tarjeta.addEventListener('click', (e) => {
        if (estado !== 'parado' || !enAnillo(e)) return; // El centro sigue llevando a itch.io
        e.preventDefault();
        empezar();
    });
    tarjeta.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse' && estado === 'parado') bocadillo.hidden = !enAnillo(e);
    });
    tarjeta.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') bocadillo.hidden = true;
    });
    if (sinRaton) bocadillo.hidden = false;
}
