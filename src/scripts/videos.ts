// Vídeos de las tarjetas (video[data-video]): no se descargan ni se reproducen hasta que están cerca de la
// pantalla, y se pausan al salir de ella. Así no descargan nada los de la vista que está oculta ("Todos" o
// "Colecciones") ni las copias de los carruseles que aún no han entrado; cada obra puede estar repetida
// varias veces en la página y, sin esto, cada copia bajaría el vídeo entero.

const observador = new IntersectionObserver((entradas) => {
    for (const { target, isIntersecting } of entradas) {
        const video = target as HTMLVideoElement;
        if (isIntersecting) {
            if (!video.getAttribute('src')) video.src = video.dataset.video!;
            video.play().catch(() => {}); // Si el navegador no deja reproducir, se queda en el primer fotograma
        } else {
            video.pause();
        }
    }
}, { rootMargin: '200px' });

document.querySelectorAll<HTMLVideoElement>('video[data-video]').forEach((video) => observador.observe(video));
