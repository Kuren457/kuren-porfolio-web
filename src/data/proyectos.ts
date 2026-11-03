// src/data/proyectos.ts
// Los proyectos (en la portada, una fila cada uno: tarjeta, vista previa y mini carrusel con sus obras; y cada uno
// con su ficha en /proyectos/<slug>, src/pages/proyectos/[slug].astro) y el carrusel de trabajos personales.
import { obras } from './pixelArt';
import { timelapseDe } from './timelapses';
import type { Obra } from './tipos';
import type { Idioma } from '../i18n/idioma';
import type { Hoja } from '../utils/hojas';
import { postProceso, type Breakdown } from './materiales';

// Una sección de obras de la ficha de un proyecto (p. ej. hojas de sprites, turntables, wireframes, materiales)
export interface Seccion {
    titulo: string;
    descripcion?: string;
    obras: Obra[];
}

// Un paso del proceso de un proyecto (cómo lo hice), en la ficha
export interface Paso {
    titulo: string;
    texto: string;
}

export interface Proyecto {
    slug: string;           // Dirección de su ficha: /proyectos/<slug>
    nombre: string;
    descripcion: string;    // Resumen de una frase (vista previa de la portada y cabecera de la ficha)
    rol: string;
    equipo?: string;
    plazo?: string;
    tareas: string[];       // Lo que hice, en la ficha
    proceso?: Paso[];       // Cómo lo hice: decisiones y problemas, en la ficha
    herramientas: string;
    enlace: string;         // El juego en itch.io
    logo: string;
    logoPixelado?: boolean; // El logo es pixel art pequeño y se amplía sin suavizar
    logoAncho?: number;     // Ancho del logo en px (en pixel art, un múltiplo de su tamaño a 1x para que se vea nítido)
    marco?: string;         // Marco propio que envuelve la tarjeta en vez del vegetal (64x64 a 1x; puede ser un GIF)
    marcoIntro?: string;    // GIF que dibuja el marco al aparecer la tarjeta (solo con todas las animaciones)
    decoracion?: string;    // Decoraciones fijas encima del marco...
    decoracionIntro?: string; // ...y el GIF que las dibuja al aparecer (también en el modo suave)
    fondo?: string;         // Máscara del fondo oscuro con la forma del hueco del marco (sin ella, un cuadrado)
    persecucion?: boolean;  // El demonio persigue a la galleta alrededor de la tarjeta (Persecucion.astro)
    omega?: boolean;        // Omega llega en coche a la tarjeta y espera su brazo (Omega.astro)
    serpiente?: boolean;    // Al pulsar el anillo del marco, el dragón se juega como una serpiente (Ouro.astro)
    color: 'rojo' | 'naranja' | 'dorado' | 'cian'; // Del borde de las tarjetas de su ficha (.marco-<color>, scripts/marcos-vegetales.mjs)
    obras: Obra[];          // Mini carrusel de la portada y "Arte del juego" de la ficha (las de categoría
                            // Gameplay van aparte, en "Gameplay")
    secciones?: Seccion[];  // Más secciones de la ficha, entre el arte y el gameplay
    breakdowns?: Breakdown[]; // Breakdowns de sus materiales (src/data/materiales.ts), antes de las secciones
    // Los textos en inglés (la versión en /en/); los títulos de las secciones se traducen en src/i18n/obras.ts
    en: Pick<Proyecto, 'descripcion' | 'rol' | 'equipo' | 'plazo' | 'tareas' | 'proceso'>;
}

// El proyecto con sus textos en el idioma de la página
export const enIdioma = (proyecto: Proyecto, idioma: Idioma): Proyecto =>
    idioma === 'en' ? { ...proyecto, ...proyecto.en } : proyecto;

const UI = '/Pixel-art/UI Elements/';

const deTema = (...temas: string[]) => obras.filter((obra) => obra.tema && temas.includes(obra.tema));

