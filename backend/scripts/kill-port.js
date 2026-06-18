/**
 * Libere le port 5000 avant de demarrer le serveur (evite EADDRINUSE)
 */
import { execSync } from 'child_process';

const port = process.env.PORT || 5000;

try {
  if (process.platform === 'win32') {
    let result = '';
    try {
      result = execSync('netstat -ano', { encoding: 'utf8' });
    } catch (_) {
      process.exit(0);
    }

    const lines = result
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.includes(`:${port}`) && line.includes('LISTENING'));

    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        console.log(`Port ${port} libere (PID ${pid} arrete)`);
      } catch (_) {}
    }
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    } catch (_) {}
  }
} catch (_) {}

process.exit(0);
