// Utilidades para GIF animados.
//
// El navegador comparte la animación entre todas las imágenes con la misma URL: si un GIF ya se ha
// reproducido, otra imagen con la misma URL lo muestra ya terminado (o a mitad). Para que una animación
// empiece desde el primer fotograma hay que darle una URL nueva: una copia propia (URL blob:) del archivo,
// que se descarga una sola vez.

const descargas = new Map<string, Promise<Blob | null>>();

export const descargar = (url: string) => {
    if (!descargas.has(url)) descargas.set(url, fetch(url).then((r) => (r.ok ? r.blob() : null)).catch(() => null));
    return descargas.get(url)!;
};

export const copiaPropia = async (url?: string) => {
    if (!url) return null;
    const blob = await descargar(url);
    return blob && URL.createObjectURL(blob);
};

// Duración total de un GIF en ms (la suma de los tiempos de sus fotogramas), leída de sus bloques
export const duracionGif = async (url: string) => {
    const blob = await descargar(url);
    if (!blob) return 0;
    const b = new Uint8Array(await blob.arrayBuffer());
    const saltarSubbloques = (i: number) => {
        while (b[i]) i += b[i] + 1;
        return i + 1;
    };

    let i = 13 + (b[10] & 0x80 ? 3 * 2 ** ((b[10] & 7) + 1) : 0); // Cabecera + paleta global
    let total = 0;
    while (i < b.length && b[i] !== 0x3b) {
        if (b[i] === 0x21) {
            if (b[i + 1] === 0xf9) total += (b[i + 4] | (b[i + 5] << 8)) * 10; // Control gráfico: retardo en centésimas
            i = saltarSubbloques(i + 2);
        } else if (b[i] === 0x2c) {
            const paleta = b[i + 9] & 0x80 ? 3 * 2 ** ((b[i + 9] & 7) + 1) : 0;
            i = saltarSubbloques(i + 10 + paleta + 1); // Descriptor + paleta local + tamaño mínimo LZW
        } else {
            break; // Bloque desconocido: GIF raro
        }
    }
    return total;
};