// Clips de gameplay, en public/Pixel-art/Clips/ (recomprimidos y sin sonido; los originales, en fuentes/Clips/).
// Ancho y alto, los del vídeo
const clip = (archivo: string, title: string, tema: Obra['tema'], juego: string, ancho = 1920, alto = 1080): Obra =>
    ({ src: '/Pixel-art/Clips/' + archivo, ancho, alto, category: 'Gameplay', title, description: `Gameplay de ${juego}`, tema });

// Showcases de los enemigos de Neorb, en public/Pixel-art/Showcase/ (recomprimidos y sin sonido; los originales, en
// fuentes/Showcase/). Ancho y alto, los del vídeo
const showcase = (enemigo: string, ancho: number, alto: number): Obra =>
    ({ src: `/Pixel-art/Showcase/Neorb_${enemigo}_Showcase.mp4`, ancho, alto, category: 'Modelado Animacion', title: enemigo, description: 'Enemigo de Neorb', tema: 'blender' });

// Hojas de sprites, en public/Pixel-art/Spritesheets/ (ver Hoja en src/utils/hojas.ts)
const hoja = (archivo: string, title: string, tema: Obra['tema'], datos: Hoja): Obra =>
    ({ src: '/Pixel-art/Spritesheets/' + archivo, category: 'Animacion', title, description: 'Hoja de sprites', tema, hoja: datos });

const HOJAS = 'Hojas de sprites';
const HOJAS_DESCRIPCION = 'Cada tarjeta reproduce las animaciones desde su hoja, tal y como se exportó para el juego. Púlsala para ver la hoja entera.';

