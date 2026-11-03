// Genera las imágenes que salen al compartir un enlace de la web (Open Graph), en español e inglés
// (public/og/og-es.png y og-en.png, 1200x630), haciendo una captura de fuentes/og/og.html con Chrome.
// Uso: npm run og (necesita Google Chrome instalado; si está en otro sitio: CHROME=<ruta> npm run og)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ORIGEN = pathToFileURL(resolve('fuentes/og/og.html')).href;
const PUERTO = 9398;

const perfil = mkdtempSync(join(tmpdir(), 'og-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${perfil}`, '--allow-file-access-from-files', 'about:blank']);
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
    await cmd('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
    mkdirSync('public/og', { recursive: true });
    for (const idioma of ['es', 'en']) {
        await cmd('Page.navigate', { url: `${ORIGEN}?${idioma}` });
        await esperar(1500); // Que carguen la fuente y las imágenes
        const { data } = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
        writeFileSync(`public/og/og-${idioma}.png`, Buffer.from(data, 'base64'));
        console.log('Generado', `public/og/og-${idioma}.png`);
    }
    ws.close();
} finally {
    chrome.kill();
    await esperar(300);
    rmSync(perfil, { recursive: true, force: true });
}
