/**
 * Libère le port 5000 avant de démarrer le serveur (évite EADDRINUSE)
 */
import { execSync } from 'child_process';
const port = process.env.PORT || 5000;
try {
  if (process.platform === 'win32') {
    let result = '';
    try {
      result = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' });
    } catch (_) {
      process.exit(0); // Port libre
    }
    const lines = result.trim().split('\n').filter(l => l.includes('LISTENING'));
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Port ${port} libéré (PID ${pid} arrêté)`);
      } catch (_) {}
    }
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    } catch (_) {}
  }
} catch (_) {}
process.exit(0);
