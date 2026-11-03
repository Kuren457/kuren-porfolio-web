// src/data/materiales.ts
// Breakdowns de materiales (Breakdown.astro): cómo está hecho cada material, con las capturas de sus nodos y un pie
// de foto para cada una. Salen en la página 3D (comic, arcane, crystal), en la ficha de Neorb (postProceso) y en la
// sección de arte técnico de la portada (ArteTecnico.astro).
// Los archivos están en public/3D/Materials/; los originales pesados y los textos de partida, en fuentes/Materiales/.
//
// Los textos van en los dos idiomas. En los pies, cada línea es un párrafo; las que empiezan por "- " forman una
// lista y las que empiezan por "1. ", "2. "... una lista numerada.

export interface Texto {
    es: string;
    en: string;
}

export interface Figura {
    src: string;
    ampliada?: string;          // Lo que abre el visor en vez de src (la captura completa a resolución real)
    ancho?: number;             // Solo vídeos: ancho y alto en píxeles
    alto?: number;
    tema: 'blender' | 'unreal'; // El logo de la tarjeta: el programa en el que está hecho
    titulo: Texto;
    pie?: Texto;
}

export interface Breakdown {
    id: string;                 // Ancla en la página: #breakdown-<id>
    titulo: Texto;
    intro: Texto;
    portada: Figura[];          // El resultado: renders y vídeos, en fila
    portadaPie?: Texto;
    figuras: Figura[];          // Las capturas de los nodos, con su pie
}

const M = '/3D/Materials/';

