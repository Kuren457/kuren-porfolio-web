// Galerías de pixel art y 3D: botones de filtro, cambio entre la vista "Colecciones" (carruseles) y "Todos"
// (columnas), y el lightbox con zoom.
//
// Marcado que espera la página:
//  - #filtros con data-activo (clases del botón activo) y botones .filter-btn[data-filter]
//      data-filter="Colecciones" muestra los carruseles; "All" todas las obras; cualquier otro, las de esa categoría
//  - #colecciones (los carruseles) y #galeria-todos (las columnas); cada grupo de tarjetas lleva [data-galeria]
//  - el lightbox: #lightbox, #lightbox-img, #lightbox-video, #lightbox-close/prev/next, #zoom-in/out/reset

// --- FILTROS Y VISTAS ---
const filtros = document.getElementById('filtros');
const colecciones = document.getElementById('colecciones');
const todos = document.getElementById('galeria-todos');
const botonesFiltro = document.querySelectorAll<HTMLElement>('.filter-btn');
const clasesActivo = filtros?.dataset.activo?.split(' ') ?? [];
const clasesInactivo = ['bg-[#0a0508]', 'border', 'border-white/20', 'text-[#cbd5e1]'];

botonesFiltro.forEach((boton) => {
    boton.addEventListener('click', () => {
        botonesFiltro.forEach((b) => {
            b.classList.remove(...clasesActivo);
            b.classList.add(...clasesInactivo);
        });
        boton.classList.remove(...clasesInactivo);
        boton.classList.add(...clasesActivo);

        const filtro = boton.dataset.filter ?? 'All';
        const verColecciones = filtro === 'Colecciones';
        colecciones?.classList.toggle('hidden', !verColecciones);
        todos?.classList.toggle('hidden', verColecciones);
        if (verColecciones) return;

        todos?.querySelectorAll<HTMLElement>('.gallery-item').forEach((tarjeta) => {
            const categorias = tarjeta.dataset.category ?? '';
            if (filtro === 'All' || categorias.includes(filtro)) {
                tarjeta.classList.remove('hidden');
                // Un pequeño retraso para que la entrada en las columnas no sea brusca
                setTimeout(() => (tarjeta.style.opacity = '1'), 50);
            } else {
                tarjeta.style.opacity = '0';
                setTimeout(() => tarjeta.classList.add('hidden'), 300);
            }
        });
    });
});

// --- LIGHTBOX ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement | null;
const lightboxVideo = document.getElementById('lightbox-video') as HTMLVideoElement | null;
const closeBtn = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');

// Las obras que recorren las flechas: las del grupo desde el que se abrió (un carrusel, o las columnas
// con su filtro), sin las copias de los carruseles ni las ocultas
let lista: string[] = [];
let currentIndex = 0;
let currentZoom = 1; // 1 = 100% (Tamaño original)

