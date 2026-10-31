// Sonidos de las mascotas y la persecución

export const cargarSonido = (url?: string) => (url ? new Audio(url) : null);

// Reproduce desde el principio (si ya estaba sonando, vuelve a empezar)
export const sonar = (sonido: HTMLAudioElement | null) => {
    if (!sonido) return;
    sonido.currentTime = 0;
    sonido.play().catch(() => {});
};
