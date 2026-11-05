// src/i18n/obras.ts
// Traducción al inglés de los textos de las obras (títulos, descripciones, categorías) y de los títulos de las
// colecciones. Las obras se escriben en español en src/data/; aquí, cada frase con su traducción. Los nombres
// propios (personajes, juegos) no hace falta ponerlos: se quedan igual.
// Al añadir una obra con un texto nuevo en español, hay que añadir aquí su traducción: si falta, en la versión
// en inglés sale en español y la compilación avisa.
import type { Idioma } from './idioma';

const FRASES: Record<string, string> = {
    // Títulos
    'Animación de broma': 'Joke animation',
    'Animación de Personaje': 'Character animation',
    'Animación de Personaje Correr': 'Character run animation',
    'Animación de Personaje Idle': 'Character idle animation',
    'Animación para Jam': 'Jam animation',
    'Animación y Nodos de Geometría': 'Animation and Geometry Nodes',
    'Animación y VFX': 'Animation and VFX',
    'Ataque Personaje Principal': 'Main character attack',
    'Animación de inicio': 'Intro animation',
    'Animación de inicio: ataque': 'Intro animation: attack',
    'Armas': 'Weapons',
    'Bala enemiga': 'Enemy bullet',
    'Ballena': 'Whale',
    'Combate': 'Combat',
    'Diálogo con el demonio': 'Talking to the demon',
    'Dragón dando vueltas': 'Dragon spinning',
    'Dragón mordiéndose la cola': 'Dragon biting its tail',
    'Enemigos': 'Enemies',
    'Escena del coche (tutorial)': 'Car scene (tutorial)',
    'Escenas del coche': 'Car scenes',
    'Exploración': 'Exploration',
    'Final': 'Ending',
    'Fondo animado': 'Animated background',
    'Jefe final': 'Final boss',
    'Llegada y combate': 'Arrival and combat',
    'Menú y selección de nivel': 'Menu and level select',
    'Oleada 7': 'Wave 7',
    'Primera oleada': 'First wave',
    'Protagonista': 'Main character',
    'Recuperar las piezas': 'Recovering the pieces',
    'Robo de galletas': 'Cookie theft',
    'Secuencias': 'Cutscenes',
    'Tienda y estadísticas': 'Shop and stats',
    'Transformación en sangre': 'Blood transformation',
    'Transición del fondo': 'Background transition',
    'Correr Personaje Principal': 'Main character run',
    'Dragón': 'Dragon',
    'Enemigos para Jam': 'Jam enemies',
    'Escena de contexto para juego': 'Story scene for the game',
    'Escena intermedia del coche': 'Car cutscene',
    'Fondo para Jam': 'Jam background',
    'Fondo para uso personal': 'Background for personal use',
    'Habilidad/VFX': 'Ability/VFX',
    'Habitación Isométrica': 'Isometric room',
    'Idle Personaje Principal': 'Main character idle',
    'Material estilo Arcane': 'Arcane-style material',
    'Material estilo comic': 'Comic-style material',
    'Material estilo cristal': 'Crystal-style material',
    'Material y Nodos de Geometría': 'Material and Geometry Nodes',
    'Personaje de broma': 'Joke character',
    'Personaje estilo anime': 'Anime-style character',
    'Post-procesado': 'Post-processing',
    'Primeros modelos': 'First models',
    'Primeros pasos en la animación': 'First steps in animation',
    'Rana': 'Frog',
    'Saltar Personaje Principal': 'Main character jump',
    'Stomp e Inception': 'Stomp and Inception',
    'Transformación Personaje Principal': 'Main character transformation',
    // Descripciones
    'Animación de personaje': 'Character animation',
    'Enemigo de Neorb': 'Neorb enemy',
    'Escenario': 'Environment',
    'Escenario (inspirado en una imagen de Pinterest)': 'Environment (inspired by a Pinterest image)',
    'Escenario y Animación': 'Environment and animation',
    'Escenario y ciclo': 'Environment and loop',
    'Gameplay de BloodRunner': 'BloodRunner gameplay',
    'Gameplay de Hells Gamble': 'Hells Gamble gameplay',
    'Gameplay de Neorb': 'Neorb gameplay',
    'Gameplay de OuroJam': 'OuroJam gameplay',
    'Grafo de nodos': 'Node graph',
    'Hoja de sprites': 'Sprite sheet',
    'Materiales': 'Materials',
    'Materiales + Modelado': 'Materials + Modeling',
    'Modelado': 'Modeling',
    'Personaje': 'Character',
    'Personaje (Silueta calcada del hero portrait)': 'Character (silhouette traced from the hero portrait)',
    'Personajes y Animación': 'Characters and animation',
    'Procedural + Materiales': 'Procedural + Materials',
    'Tiles del nivel': 'Level tiles',
    'Topología': 'Topology',
    // Secciones de las fichas de proyecto
    'Hojas de sprites': 'Sprite sheets',
    'Cada tarjeta reproduce las animaciones desde su hoja, tal y como se exportó para el juego. Debajo puedes pausarlas, verlas fotograma a fotograma, cambiar la velocidad y activar el papel cebolla. Púlsala para ver la hoja entera.':
        'Each card plays the animations straight from its sheet, exactly as it was exported for the game. Below it you can pause them, step through them frame by frame, change the speed and turn on onion skinning. Click it to see the whole sheet.',
    // Títulos de colecciones
    'Animación': 'Animation',
    'Otros': 'Other',
    'Personajes': 'Characters',
    'Personales': 'Personal',
};

// Palabras de las categorías (las categorías se quedan en español en los datos: los filtros las buscan así)
const CATEGORIAS: Record<string, string> = {
    Personaje: 'Character',
    Animacion: 'Animation',
    'Animación': 'Animation',
    Escenario: 'Environment',
    Modelado: 'Modeling',
    Materiales: 'Materials',
};

// Lo que parece español, para avisar de las frases sin traducir (los nombres propios no)
const PARECE_ESPANOL = /[áéíóúñ¿¡]|\b(de|del|para|con|y|el|la|los|las)\b|\b(personaje|escenario|fondo|animaci)/i;
const avisadas = new Set<string>();

export const traducir = (texto: string, idioma: Idioma) => {
    if (idioma === 'es') return texto;
    const traduccion = FRASES[texto];
    if (traduccion) return traduccion;
    if (PARECE_ESPANOL.test(texto) && !avisadas.has(texto)) {
        avisadas.add(texto);
        console.warn(`[i18n] Falta la traducción al inglés de "${texto}" (src/i18n/obras.ts)`);
    }
    return texto;
};

// "Personaje Animacion Marvel Rivals" -> "Personaje · Animación · Marvel Rivals" (o en inglés)
export const etiquetas = (categoria: string, idioma: Idioma) => categoria
    .replace('Marvel Rivals', 'Marvel Rivals')
    .split(' ')
    .filter(Boolean)
    .map((palabra) => (idioma === 'en' ? CATEGORIAS[palabra] ?? palabra : palabra === 'Animacion' ? 'Animación' : palabra))
    .join(' · ');
