// src/data/tipos.ts
import type { Props as PropsTarjeta } from '../components/PixelCard.astro';

// Una obra de la galería: los datos de su tarjeta (sin las opciones de presentación)
export type Obra = Omit<PropsTarjeta, 'variante' | 'copia'>;

// Un carrusel de la vista "Colecciones": su título y qué obras incluye
export interface Coleccion {
    titulo: string;
    incluye: (obra: Obra) => boolean;
}