export const postProceso: Breakdown = {
    id: 'post-proceso',
    titulo: { es: 'Post-procesado de Neorb', en: 'Neorb post-process' },
    intro: {
        es: 'Material de post-procesado en Unreal Engine que crea el look entero del juego: redibuja los bordes y las aristas de cada objeto como líneas de neón, con el color que le toca en la paleta del juego. Sin él se ven los materiales base: el suelo con el checker rojo y las montañas negras con emisivos blancos.',
        en: "Unreal Engine post-process material that creates the game's whole look: it redraws the outline and the edges of every object as neon lines, in the color assigned to it in the game palette. Without it you see the base materials: the red checker floor and the black mountains with white emissives.",
    },
    portada: [
        { src: M + 'Neorb/03_Secuencias/Frog_3-4_Cortinilla_AntesDespues.mp4', ancho: 1920, alto: 1080, tema: 'unreal', titulo: { es: 'Antes y después', en: 'Before and after' } },
        { src: M + 'Neorb/03_Secuencias/Frog_Giro360_Comparativa_Split.mp4', ancho: 1920, alto: 1080, tema: 'unreal', titulo: { es: 'Giro de 360°, sin y con post-procesado', en: '360° spin, without and with post-process' } },
    ],
    portadaPie: {
        es: 'Antes y después en las mismas tomas. En el «antes» solo se desactivan los materiales de post-proceso (r.PostProcessing.DisableMaterials 1): el PostProcessVolume no tiene más material que este, y el tonemapper y la exposición siguen activos. Todo lo que cambia es obra de este material.',
        en: 'Before and after in the same shots. The "before" only disables the post-process materials (r.PostProcessing.DisableMaterials 1): this is the only material in the PostProcessVolume, and the tonemapper and exposure stay on. Everything that changes comes from this material.',
    },
    figuras: [
        {
            src: M + 'Neorb/02_Frog_BeforeAfter/Frog_Perfil_Comparativa_Split.webp', tema: 'unreal',
            titulo: { es: 'Comparativa de perfil', en: 'Side view comparison' },
            pie: {
                es: 'La rana de perfil: a la izquierda sin el post-procesado, a la derecha con él. Cambia toda la escena, no solo la rana, porque el material crea el look entero del juego.',
                en: "The frog from the side: without the post-process on the left, with it on the right. The whole scene changes, not just the frog, because the material creates the game's entire look.",
            },
        },
        {
            src: M + 'Neorb/02_Frog_BeforeAfter/Frog_3-4_Comparativa_Lado_a_Lado.webp', tema: 'unreal',
            titulo: { es: 'Comparativa en tres cuartos', en: 'Three-quarter comparison' },
            pie: {
                es: 'La misma comparación en tres cuartos, lado a lado. Cada superficie con Custom Stencil se redibuja con líneas del color que le corresponde en la paleta.',
                en: 'The same comparison in three-quarter view, side by side. Every surface with a Custom Stencil is redrawn with lines in its palette color.',
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_MaterialEditor_Context.png', tema: 'unreal',
            titulo: { es: 'El material en Unreal', en: 'The material in Unreal' },
            pie: {
                es: 'M_PostProcess en el editor de materiales, con el dominio Post Process. Su instancia, MI_PostProcess, es el único material del PostProcessVolume.',
                en: 'M_PostProcess in the material editor, with the Post Process domain. Its instance, MI_PostProcess, is the only material in the PostProcessVolume.',
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_Overview_3840.png', ampliada: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_Full_1x.png', tema: 'unreal',
            titulo: { es: 'Vista general', en: 'Overview' },
            pie: {
                es: 'El grafo completo, en cuatro bloques:\n1. Detección de bordes sobre el Custom Depth.\n2. Controlador y paleta de color.\n3. Combinación.\n4. Máscara y salida.\nPúlsalo para verlo a resolución real.',
                en: 'The full graph, in four blocks:\n1. Edge detection on Custom Depth.\n2. Controller and color palette.\n3. Combination.\n4. Mask and output.\nClick it to see it at full resolution.',
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_01_EdgeDetection_CustomDepth.png', tema: 'unreal',
            titulo: { es: 'Detección de bordes', en: 'Edge detection' },
            pie: {
                es: 'Detección de bordes sobre el Custom Depth.\n- BlurSampleOffsets da cuatro direcciones: arriba, derecha, abajo e izquierda.\n- Cada una se multiplica por SceneTexelSize (el tamaño de un píxel) y por LineThickness, y se suma a las UV de pantalla.\n- Con esas UV desplazadas se lee el Custom Depth de los cuatro vecinos de cada píxel.\nLineThickness separa más o menos esas muestras, y con ello controla el grosor de las líneas.',
                en: 'Edge detection on Custom Depth.\n- BlurSampleOffsets provides four directions: up, right, down and left.\n- Each one is multiplied by SceneTexelSize (the size of a pixel) and by LineThickness, and added to the screen UVs.\n- Those offset UVs read the Custom Depth of the four neighbors of every pixel.\nLineThickness spreads those samples further apart or closer together, which sets the line thickness.',
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_02_Controller_StencilPalette.png', tema: 'unreal',
            titulo: { es: 'Controlador y paleta', en: 'Controller and palette' },
            pie: {
                es: 'Arriba, el controlador: el Custom Depth del propio píxel multiplicado por −4.\nAbajo, el color: el Custom Stencil de cada objeto se divide entre 64 y sirve de coordenada para leer una textura de paleta de 64 entradas, y Brightness ajusta su intensidad. Así cada objeto elige su color solo con su número de stencil, sin tocar el material.',
                en: "At the top, the controller: the pixel's own Custom Depth multiplied by −4.\nAt the bottom, the color: each object's Custom Stencil is divided by 64 and used as the coordinate to read a 64-entry palette texture, and Brightness sets its intensity. That way each object picks its color just with its stencil number, without touching the material.",
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_03_Combine.png', tema: 'unreal',
            titulo: { es: 'Combinación', en: 'Combination' },
            pie: {
                es: 'Las cuatro muestras vecinas se suman y, junto al controlador (−4 veces el centro), forman un laplaciano: vale 0 en las superficies lisas y se dispara en los bordes y en los cambios de ángulo entre caras. Saturate lo deja entre 0 y 1, y se multiplica por el color de la paleta para dar FinalColor.',
                en: 'The four neighbor samples are added together and, with the controller (−4 times the center), form a Laplacian: it is 0 on smooth surfaces and spikes on outlines and where the angle between faces changes. Saturate clamps it between 0 and 1, and it is multiplied by the palette color to give FinalColor.',
            },
        },
        {
            src: M + 'Neorb/01_PostProcess_Graph/M_PostProcess_Graph_04_StencilMask_Output.png', tema: 'unreal',
            titulo: { es: 'Máscara y salida', en: 'Mask and output' },
            pie: {
                es: 'La máscara final decide dónde se ven las líneas:\n- el Custom Stencil, recortado entre 0 y 1, solo deja pasar los objetos que tienen stencil;\n- un If compara el Scene Depth con el Custom Depth para aplicarlo solo donde el objeto es visible, y no a través de lo que lo tapa.\nUn Lerp mezcla la imagen original (PostProcessInput0) con FinalColor según esa máscara, y el resultado va a Emissive Color.',
                en: 'The final mask decides where the lines show:\n- the Custom Stencil, clamped between 0 and 1, only lets through objects that have a stencil;\n- an If compares Scene Depth with Custom Depth so the effect only applies where the object is visible, not through whatever covers it.\nA Lerp blends the original image (PostProcessInput0) with FinalColor using that mask, and the result goes to Emissive Color.',
            },
        },
    ],
};

export const crystal: Breakdown = {
    id: 'crystal',
    titulo: { es: 'Material Crystal', en: 'Crystal material' },
    intro: {
        es: 'Material para presentar modelos en sus showcases. El look se compone de tres partes: el material Crystal (color emisivo con transparencia tintada), un LineArt de Grease Pencil por encima y bloom en el compositor.',
        en: 'Material for presenting models in their showcases. The look is made of three parts: the Crystal material (emissive color with tinted transparency), a Grease Pencil LineArt on top, and bloom in the compositor.',
    },
    portada: [
        { src: '/3D/FrogCrystal.webm', ancho: 1080, alto: 1080, tema: 'blender', titulo: { es: 'Rana', en: 'Frog' } },
        { src: '/3D/Horse.webm', ancho: 1080, alto: 1080, tema: 'blender', titulo: { es: 'Caballo', en: 'Horse' } },
    ],
    figuras: [
        {
            src: M + 'Crystal/Crystal_01_Material.png', tema: 'blender',
            titulo: { es: 'El material', en: 'The material' },
            pie: {
                es: 'El material es un único grupo reutilizable que expone 18 parámetros: colores, opacidades y cantidades. Cada modelo tiene su paleta cambiando solo estos valores, sin tocar el grafo interno.',
                en: 'The material is a single reusable group that exposes 18 parameters: colors, opacities and amounts. Each model gets its own palette just by changing these values, without touching the inner graph.',
            },
        },
        {
            src: M + 'Crystal/Crystal_02_Grupo_General.png', ampliada: M + 'Crystal/Crystal_00_Grupo_Completo_HiRes.png', tema: 'blender',
            titulo: { es: 'Vista general', en: 'Overview' },
            pie: {
                es: 'Vista general del grupo. El color se construye en este orden:\n1. Color Variation crea la base facetada con formas internas.\n2. Gradient se superpone en Overlay.\n3. Las Cracks se suman en Color Dodge.\n4. Ambient Color cambia el tono según la reflexión.\n5. Light Reflections añade los brillos en Add.\nEl color final alimenta un Emission, que se mezcla con la transparencia de Transparency Color para dar el aspecto de cristal. Púlsala para ver el grupo completo a resolución real.',
                en: 'Overview of the group. The color is built in this order:\n1. Color Variation creates the faceted base with inner shapes.\n2. Gradient is layered on top in Overlay.\n3. The Cracks are added in Color Dodge.\n4. Ambient Color shifts the hue based on the reflection.\n5. Light Reflections adds the highlights in Add.\nThe final color feeds an Emission, which is mixed with the Transparency Color transparency to get the crystal look. Click it to see the full group at full resolution.',
            },
        },
        {
            src: M + 'Crystal/Crystal_03_Cracks.png', tema: 'blender',
            titulo: { es: 'Grietas', en: 'Cracks' },
            pie: {
                es: 'La diferencia entre dos Voronoi, uno F1 y otro Smooth F1, aísla los bordes de las celdas. Cracks Thickness ajusta su grosor y un Color Ramp constante las convierte en líneas nítidas. Usan coordenadas de cámara, así que se desplazan con el punto de vista, como si se vieran a través del cristal. Entran en la cadena con Color Dodge, controlado por Cracks Opacity.',
                en: 'The difference between two Voronoi, one F1 and one Smooth F1, isolates the cell borders. Cracks Thickness sets their width and a constant Color Ramp turns them into crisp lines. They use camera coordinates, so they shift with the point of view, as if seen through the crystal. They join the chain in Color Dodge, controlled by Cracks Opacity.',
            },
        },
        {
            src: M + 'Crystal/Crystal_04_Color_Variation.png', tema: 'blender',
            titulo: { es: 'Base de color', en: 'Color base' },
            pie: {
                es: 'ShadowsAndHighlights da a cada faceta un valor de luz distinto, que reparte Cristals Color Light y Cristals Color Dark. Un Voronoi en coordenadas de objeto, con suavidad variable, dibuja las formas internas con Inside Color Var 1 y 2. Las dos capas se combinan en Overlay.',
                en: 'ShadowsAndHighlights gives each facet a different light value, which distributes Cristals Color Light and Cristals Color Dark. A Voronoi in object coordinates, with variable smoothness, draws the inner shapes with Inside Color Var 1 and 2. Both layers are combined in Overlay.',
            },
        },
        {
            src: M + 'Crystal/Crystal_05_Gradient.png', tema: 'blender',
            titulo: { es: 'Degradado vertical', en: 'Vertical gradient' },
            pie: {
                es: 'La Z de las coordenadas Generated pasa por un Color Ramp B-Spline y mezcla Gradient Color Dark y Light de abajo arriba. Se superpone a la base en Overlay, con Gradient Opacity como factor.',
                en: 'The Z of the Generated coordinates goes through a B-Spline Color Ramp and blends Gradient Color Dark and Light from bottom to top. It is layered over the base in Overlay, with Gradient Opacity as the factor.',
            },
        },
        {
            src: M + 'Crystal/Crystal_06_Light_Reflections.png', tema: 'blender',
            titulo: { es: 'Reflejos falsos', en: 'Fake reflections' },
            pie: {
                es: 'La Z del vector de reflexión, rotado y escalado, pasa por un Color Ramp constante que dibuja franjas finas, como el reflejo de un softbox. Se colorean con Light Reflections Color y se suman al final en Add, con Light Reflections Opacity como factor.',
                en: 'The Z of the reflection vector, rotated and scaled, goes through a constant Color Ramp that draws thin stripes, like the reflection of a softbox. They are tinted with Light Reflections Color and added at the end in Add, with Light Reflections Opacity as the factor.',
            },
        },
        {
            src: M + 'Crystal/Crystal_07_Ambient_Color.png', tema: 'blender',
            titulo: { es: 'Tinte ambiental', en: 'Ambient tint' },
            pie: {
                es: 'La Z del vector de reflexión, desplazado y girado, se multiplica por Ambient Color Force. Ese valor decide dónde el modo de fusión Color lleva el tono hacia Ambient Color, como si reflejara un entorno de color.',
                en: 'The Z of the reflection vector, offset and rotated, is multiplied by Ambient Color Force. That value decides where the Color blend mode pushes the hue towards Ambient Color, as if reflecting a colored environment.',
            },
        },
        {
            src: M + 'Crystal/Crystal_08_Transparency_Color.png', tema: 'blender',
            titulo: { es: 'Color de la transparencia', en: 'Transparency color' },
            pie: {
                es: 'Un Voronoi suave en coordenadas de cámara tiñe el Transparent BSDF con Transparency Color 1 y 2. El Facing de ShadowsAndHighlights decide, faceta a faceta, la proporción entre transparencia y emisión: las caras de frente dejan ver más transparencia y las de perfil más color. Eso da la sensación de volumen translúcido.',
                en: 'A smooth Voronoi in camera coordinates tints the Transparent BSDF with Transparency Color 1 and 2. The Facing output of ShadowsAndHighlights decides, facet by facet, the balance between transparency and emission: faces pointing at the camera show more transparency and the ones seen edge-on more color. That gives the feeling of a translucent volume.',
            },
        },
        {
            src: M + 'Crystal/Crystal_09_Subgrupo_Random_Smoothness.png', tema: 'blender',
            titulo: { es: 'Subgrupo Random Smoothness', en: 'Random Smoothness subgroup' },
            pie: {
                es: 'Un Noise en coordenadas de objeto, comprimido con un Color Ramp a valores bajos, alimenta la Smoothness de los Voronoi. Así las celdas internas no salen todas igual de redondeadas.',
                en: 'A Noise in object coordinates, squeezed into low values with a Color Ramp, feeds the Smoothness of the Voronoi. That way the inner cells are not all equally rounded.',
            },
        },
        {
            src: M + 'Crystal/Crystal_10_Subgrupo_ShadowsAndHighlights.png', tema: 'blender',
            titulo: { es: 'Subgrupo ShadowsAndHighlights', en: 'ShadowsAndHighlights subgroup' },
            pie: {
                es: 'Gira las normales con un Mapping y saca el Facing de un Layer Weight, un valor tipo fresnel. Cada faceta del low-poly recibe un valor distinto según su ángulo respecto a la cámara, con un efecto parecido a una iluminación. Se usa para el sombreado de la base y para la mezcla entre transparencia y emisión.',
                en: 'It rotates the normals with a Mapping node and takes the Facing output of a Layer Weight, a fresnel-like value. Each low-poly facet gets a different value depending on its angle to the camera, with an effect similar to lighting. It is used for the base shading and for the mix between transparency and emission.',
            },
        },
        {
            src: M + 'Crystal/LineArt_01_Modificadores.png', tema: 'blender',
            titulo: { es: 'Modificadores del LineArt', en: 'LineArt modifiers' },
            pie: {
                es: 'Pila de modificadores del LineArt de Grease Pencil, en este orden:\n- Lineart genera los trazos desde la malla: contornos, intersecciones, aristas marcadas y pliegues.\n- Tint los colorea con un degradado radial alrededor de un Empty.\n- Simplify los remuestrea a intervalos regulares.\n- Dot Dash los corta en tramos.\n- Noise desplaza ligeramente sus puntos.\n- Envelope engorda y redondea cada tramo.\nLos campos en morado están controlados por drivers.',
                en: 'Modifier stack of the Grease Pencil LineArt, in this order:\n- Lineart generates the strokes from the mesh: contours, intersections, marked edges and creases.\n- Tint colors them with a radial gradient around an Empty.\n- Simplify resamples them at regular intervals.\n- Dot Dash cuts them into segments.\n- Noise slightly displaces their points.\n- Envelope thickens and rounds each segment.\nThe purple fields are driven by drivers.',
            },
        },
        {
            src: M + 'Crystal/LineArt_02_Controles.png', tema: 'blender',
            titulo: { es: 'Controles del LineArt', en: 'LineArt controls' },
            pie: {
                es: 'Panel de control del LineArt. Cada una de las siete propiedades personalizadas mueve un valor de la pila mediante un driver:\n- Line Thickness: grosor del Lineart.\n- Gradient proportions: radio del Tint.\n- Edges Roundness Threshold: Simplify.\n- Line dots resolution y Number of Gaps Per Line: trazo y hueco del Dot Dash.\n- Line Offset: Noise.\n- Round Edges Thickness: Envelope.\nAsí todo el estilo se ajusta desde un solo sitio. En los vídeos se adaptaron al tamaño de cada modelo.',
                en: 'LineArt control panel. Each of the seven custom properties drives a value in the stack:\n- Line Thickness: Lineart thickness.\n- Gradient proportions: Tint radius.\n- Edges Roundness Threshold: Simplify.\n- Line dots resolution and Number of Gaps Per Line: Dot Dash stroke and gap.\n- Line Offset: Noise.\n- Round Edges Thickness: Envelope.\nThat way the whole style is tuned from a single place. In the videos they were adjusted to the size of each model.',
            },
        },
    ],
};

export const comic: Breakdown = {
    id: 'comic',
    titulo: { es: 'Material Comic', en: 'Comic material' },
    intro: {
        es: 'El look sale de un solo grupo de nodos que imita una viñeta impresa: color base plano, sombras con trama de puntos (halftone), brillos recortados y un contorno de color. Todo el sombreado pasa por Shader to RGB (EEVEE), que convierte la luz de la escena en valores que se pueden recortar con rampas y comparaciones.',
        en: 'The look comes from a single node group that imitates a printed comic panel: flat base color, halftone shadows, clipped highlights and a colored outline. All the shading goes through Shader to RGB (EEVEE), which turns the scene lighting into values that can be clipped with ramps and comparisons.',
    },
    portada: [
        { src: '/3D/ComicMat.webm', ancho: 1920, alto: 1080, tema: 'blender', titulo: { es: 'Material estilo comic', en: 'Comic-style material' } },
    ],
    figuras: [
        {
            src: M + 'Comic/Comic_01_Material.png', tema: 'blender',
            titulo: { es: 'El material', en: 'The material' },
            pie: {
                es: 'El material es un único grupo reutilizable con 9 parámetros:\n- la escala de la trama;\n- el grosor del contorno;\n- los colores de sombra, brillo, contorno y base;\n- la opacidad de cada capa.\nSu salida Result es un color que va directo a Surface, así que se ve tal cual, como color plano. En este ejemplo: base rosa, sombra morada, brillo verde y contorno azul.',
                en: 'The material is a single reusable group with 9 parameters:\n- the halftone scale;\n- the outline thickness;\n- the shadow, highlight, outline and base colors;\n- the opacity of each layer.\nIts Result output is a color that goes straight into Surface, so it shows as is, as flat color. In this example: pink base, purple shadow, green highlight and blue outline.',
            },
        },
        {
            src: M + 'Comic/Comic_02_Grupo_General.png', ampliada: M + 'Comic/Comic_00_Grupo_Completo_HiRes.png', tema: 'blender',
            titulo: { es: 'Vista general', en: 'Overview' },
            pie: {
                es: 'Vista general del grupo. El resultado se construye en este orden:\n1. Principled BSDF, con Base Color, da el color base iluminado.\n2. Un Diffuse BSDF mide cuánta luz recibe cada punto y fija el tamaño de los puntos de la trama.\n3. Un Voronoi en coordenadas de ventana dibuja la retícula de puntos, y Greater Than la convierte en máscara.\n4. Multiply oscurece la base con Shadow Color dentro de los puntos.\n5. Dos nodos Add suman los brillos (Glossy) y el contorno (Fresnel).\nPúlsala para ver el grupo completo a resolución real.',
                en: 'Overview of the group. The result is built in this order:\n1. Principled BSDF, with Base Color, gives the lit base color.\n2. A Diffuse BSDF measures how much light each point gets and sets the size of the halftone dots.\n3. A Voronoi in window coordinates draws the dot grid, and Greater Than turns it into a mask.\n4. Multiply darkens the base with Shadow Color inside the dots.\n5. Two Add nodes add the highlights (Glossy) and the outline (Fresnel).\nClick it to see the full group at full resolution.',
            },
        },
        {
            src: M + 'Comic/Comic_03_Trama_de_Puntos.png', tema: 'blender',
            titulo: { es: 'Trama de puntos', en: 'Halftone dots' },
            pie: {
                es: 'Un Voronoi F1 con aleatoriedad 0 y coordenadas Window genera una cuadrícula regular de celdas fija a la pantalla, como la trama de una impresión. Dot Resolution controla su escala. Greater Than compara la distancia al centro de cada celda con un umbral: dentro del radio sale 0 (el punto) y fuera sale 1 (el papel).',
                en: 'A Voronoi F1 with 0 randomness and Window coordinates generates a regular grid of cells fixed to the screen, like a print halftone. Dot Resolution sets its scale. Greater Than compares the distance to the center of each cell with a threshold: inside the radius it outputs 0 (the dot) and outside 1 (the paper).',
            },
        },
        {
            src: M + 'Comic/Comic_04_Luz_y_Color_Base.png', tema: 'blender',
            titulo: { es: 'Luz y color base', en: 'Light and base color' },
            pie: {
                es: 'Un Diffuse BSDF blanco, pasado por Shader to RGB, da la iluminación como un valor. Map Range la invierte (1 en sombra, 0.1 en luz) y ese valor es el radio de los puntos: grandes en las sombras y casi nulos donde da la luz.\nUn Fresnel, cuyo IOR depende de Outline Thickness, puede engordar además los puntos hacia los bordes. En este material está a 0.\nAbajo, Principled BSDF con Base Color, pasado por Shader to RGB, da el color base ya iluminado.',
                en: 'A white Diffuse BSDF, through Shader to RGB, gives the lighting as a value. Map Range inverts it (1 in shadow, 0.1 in light) and that value is the dot radius: large in the shadows and almost nothing where the light hits.\nA Fresnel, whose IOR depends on Outline Thickness, can also grow the dots towards the edges. In this material it is set to 0.\nBelow, Principled BSDF with Base Color, through Shader to RGB, gives the lit base color.',
            },
        },
        {
            src: M + 'Comic/Comic_05_Brillos.png', tema: 'blender',
            titulo: { es: 'Brillos', en: 'Highlights' },
            pie: {
                es: 'Un Glossy BSDF pasa por Shader to RGB y por un Color Ramp constante en 0.943, que deja solo el núcleo del reflejo: una mancha blanca de borde duro. Highlight Opacity escala esa mancha, y un Add de la composición final suma Highlight Color en esa zona.',
                en: 'A Glossy BSDF goes through Shader to RGB and a constant Color Ramp at 0.943, which keeps only the core of the reflection: a hard-edged white spot. Highlight Opacity scales that spot, and an Add in the final composite adds Highlight Color there.',
            },
        },
        {
            src: M + 'Comic/Comic_06_Contorno.png', tema: 'blender',
            titulo: { es: 'Contorno', en: 'Outline' },
            pie: {
                es: 'Un Fresnel con IOR 0.9 (menor que 1) llega a 1 en las caras que se ven de canto. Un Color Ramp constante en 0.992 lo convierte en una franja dura alrededor de la silueta. Outline Opacity la escala, y el último Add suma Outline Color encima de todo.',
                en: 'A Fresnel with IOR 0.9 (below 1) reaches 1 on faces seen edge-on. A constant Color Ramp at 0.992 turns it into a hard band around the silhouette. Outline Opacity scales it, and the last Add puts Outline Color on top of everything.',
            },
        },
        {
            src: M + 'Comic/Comic_07_Composicion_Final.png', tema: 'blender',
            titulo: { es: 'Composición final', en: 'Final composite' },
            pie: {
                es: 'Composición final, de izquierda a derecha:\n- Lighten combina la máscara de puntos con Shadow Color: el papel queda blanco y los puntos toman el color de sombra.\n- Multiply aplica esa trama sobre el color base, con Shadow Opacity como factor.\n- Add suma Highlight Color donde hay brillo.\n- Add suma Outline Color en el contorno.\n- Group Output entrega el resultado al material.',
                en: 'Final composite, from left to right:\n- Lighten combines the dot mask with Shadow Color: the paper stays white and the dots take the shadow color.\n- Multiply applies that halftone over the base color, with Shadow Opacity as the factor.\n- Add adds Highlight Color where there is a highlight.\n- Add adds Outline Color on the outline.\n- Group Output hands the result to the material.',
            },
        },
    ],
};

export const arcane: Breakdown = {
    id: 'arcane',
    titulo: { es: 'Material Arcane', en: 'Arcane material' },
    intro: {
        es: 'Look pictórico inspirado en la serie Arcane. El sombreado se calcula sobre normales «pintadas» (celdas de Voronoi con bordes de pincel) y se traduce a color con rampas mediante Shader to RGB (EEVEE). El cuerpo del Goliath usa el material Arcane; el taparrabos usa una copia que solo cambia los colores de piel por marrones.',
        en: 'Painterly look inspired by the Arcane series. Shading is computed on "painted" normals (Voronoi cells with brush-stroke edges) and turned into color with ramps through Shader to RGB (EEVEE). The Goliath\'s body uses the Arcane material; the loincloth uses a copy that only swaps the skin colors for browns.',
    },
    portada: [
        { src: M + 'Arcane/Arcane_Goliath_Turntable.mp4', ancho: 1080, alto: 1350, tema: 'blender', titulo: { es: 'Turntable', en: 'Turntable' } },
        { src: M + 'Arcane/Arcane_Goliath_Frente.webp', tema: 'blender', titulo: { es: 'Frente', en: 'Front' } },
        { src: M + 'Arcane/Arcane_Goliath_Tres_Cuartos.webp', tema: 'blender', titulo: { es: 'Tres cuartos', en: 'Three-quarter' } },
        { src: M + 'Arcane/Arcane_Goliath_Espalda.webp', tema: 'blender', titulo: { es: 'Espalda', en: 'Back' } },
    ],
    portadaPie: {
        es: 'Render final del Goliath en EEVEE, sobre fondo negro, con puntos de luz rojos a un lado y azules al otro, uno verde desde abajo y un Sun cenital muy suave. Como el material pasa por Shader to RGB, cada luz se traduce en zonas de color pintadas sobre la piel. En la vuelta de 8 segundos la cámara orbita y las luces quedan fijas respecto al modelo, así se ve cómo cambian los planos de color según el ángulo.',
        en: 'Final render of the Goliath in EEVEE, on a black background, with red point lights on one side and blue ones on the other, a green one from below and a very soft overhead Sun. Since the material goes through Shader to RGB, each light becomes areas of color painted on the skin. In the 8-second turntable the camera orbits and the lights stay fixed relative to the model, so you can see how the color planes change with the angle.',
    },
    figuras: [
        {
            src: M + 'Arcane/Arcane_01_Material_General.png', ampliada: M + 'Arcane/Arcane_00_Material_Completo_HiRes.png', tema: 'blender',
            titulo: { es: 'Vista general', en: 'Overview' },
            pie: {
                es: 'Un único árbol, de izquierda a derecha:\n1. Brush Texture genera una textura de trazos.\n2. Esa textura desordena un Voronoi aplicado a las normales: las normales pintadas.\n3. Skin Tone ilumina esas normales y convierte la luz en colores de piel.\n4. Arriba queda la rama del brillo especular, y abajo a la derecha la del color de las luces.\n5. Un último Mix en modo Color junta piel y luz, y va a Material Output.\nPúlsala para ver el material completo a resolución real.',
                en: 'A single tree, from left to right:\n1. Brush Texture generates a stroke texture.\n2. That texture scrambles a Voronoi applied to the normals: the painted normals.\n3. Skin Tone lights those normals and turns the light into skin colors.\n4. The specular highlight branch sits at the top, and the light color branch at the bottom right.\n5. A last Mix in Color mode joins skin and light, and goes to Material Output.\nClick it to see the full material at full resolution.',
            },
        },
        {
            src: M + 'Arcane/Arcane_02_Brush_Texture.png', tema: 'blender',
            titulo: { es: 'Textura de pincel', en: 'Brush texture' },
            pie: {
                es: 'Dos Noise finos (escala 80) toman como coordenadas el valor de otros dos Noise grandes (escala 3), lo que estira el detalle en vetas parecidas a trazos. Un Voronoi Smooth F1 de escala 35, contrastado con un Color Ramp, alterna las dos versiones por zonas, y un último Color Ramp ajusta el contraste. Usa coordenadas de objeto, así que la pincelada se queda pegada al modelo.',
                en: 'Two fine Noise textures (scale 80) use the value of two large Noise textures (scale 3) as coordinates, which stretches the detail into streaks that look like strokes. A Smooth F1 Voronoi at scale 35, contrasted with a Color Ramp, alternates between both versions by area, and a last Color Ramp sets the contrast. It uses object coordinates, so the brushwork sticks to the model.',
            },
        },
        {
            src: M + 'Arcane/Arcane_03_Normales_Pintadas.png', tema: 'blender',
            titulo: { es: 'Normales pintadas', en: 'Painted normals' },
            pie: {
                es: 'Un Voronoi Smooth F1 de escala 3, aplicado sobre las normales del modelo, divide la superficie en celdas grandes. La textura de pincel controla su aleatoriedad, para que los bordes salgan irregulares.\nMix mezcla al 50 % la posición de cada celda con la normal original, y Vector Transform pasa el resultado de espacio de objeto a mundo.\nEstas normales alimentan los BSDF de la piel y del brillo. Así la luz cae en planos de color, como pinceladas, en lugar de en un degradado suave.',
                en: "A Smooth F1 Voronoi at scale 3, applied to the model's normals, splits the surface into large cells. The brush texture drives its randomness, so the borders come out irregular.\nMix blends each cell's position 50% with the original normal, and Vector Transform converts the result from object to world space.\nThese normals feed the skin and highlight BSDFs. That way light falls in planes of color, like brush strokes, instead of a smooth gradient.",
            },
        },
        {
            src: M + 'Arcane/Arcane_04_Skin_Tone.png', tema: 'blender',
            titulo: { es: 'Tono de piel', en: 'Skin tone' },
            pie: {
                es: '- Un Diffuse BSDF blanco con las normales pintadas, pasado por Shader to RGB, da la iluminación como un valor.\n- Un Color Ramp lo convierte en el degradado de piel. En el Goliath va de naranja en sombra a verde en luz.\n- Un Fresnel, recortado con otra rampa y limitado a las zonas iluminadas, oscurece en rojizo los bordes de la forma.\n- Ese color alimenta un segundo Diffuse BSDF que vuelve a pasar por Shader to RGB, para recoger el color y las sombras de las luces de la escena.',
                en: '- A white Diffuse BSDF with the painted normals, through Shader to RGB, gives the lighting as a value.\n- A Color Ramp turns it into the skin gradient. On the Goliath it goes from orange in shadow to green in light.\n- A Fresnel, clipped with another ramp and limited to the lit areas, darkens the edges of the shape with a reddish tone.\n- That color feeds a second Diffuse BSDF that goes through Shader to RGB again, to pick up the color and shadows of the scene lights.',
            },
        },
        {
            src: M + 'Arcane/Arcane_05_Brillo_Especular.png', tema: 'blender',
            titulo: { es: 'Brillo especular', en: 'Specular highlight' },
            pie: {
                es: 'Las celdas del Voronoi de las normales, pasadas por un Color Ramp, fijan la rugosidad de un Glossy BSDF celda a celda, de modo que cada pincelada brilla de forma distinta. Shader to RGB y otro Color Ramp recortan el reflejo en una máscara, que el Mix siguiente prepara como factor de la mezcla final.',
                en: 'The cells of the normals Voronoi, through a Color Ramp, set the roughness of a Glossy BSDF cell by cell, so each brush stroke shines differently. Shader to RGB and another Color Ramp clip the reflection into a mask, which the next Mix prepares as the factor of the final blend.',
            },
        },
        {
            src: M + 'Arcane/Arcane_06_Color_de_Luz.png', tema: 'blender',
            titulo: { es: 'Color de la luz y mezcla final', en: 'Light color and final blend' },
            pie: {
                es: 'Una Emission blanca y un Diffuse BSDF gris, ambos pasados por Shader to RGB, se combinan en modo Color. El resultado mantiene el brillo del blanco y toma el tono de las luces que llegan a cada punto. El último Mix, también en modo Color, usa la máscara de brillo para llevar la piel hacia ese tono. Su salida va directa a Material Output.',
                en: 'A white Emission and a grey Diffuse BSDF, both through Shader to RGB, are combined in Color mode. The result keeps the brightness of the white and takes the hue of the lights reaching each point. The last Mix, also in Color mode, uses the highlight mask to push the skin towards that hue. Its output goes straight to Material Output.',
            },
        },
    ],
};