export const proyectos: Proyecto[] = [
    {
        slug: 'bloodrunner',
        nombre: 'BloodRunner',
        descripcion: 'Dirigí el arte del juego y animé al protagonista, al boss y las secuencias.',
        rol: 'Lead pixel artist',
        equipo: '5 personas',
        plazo: 'Unos 2 meses',
        tareas: [
            'Dirección artística: coordinar el arte y mantener la coherencia visual de todo el proyecto',
            'Diseño y animación del personaje principal',
            'Secuencias animadas',
            'Boss',
            'Props',
            'VFX',
            'UI',
            'Sonido: mezclas propias a partir de sonidos de Freesound',
        ],
        proceso: [
            {
                titulo: 'Coherencia en un equipo de 5',
                texto: 'Establecí una paleta general que todo el equipo debía seguir, y cada semana hacíamos una reunión en la que todos presentaban su trabajo para darnos feedback y ayudarnos con lo que hiciera falta.',
            },
            {
                titulo: 'La transformación en sangre',
                texto: 'La primera idea era que el personaje se derritiera en sangre, pero para que encajara con el gameplay habría que dibujar una versión de cada fotograma de cada animación. La replanteé como una cortina de sangre que rodea al personaje y lo envuelve por completo, inspirada en las manos corruptas de Zelda: Breath of the Wild. Así se reproduce encima de cualquier animación.',
            },
            {
                titulo: 'Lo que salió mal y cómo lo sacamos',
                texto: 'La inexperiencia del grupo y algo de falta de comunicación hicieron que no llegáramos a todo lo que queríamos, pero con un esfuerzo extra al final y manteniendo la calma sacamos un juego jugable. Algunos sprites no seguían la paleta, así que los recoloreamos para mantener la coherencia y la armonía del juego.',
            },
        ],
        en: {
            proceso: [
                {
                    titulo: 'Consistency in a team of 5',
                    texto: 'I set a general palette the whole team had to follow, and every week we held a meeting where everyone showed their work, so we could give each other feedback and help wherever it was needed.',
                },
                {
                    titulo: 'The blood transformation',
                    texto: 'The first idea was for the character to melt into blood, but to fit the gameplay that meant drawing a version of every frame of every animation. I redesigned it as a curtain of blood that circles the character and wraps them completely, inspired by the corrupted hands in Zelda: Breath of the Wild. That way it plays on top of any animation.',
                },
                {
                    titulo: 'What went wrong and how we got through it',
                    texto: "The team's inexperience and some lack of communication meant we didn't get to everything we wanted, but with an extra push at the end and by keeping calm we shipped a playable game. Some sprites didn't follow the palette, so we recolored them to keep the game consistent and harmonious.",
                },
            ],
            descripcion: "I led the game's art and animated the protagonist, the boss and the cutscenes.",
            rol: 'Lead pixel artist',
            equipo: '5 people',
            plazo: 'About 2 months',
            tareas: [
                'Art direction: coordinating the art and keeping the whole project visually consistent',
                'Main character design and animation',
                'Animated cutscenes',
                'Boss',
                'Props',
                'VFX',
                'UI',
                'Sound: my own mixes built from Freesound samples',
            ],
        },
        herramientas: 'Godot & Aseprite',
        enlace: 'https://abelirre.itch.io/bloodrunner',
        logo: '/Logos/BloodRunnerLogo.png',
        color: 'rojo',
        marco: UI + 'MarcoBR.png',
        fondo: UI + 'MarcoBR_fondo.png',
        omega: true,
        obras: [
            ...deTema('bloodrunner'),
            // Sacados del tráiler (fuentes/Clips/Trailer_BloodRunner.mp4), sin los rótulos
            clip('Clip_1_BloodRunner.mp4', 'Llegada y combate', 'bloodrunner', 'BloodRunner'),
            clip('Clip_2_BloodRunner.mp4', 'Transformación en sangre', 'bloodrunner', 'BloodRunner'),
            clip('Clip_3_BloodRunner.mp4', 'Combate', 'bloodrunner', 'BloodRunner'),
            clip('Clip_4_BloodRunner.mp4', 'Exploración', 'bloodrunner', 'BloodRunner'),
            clip('Clip_5_BloodRunner.mp4', 'Secuencias', 'bloodrunner', 'BloodRunner'),
        ],
        secciones: [{
            titulo: HOJAS,
            descripcion: HOJAS_DESCRIPCION,
            obras: [
                // En estas hojas cada fila lleva su nombre escrito después del último fotograma. En la del
                // protagonista, los ataques cuerpo a cuerpo son de 96 px de ancho
                hoja('BloodRunner/Personaje_entero-Sheet.png', 'Protagonista', 'bloodrunner', { celda: [48, 48], fotogramas: [7, 8, 6, 9, 7, 12, 10, [5, 96], [5, 96], 5, 5, 5, 6, 5, 14, 8, 2] }),
                hoja('BloodRunner/Coche_Sheet_Completa.png', 'Escenas del coche', 'bloodrunner', { celda: [272, 104], fotogramas: [12, 12, 12, 12, 12, 15, 7] }),
                hoja('BloodRunner/Escena_Coche1_Tuto-Sheet.png', 'Escena del coche (tutorial)', 'bloodrunner', { celda: [272, 104] }),
                hoja('BloodRunner/Boss-Sheet.png', 'Jefe final', 'bloodrunner', { celda: [64, 64], fotogramas: [4, 8] }),
                hoja('BloodRunner/Bala_Enemigo-Sheet.png', 'Bala enemiga', 'bloodrunner', { celda: [48, 48], fotogramas: [5, 5] }),
            ],
        }],
    },
    {
        slug: 'ourojam',
        nombre: 'OuroJam',
        descripcion: 'Todo el arte del juego en 3 días: personaje, tiles, fondos, UI y secuencias.',
        rol: 'Lead artist (todo el arte)',
        equipo: '2 personas',
        plazo: '3 días (game jam)',
        tareas: [
            'Todo el arte del juego',
            'Diseño y animación del personaje principal',
            'Secuencias animadas',
            'Tiles',
            'Props',
            'Fondos',
            'UI',
            'Sonido: mezclas propias a partir de sonidos de Freesound',
        ],
        proceso: [
            {
                titulo: 'Prioridades en 3 días',
                texto: 'La jam empezó por la tarde y el primer día se fue en decidir la idea. A partir de ahí fui a lo imprescindible: primero el protagonista y sus animaciones; después el objetivo del juego, el entorno (tiles y fondo), las secuencias que cuentan la historia y, por último, los menús. Las últimas horas las dediqué a montar con sprites y secuencias una página de itch.io llamativa.',
            },
            {
                titulo: 'Un dragón por piezas',
                texto: 'Primero diseñé el dragón entero para tener clara la idea del personaje. Después lo separé en piezas de 16×16 que encajan entre sí como tiles, y probé todas las combinaciones de movimiento para tener las piezas necesarias en cualquier giro de la serpiente.',
            },
        ],
        en: {
            proceso: [
                {
                    titulo: 'Priorities in 3 days',
                    texto: 'The jam started in the afternoon and the first day went into deciding the idea. From there I focused on the essentials: first the main character and their animations; then the game goal, the environment (tiles and background), the cutscenes that tell the story and, last, the menus. I spent the final hours building an eye-catching itch.io page from sprites and cutscenes.',
                },
                {
                    titulo: 'A dragon made of pieces',
                    texto: "I first designed the whole dragon to get a clear idea of the character. Then I split it into 16×16 pieces that fit together like tiles, and tested every movement combination so there's a piece for any turn the snake can make.",
                },
            ],
            descripcion: "All the game's art in 3 days: character, tiles, backgrounds, UI and cutscenes.",
            rol: 'Lead artist (all the art)',
            equipo: '2 people',
            plazo: '3 days (game jam)',
            tareas: [
                "All the game's art",
                'Main character design and animation',
                'Animated cutscenes',
                'Tiles',
                'Props',
                'Backgrounds',
                'UI',
                'Sound: my own mixes built from Freesound samples',
            ],
        },
        herramientas: 'Godot & Aseprite',
        enlace: 'https://kurenm.itch.io/ourojam',
        logo: UI + 'Wukong.png',
        color: 'naranja',
        logoPixelado: true,
        logoAncho: 128, // 64 px a 1x, a 2 px por píxel: llena el hueco del dragón
        marco: UI + 'Dar_vueltas_dragon_1x.gif',
        serpiente: true,
        obras: [
            ...deTema('ourojam'),
            clip('Clip_1_OuroJam.mp4', 'Animación de inicio', 'ourojam', 'OuroJam', 1896, 1076),
            clip('Clip_2_OuroJam.mp4', 'Recuperar las piezas', 'ourojam', 'OuroJam', 1912, 1082),
            clip('Clip_4_OuroJam.mp4', 'Menú y selección de nivel', 'ourojam', 'OuroJam', 1910, 1078),
            clip('Clip_3_OuroJam.mp4', 'Final', 'ourojam', 'OuroJam'),
        ],
        secciones: [{
            titulo: HOJAS,
            descripcion: HOJAS_DESCRIPCION,
            obras: [
                // Las celdas 35 y 36 son las máscaras en blanco y negro del corte, no fotogramas
                hoja('OuroJam/Animacion_principio_Attack-Sheet.png', 'Animación de inicio: ataque', 'ourojam', { celda: [512, 288], seguida: true, saltar: [35, 36] }),
                hoja('OuroJam/Animacion_principio-Sheet.png', 'Animación de inicio', 'ourojam', { celda: [512, 288] }),
                hoja('OuroJam/Fondo_chino-Sheet.png', 'Fondo animado', 'ourojam', { celda: [512, 288], fps: 8 }),
                hoja('OuroJam/Fondo_chino_transicion-Sheet.png', 'Transición del fondo', 'ourojam', { celda: [512, 288] }),
                hoja('OuroJam/Dar_vueltas_dragon_export-Sheet.png', 'Dragón dando vueltas', 'ourojam', { celda: [192, 192] }),
                hoja('OuroJam/Comerse_cola_anim_export-Sheet.png', 'Dragón mordiéndose la cola', 'ourojam', { celda: [192, 192] }),
                { src: '/Pixel-art/Spritesheets/OuroJam/Tiles.png', category: 'Escenario', title: 'Tileset', description: 'Tiles del nivel', tema: 'ourojam' },
            ],
        }],
    },
    {
        slug: 'hells-gamble',
        nombre: 'Hells Gamble',
        descripcion: 'Todo el arte del juego en una semana: personaje, enemigos, armas, tiles, fondos y UI.',
        rol: 'Lead artist (todo el arte)',
        equipo: '2 personas',
        plazo: '1 semana (game jam)',
        tareas: [
            'Todo el arte del juego',
            'Diseño y animación del personaje principal',
            'Enemigos',
            'Armas',
            'Secuencias animadas',
            'Tiles',
            'Props',
            'Fondos',
            'UI',
            'Sonido: mezclas propias a partir de sonidos de Freesound',
        ],
        proceso: [
            {
                titulo: 'Del casino al infierno',
                texto: 'La idea era convertir objetos típicos de un casino en demonios y fantasmas dignos del infierno. Busqué referencias de dados fantásticos, cartas del tarot, fantasmas y fichas para crear conceptos que mezclaran las dos cosas. El demonio principal salió de una referencia de Pinterest y de la idea de un crupier demoníaco.',
            },
            {
                titulo: 'Legibles entre cientos',
                texto: 'Con cientos de enemigos en pantalla, cada uno tiene una silueta única y su propia combinación de colores, muy distintiva, dentro de la paleta general. Así se distinguen de un vistazo.',
            },
        ],
        en: {
            proceso: [
                {
                    titulo: 'From casino to hell',
                    texto: 'The idea was to turn everyday casino objects into demons and ghosts worthy of hell. I gathered references of fantasy dice, tarot cards, ghosts and chips to create concepts that blended both. The main demon came from a Pinterest reference and the idea of a demonic croupier.',
                },
                {
                    titulo: 'Readable among hundreds',
                    texto: 'With hundreds of enemies on screen, each one has a unique silhouette and its own very distinctive color combination within the general palette, so they can be told apart at a glance.',
                },
            ],
            descripcion: "All the game's art in a week: character, enemies, weapons, tiles, backgrounds and UI.",
            rol: 'Lead artist (all the art)',
            equipo: '2 people',
            plazo: '1 week (game jam)',
            tareas: [
                "All the game's art",
                'Main character design and animation',
                'Enemies',
                'Weapons',
                'Animated cutscenes',
                'Tiles',
                'Props',
                'Backgrounds',
                'UI',
                'Sound: my own mixes built from Freesound samples',
            ],
        },
        herramientas: 'Godot & Aseprite',
        enlace: 'https://kurenm.itch.io/hells-gamble',
        logo: UI + 'LogoGambling.png',
        color: 'dorado',
        logoPixelado: true,
        persecucion: true,
        obras: [
            ...deTema('gambling'),
            clip('Clip_1_HellsGamble.mp4', 'Diálogo con el demonio', 'gambling', 'Hells Gamble', 1918, 1074),
            clip('Clip_3_HellsGamble.mp4', 'Primera oleada', 'gambling', 'Hells Gamble'),
            clip('Clip_4_HellsGamble.mp4', 'Oleada 7', 'gambling', 'Hells Gamble', 1280, 720),
            clip('Clip_2_HellsGamble.mp4', 'Tienda y estadísticas', 'gambling', 'Hells Gamble', 1920, 1078),
        ],
        secciones: [{
            titulo: HOJAS,
            descripcion: HOJAS_DESCRIPCION,
            obras: [
                hoja('HellsGamble/Personaje_Demon-Sheet.png', 'Protagonista', 'gambling', { celda: [32, 32], seguida: true }),
                hoja('HellsGamble/TodosEnemigos-Sheet.png', 'Enemigos', 'gambling', { celda: [128, 96], seguida: true }),
                hoja('HellsGamble/Armas-Sheet.png', 'Armas', 'gambling', { celda: [48, 48], seguida: true }),
                hoja('HellsGamble/Robar_Galletas-Sheet.png', 'Robo de galletas', 'gambling', { celda: [160, 90], seguida: true }),
            ],
        }],
    },
    {
        slug: 'neorb',
        nombre: 'Neorb',
        descripcion: 'Único artista del juego: concept, modelado, animación, escenario y materiales de post-procesado en Unreal.',
        rol: 'Lead artist 3D (único artista)',
        equipo: '2 personas',
        plazo: 'En desarrollo (desde marzo de 2026)',
        tareas: [
            'Todo el arte del juego',
            'Concept art',
            'Modelado de enemigos y props',
            'Entorno',
            'Animación',
            'Technical art: materiales de post-procesado en Unreal Engine',
            'UI',
            'Sonido: mezclas propias a partir de sonidos de Freesound',
        ],
        proceso: [
            {
                titulo: 'Por qué un post-procesado',
                texto: 'Probé muchas formas de conseguir el wireframe de neón: pintar las UVs a mano, duplicar las mallas con el wireframe encima, vertex colors… Todas costaban mucho tiempo, mucho rendimiento (dos mallas por objeto) o eran difíciles de ampliar. El post-procesado funciona con cualquier malla, hecha por nosotros o descargada, sin pasos extra. Y con el Custom Depth y el Stencil cada malla tiene su propio color, que además puede cambiar en el juego: los enemigos pasan de verde a amarillo y a rojo según su vida, sin necesidad de barra de vida.',
            },
            {
                titulo: 'La guerra de las líneas',
                texto: 'Las primeras versiones (UVs pintadas y vertex colors) dibujaban una línea en cada triángulo y sobrecargaban la escena. Además había pixel fighting, y las líneas lejanas parpadeaban de forma muy desagradable. Hasta llegar al material actual, el grosor y la presencia de las líneas fueron el mayor reto técnico.',
            },
            {
                titulo: 'Un flujo más simple',
                texto: 'Con el método antiguo, cada asset tenía que pasar por un script de Blender que pintaba sus vértices según la posición de sus UVs en un atlas de color antes de importarlo a Unreal. Con el post-procesado, enemigos, props y assets siguen el pipeline normal: se exportan en FBX y en Unreal se les aplican los materiales.',
            },
        ],
        en: {
            proceso: [
                {
                    titulo: 'Why a post-process',
                    texto: 'I tried many ways to get the neon wireframe: hand-painting the UVs, duplicating the meshes with a wireframe on top, vertex colors… They all took a lot of time, a lot of performance (two meshes per object) or were hard to extend. The post-process works on any mesh, whether we made it or downloaded it, with no extra steps. And with Custom Depth and Stencil each mesh gets its own color, which can also change in game: enemies go from green to yellow to red as they lose health, with no health bar needed.',
                },
                {
                    titulo: 'The battle of the lines',
                    texto: 'The first versions (painted UVs and vertex colors) drew a line on every triangle and overloaded the scene. There was also pixel fighting, and distant lines flickered badly. Until we reached the current material, the thickness and presence of the lines were the biggest technical challenge.',
                },
                {
                    titulo: 'A simpler pipeline',
                    texto: "With the old method, every asset had to go through a Blender script that painted its vertices based on where its UVs sat in a color atlas before it could be imported into Unreal. With the post-process, enemies, props and assets follow the normal pipeline: they're exported as FBX and the materials are applied in Unreal.",
                },
            ],
            descripcion: 'Sole artist on the game: concept, modeling, animation, environment and post-process materials in Unreal.',
            rol: 'Lead 3D artist (sole artist)',
            equipo: '2 people',
            plazo: 'In development (since March 2026)',
            tareas: [
                "All the game's art",
                'Concept art',
                'Enemy and prop modeling',
                'Environment',
                'Animation',
                'Technical art: post-process materials in Unreal Engine',
                'UI',
                'Sound: my own mixes built from Freesound samples',
            ],
        },
        herramientas: 'Unreal Engine & Blender',
        enlace: 'https://kurenm.itch.io/neorb',
        logo: '/Logos/NeorbLogo.png',
        color: 'cian',
        // Sin JS se ve el marco completo; con animaciones, el marco solo y encima las decoraciones
        marco: UI + 'MarcoNeorb_Solo.png',
        marcoIntro: UI + 'MarcoNeorb_Anim_1x.gif',
        decoracion: UI + 'MarcoNeorb_Decoraciones.png',
        decoracionIntro: UI + 'MarcoNeorb_Decorations_Anim_1x.gif',
        fondo: UI + 'MarcoNeorb_fondo.png',
        obras: [
            showcase('Frogger', 1350, 1080),
            showcase('Horse', 1350, 1080),
            showcase('Inception', 1080, 1920),
            showcase('Worm', 1440, 1080),
            // Fragmentos de gameplay (solo aquí, no en la galería 3D)
            { src: '/3D/Dash.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Dash', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/Intro.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Intro', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/StompAndInception.mp4', ancho: 1280, alto: 720, category: 'Gameplay', title: 'Stomp e Inception', description: 'Gameplay de Neorb', tema: 'blender' },
            { src: '/3D/Vines.mp4', ancho: 1920, alto: 1080, category: 'Gameplay', title: 'Vines', description: 'Gameplay de Neorb', tema: 'blender' },
        ],
        breakdowns: [postProceso],
        // Plantilla para documentar el 3D: cada sección sale en la ficha entre el arte y el gameplay (las imágenes
        // y vídeos, en public/3D/; los vídeos necesitan ancho y alto)
        // secciones: [
        //     {
        //         titulo: 'Personajes',
        //         descripcion: 'Turntables y wireframes de los enemigos.',
        //         obras: [
        //             { src: '/3D/Neorb/Rana_turntable.mp4', ancho: 1920, alto: 1080, category: 'Turntable', title: 'Rana', description: 'Turntable', tema: 'blender' },
        //             { src: '/3D/Neorb/Rana_wireframe.png', category: 'Wireframe', title: 'Rana', description: 'Topología', tema: 'blender' },
        //         ],
        //     },
        //     {
        //         titulo: 'Materiales',
        //         descripcion: 'Materiales de post-procesado en Unreal Engine: el grafo y el resultado.',
        //         obras: [
        //             { src: '/3D/Neorb/Material_grafo.png', category: 'Materiales', title: 'Post-procesado', description: 'Grafo de nodos', tema: 'blender' },
        //         ],
        //     },
        // ],
    },
];

