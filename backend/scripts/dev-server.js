import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const srcDir = path.join(rootDir, 'src');
const serverEntry = path.join(srcDir, 'server.js');
const killPortScript = path.join(rootDir, 'scripts', 'kill-port.js');
const port = process.env.PORT || 5000;

let child = null;
let restartTimer = null;
let restarting = false;

function log(message) {
  console.log(`[dev] ${message}`);
}

function stopChild() {
  return new Promise((resolve) => {
    if (!child) return resolve();
    const current = child;
    child = null;
    current.once('exit', () => resolve());
    current.kill('SIGTERM');
    setTimeout(() => {
      if (!current.killed) {
        try { current.kill('SIGKILL'); } catch (_) {}
      }
    }, 3000);
  });
}

async function startChild() {
  child = spawn(process.execPath, [serverEntry], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development', PORT: String(port) },
    windowsHide: true,
  });

  child.on('exit', (code, signal) => {
    if (restarting) return;
    log(`server stopped (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    process.exit(code ?? 0);
  });
}

async function restart() {
  if (restarting) return;
  restarting = true;
  log('change detected, restarting...');
  await stopChild();
  await startChild();
  restarting = false;
}

function scheduleRestart() {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restart().catch((error) => {
      console.error('[dev] restart failed:', error);
    });
  }, 200);
}

function watchDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (!/\.(js|mjs|cjs|json)$/.test(filename)) return;
      scheduleRestart();
    });

    watcher.on('error', (error) => {
      console.error(`[dev] watcher error in ${dir}:`, error.message);
    });
  } catch (error) {
    console.error(`[dev] unable to watch ${dir}:`, error.message);
  }
}

process.on('SIGINT', async () => {
  log('stopping...');
  await stopChild();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopChild();
  process.exit(0);
});

spawnSync(process.execPath, [killPortScript], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
  windowsHide: true,
});

log('starting backend...');
await startChild();
watchDir(srcDir);
