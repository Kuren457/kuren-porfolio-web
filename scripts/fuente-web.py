# Versión ligera de la fuente pixel para la web (src/assets/fonts/Tiny5Duo*.woff2), a partir de las TTF originales:
#  - de los 5 ejes de la fuente variable solo deja el grosor (wght), el único que usa la web; el resto, fijos en su
#    valor por defecto
#  - solo los caracteres latinos y la puntuación que se usan (la TTF trae muchos más alfabetos)
#  - en WOFF2 (comprimida)
# Pasa de ~580 KB a unas decenas, que es lo que más retrasaba que se pintara el texto en el móvil.
# Uso: python scripts/fuente-web.py (necesita fonttools y brotli: pip install fonttools brotli)
from io import BytesIO
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

CARACTERES = (
    list(range(0x20, 0x7F))       # Latín básico
    + list(range(0xA0, 0x100))    # Latín-1: tildes, ñ, ¿¡, «», ·, ×, º...
    + list(range(0x2010, 0x2028)) # Guiones, comillas tipográficas, …
    + list(range(0x2030, 0x203B)) # ‰, ‹›
    + list(range(0x2190, 0x219A)) # Flechas: ← ↑ → ↓ ↗...
    + [0x20AC, 0x2122]            # €, ™
)

for nombre in ['Tiny5Duo', 'Tiny5Duo-Italic']:
    fuente = instancer.instantiateVariableFont(TTFont(f'src/assets/fonts/{nombre}.ttf'), {'wdth': 100, 'ROND': 0, 'BLED': 0, 'JITT': 0})
    # Se guarda y se vuelve a abrir antes de recortar: si no, el recorte no encuentra glifos que aún no ha leído
    intermedia = BytesIO()
    fuente.save(intermedia)
    intermedia.seek(0)
    fuente = TTFont(intermedia)
    opciones = subset.Options()
    opciones.flavor = 'woff2'
    opciones.layout_features = ['*']
    opciones.name_IDs = ['*']
    recorte = subset.Subsetter(opciones)
    recorte.populate(unicodes=CARACTERES)
    recorte.subset(fuente)
    fuente.flavor = 'woff2'
    fuente.save(f'src/assets/fonts/{nombre}.woff2')
    print('Generada', f'src/assets/fonts/{nombre}.woff2')