// Mezcla las obras repartiendo cada tema a lo largo de toda la fila (en vez de todas las de un tema seguidas):
// cada obra se ordena por su posición relativa dentro de su tema
const repartir = (lista: Obra[]) => {
    const porTema = new Map<string | undefined, Obra[]>();
    lista.forEach((obra) => porTema.set(obra.tema, [...(porTema.get(obra.tema) ?? []), obra]));
    const posicion = (obra: Obra) => {
        const delTema = porTema.get(obra.tema)!;
        return (delTema.indexOf(obra) + 0.5) / delTema.length;
    };
    return [...lista].sort((a, b) => posicion(a) - posicion(b));
};

// De Marvel Rivals, en la portada solo estas (el resto se queda en la galería de pixel art)
const MARVEL_EN_PORTADA = ['Strange.gif', 'Psy.gif', 'Mantis.png', 'MagnetoP.png', 'MagikP.png', 'LunaSnow.png', 'Jubilee.png', 'JeffP.png']
    .map((archivo) => '/Pixel-art/' + archivo);

// Trabajos personales: todo lo que no es de un proyecto. Las que tienen timelapse lo reproducen al mantener
// el ratón encima
export const personales = repartir(deTema('marvel', 'og', 'tutorial', 'memes', 'valorant')
    .filter((obra) => obra.tema !== 'marvel' || MARVEL_EN_PORTADA.includes(obra.src)))
    .map((obra) => ({ ...obra, timelapse: timelapseDe(obra.src) }));
