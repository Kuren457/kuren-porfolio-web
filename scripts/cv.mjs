// Genera los PDF del CV en español e inglés (public/CV_Miguel_Angel_Vera_Ximenez.pdf y ..._EN.pdf) a partir de
// fuentes/cv/cv.html y cv-en.html, imprimiéndolos con Chrome (sin márgenes ni cabeceras, en A4). Avisa si alguno
// ocupa más de una página o si lleva fuentes guardadas como dibujos (Type 3, ver la @font-face de cv.html).
// El PDF va etiquetado (generateTaggedPDF) para que los programas que leen CV sigan el orden de lectura.
// Uso: npm run cv (necesita Google Chrome instalado; si está en otro sitio: CHROME=<ruta> npm run cv)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CVS = [
    [resolve('fuentes/cv/cv.html'), resolve('public/CV_Miguel_Angel_Vera_Ximenez.pdf')],
    [resolve('fuentes/cv/cv-en.html'), resolve('public/CV_Miguel_Angel_Vera_Ximenez_EN.pdf')],
];
const PUERTO = 9399;

const perfil = mkdtempSync(join(tmpdir(), 'cv-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, '--allow-file-access-from-files', 'about:blank']);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

try {
    let destino;
    for (let i = 0; i < 50 && !destino; i++) {
        await esperar(200);
        try { destino = (await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()).find((t) => t.type === 'page'); } catch {}
    }
    const ws = new WebSocket(destino.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0;
    const pendientes = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id) pendientes.get(m.id)?.(m.result); });
    const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pendientes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

    await cmd('Page.enable');
    for (const [origen, destino] of CVS) {
        await cmd('Page.navigate', { url: pathToFileURL(origen).href });
        await esperar(1500); // Que carguen la fuente y la imagen
        const alto = (await cmd('Runtime.evaluate', { expression: 'document.body.scrollHeight / document.body.clientHeight', returnByValue: true })).result.value;
        if (alto > 1.001) console.warn(`Aviso: ${origen} ocupa más de una página A4 (${alto.toFixed(2)})`);

        const { data } = await cmd('Page.printToPDF', { paperWidth: 8.27, paperHeight: 11.69, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, printBackground: true, preferCSSPageSize: true, generateTaggedPDF: true, generateDocumentOutline: true });
        const pdf = Buffer.from(data, 'base64');
        if (pdf.includes('/Type3')) console.warn(`Aviso: ${destino} lleva fuentes Type 3 (¿una fuente variable?)`);
        writeFileSync(destino, pdf);
        console.log('Generado', destino);
    }
    ws.close();
} finally {
    chrome.kill();
    await esperar(300);
    rmSync(perfil, { recursive: true, force: true });
}