if (lightbox && lightboxImg && lightboxVideo) {

    // --- FUNCIONES DE ZOOM ---

    // Aplica el nivel de zoom actual a la imagen o vídeo
    const applyZoom = () => {
        lightboxImg.style.transform = `scale(${currentZoom})`;
        lightboxVideo.style.transform = `scale(${currentZoom})`;
        if (zoomResetBtn) zoomResetBtn.innerText = `${Math.round(currentZoom * 10) / 10}x`;
    };

    // Resetea el zoom al estado original al cambiar de foto o cerrar
    const resetZoom = () => {
        currentZoom = 1;
        lightboxImg.style.transform = '';
        lightboxVideo.style.transform = '';
        if (zoomResetBtn) zoomResetBtn.innerText = '1x';
        lightboxImg.classList.add('scale-100');
        lightboxVideo.classList.add('scale-100');
    };

    // Zoom con la rueda del ratón
    lightbox.addEventListener('wheel', (e) => {
        if (!lightbox.classList.contains('hidden')) {
            e.preventDefault(); // Evita que la web haga scroll por detrás
            if (e.deltaY < 0) {
                currentZoom = Math.min(currentZoom + 0.25, 4); // Límite máximo: 4x
            } else {
                currentZoom = Math.max(currentZoom - 0.25, 0.5); // Límite mínimo: 0.5x
            }
            applyZoom();
        }
    });

    // Zoom con los botones de la interfaz
    zoomInBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentZoom = Math.min(currentZoom + 0.5, 4);
        applyZoom();
    });

    zoomOutBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentZoom = Math.max(currentZoom - 0.5, 0.5);
        applyZoom();
    });

    zoomResetBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
    });

    // --- ZOOM TÁCTIL (MÓVILES) ---
    let initialDistance = 0;
    let initialZoom = 1;

    lightbox.addEventListener('touchstart', (e) => {
        // Si el usuario toca la pantalla exactamente con dos dedos
        if (e.touches.length === 2 && !lightbox.classList.contains('hidden')) {
            // Distancia inicial entre los dedos
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialZoom = currentZoom;
        }
    });

    lightbox.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && !lightbox.classList.contains('hidden')) {
            e.preventDefault(); // Bloquea el zoom nativo del navegador móvil
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            // Si los dedos se alejan aumenta, si se juntan disminuye
            const zoomFactor = currentDistance / initialDistance;
            currentZoom = Math.min(Math.max(initialZoom * zoomFactor, 0.5), 4);
            applyZoom();
        }
    }, { passive: false }); // Permite que funcione el preventDefault() en touchmove

    // --- GALERÍA Y MULTIMEDIA ---

    // Carga el archivo y decide si debe usar <img> o <video>
    const showMedia = (index: number) => {
        const src = lista[index];
        if (!src) return;
        resetZoom();

        if (src.endsWith('.webm') || src.endsWith('.mp4')) {
            lightboxImg.classList.add('hidden');
            lightboxImg.src = '';
            lightboxVideo.src = src;
            lightboxVideo.classList.remove('hidden');
            lightboxVideo.play();
        } else {
            lightboxVideo.classList.add('hidden');
            lightboxVideo.pause();
            lightboxVideo.src = '';
            lightboxImg.src = src;
            lightboxImg.classList.remove('hidden');
        }
    };

    // Abrir el modal al hacer click en una tarjeta (con delegación: vale para los carruseles y las columnas)
    document.addEventListener('click', (e) => {
        const tarjeta = (e.target as Element).closest<HTMLElement>('.lightbox-trigger');
        if (!tarjeta) return;

        const grupo = tarjeta.closest('[data-galeria]') ?? document;
        lista = [...grupo.querySelectorAll<HTMLElement>('.lightbox-trigger:not([data-copia]):not(.hidden)')]
            .map((t) => t.dataset.src!);
        currentIndex = Math.max(lista.indexOf(tarjeta.dataset.src!), 0);
        showMedia(currentIndex);

        lightbox.classList.remove('hidden');
        setTimeout(() => {
            lightbox.classList.remove('opacity-0');
            lightboxImg.classList.remove('scale-95');
            lightboxVideo.classList.remove('scale-95');
            lightboxImg.classList.add('scale-100');
            lightboxVideo.classList.add('scale-100');
        }, 10);

        document.body.style.overflow = 'hidden'; // Evita scroll en la página de fondo
    });

    // Anterior / Siguiente
    const goNext = () => {
        currentIndex = (currentIndex + 1) % lista.length;
        showMedia(currentIndex);
    };

    const goPrev = () => {
        currentIndex = (currentIndex - 1 + lista.length) % lista.length;
        showMedia(currentIndex);
    };

    nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
    prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });

    // Cerrar el modal
    const closeLightbox = () => {
        resetZoom();
        lightbox.classList.add('opacity-0');
        lightboxImg.classList.remove('scale-100');
        lightboxVideo.classList.remove('scale-100');
        lightboxImg.classList.add('scale-95');
        lightboxVideo.classList.add('scale-95');

        // Retraso para dejar que la transición visual termine
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
            lightboxVideo.src = '';
            document.body.style.overflow = ''; // Devuelve el scroll a la página
        }, 300);
    };

    // Cerrar al hacer click en la X o en el fondo oscuro
    closeBtn?.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('hidden')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === '+') { currentZoom = Math.min(currentZoom + 0.5, 4); applyZoom(); }
            if (e.key === '-') { currentZoom = Math.max(currentZoom - 0.5, 0.5); applyZoom(); }
        }
    });
}
