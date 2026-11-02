// Devuelve al azar las clases de uno de los marcos vegetales (ver .marco-vegetal / .marco-ajolote en global.css).
// El marco vegetal puede llevar además la enredadera animada en un borde lateral (nunca en los dos);
// el del ajolote no, porque ya trae su propia enredadera colgando.
// Se decide al generar la página: con `astro dev` cambia en cada recarga y en la web publicada en cada build.
// conTexto: para tarjetas con texto, solo el borde, sin enredaderas ni la decoración de las esquinas
// (.marco-con-texto en global.css), para que no tape lo que hay dentro.
const ENREDADERAS = ['', ' enredadera-izq', ' enredadera-der'];

export const marcoAleatorio = ({ conTexto = false } = {}) => {
    if (conTexto) return (Math.random() < 0.5 ? 'marco-ajolote' : 'marco-vegetal') + ' marco-con-texto';
    if (Math.random() < 0.5) return 'marco-ajolote';
    return 'marco-vegetal' + ENREDADERAS[Math.floor(Math.random() * ENREDADERAS.length)];
};
