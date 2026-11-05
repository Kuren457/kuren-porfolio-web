// Reproduce un GIF en un canvas fotograma a fotograma (con ImageDecoder, del navegador), para poder cambiar la
// velocidad mientras suena sin que vuelva a empezar: un <img> con un GIF no lo permite. Los timelapses lo usan
// para acelerar al mantenerlos pulsados (src/scripts/timelapses.ts). Si el navegador no tiene ImageDecoder,
// soportado() es false y se sigue usando el <img>.
import { descargar, retrasosGif } from './gifs';

// Lo justo de ImageDecoder (no todas las versiones de TypeScript lo traen)
interface FotogramaDecodificado {
    image: CanvasImageSource & { displayWidth: number; displayHeight: number; close(): void };
}
interface Decodificador {
    tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } | null };
    decode(opciones: { frameIndex: number }): Promise<FotogramaDecodificado>;
}
type ConstructorDecodificador = new (opciones: { data: ArrayBuffer; type: string }) => Decodificador;
const ImageDecoder = (globalThis as unknown as { ImageDecoder?: ConstructorDecodificador }).ImageDecoder;

export const soportado = () => !!ImageDecoder;

export interface Reproductor {
    duracion: number;
    // Lo reproduce de principio a fin; termina antes si sigue() pasa a ser false. velocidad() se lee en cada
    // fotograma (1 = normal) y alAvanzar recibe la fracción reproducida (0 a 1)
    reproducir(opciones: { velocidad: () => number; sigue: () => boolean; alAvanzar: (fraccion: number) => void }): Promise<void>;
}

export const crearReproductor = async (url: string, lienzo: HTMLCanvasElement): Promise<Reproductor | null> => {
    const blob = await descargar(url);
    if (!blob || !ImageDecoder) return null;
    const decodificador = new ImageDecoder({ data: await blob.arrayBuffer(), type: 'image/gif' });
    await decodificador.tracks.ready;
    const retrasos = await retrasosGif(url);
    const total = Math.min(decodificador.tracks.selectedTrack?.frameCount ?? 0, retrasos.length);
    if (!total) return null;
    // Cuándo empieza cada fotograma (y al final, la duración total)
    const inicios = [0];
    for (let i = 0; i < total; i++) inicios.push(inicios[i] + retrasos[i]);
    const duracion = inicios[total];
    const contexto = lienzo.getContext('2d')!;

    const dibujar = async (indice: number) => {
        const { image } = await decodificador.decode({ frameIndex: indice });
        if (lienzo.width !== image.displayWidth || lienzo.height !== image.displayHeight) {
            lienzo.width = image.displayWidth;
            lienzo.height = image.displayHeight;
        }
        contexto.clearRect(0, 0, lienzo.width, lienzo.height);
        contexto.drawImage(image, 0, 0);
        image.close();
    };
    // El fotograma que toca en un momento dado (búsqueda binaria entre los inicios)
    const fotogramaEn = (ms: number) => {
        let bajo = 0;
        let alto = total - 1;
        while (bajo < alto) {
            const medio = (bajo + alto + 1) >> 1;
            if (inicios[medio] <= ms) bajo = medio;
            else alto = medio - 1;
        }
        return bajo;
    };

    return {
        duracion,
        reproducir: async ({ velocidad, sigue, alAvanzar }) => {
            await dibujar(0);
            let mostrado = 0;
            let posicion = 0;
            let anterior = performance.now();
            while (sigue() && posicion < duracion) {
                const ahora = await new Promise<number>((r) => requestAnimationFrame(r));
                posicion += (ahora - anterior) * velocidad();
                anterior = ahora;
                alAvanzar(Math.min(posicion / duracion, 1));
                const indice = fotogramaEn(Math.min(posicion, duracion - 1));
                // Si va muy rápido se salta fotogramas: solo se dibuja el que toca ahora
                if (indice !== mostrado) {
                    await dibujar(indice);
                    mostrado = indice;
                }
            }
        },
    };
};
