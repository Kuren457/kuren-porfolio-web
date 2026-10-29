// Devuelve al azar las clases de uno de los marcos vegetales (ver .marco-vegetal / .marco-ajolote en global.css).
// El marco vegetal puede llevar además la enredadera animada en un borde lateral (nunca en los dos);
// el del ajolote no, porque ya trae su propia enredadera colgando.
// Se decide al generar la página: con `astro dev` cambia en cada recarga y en la web publicada en cada build.
const ENREDADERAS = ['', ' enredadera-izq', ' enredadera-der'];

export const marcoAleatorio = () => {
    if (Math.random() < 0.5) return 'marco-ajolote';
    return 'marco-vegetal' + ENREDADERAS[Math.floor(Math.random() * ENREDADERAS.length)];
};
