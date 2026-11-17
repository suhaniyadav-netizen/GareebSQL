#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const pythonCmd = isWin ? 'python' : 'python3';

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(prefix, color, message) {
  const text = message.toString();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${colors.bold}[${prefix}]${colors.reset} ${line}`);
    }
  }
}

console.log(`${colors.cyan}${colors.bold}===========================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   GareebSQL Unified Fullstack Engine      ${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}===========================================${colors.reset}\n`);

// 1. Check frontend dependencies
const frontendNodeModules = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(frontendNodeModules)) {
  console.log(`${colors.yellow}⚡ Frontend dependencies not found. Installing via npm...${colors.reset}`);
  try {
    execSync(`${npmCmd} install`, { cwd: frontendDir, stdio: 'inherit' });
    console.log(`${colors.green}✓ Frontend dependencies installed successfully.${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to install frontend dependencies: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

// 2. Check backend Python dependencies
try {
  execSync(`${pythonCmd} -c "import flask, mysql.connector, dotenv, flask_cors"`, { stdio: 'ignore' });
} catch {
  console.log(`${colors.yellow}⚡ Backend Python dependencies not found. Installing via pip...${colors.reset}`);
  try {
    execSync(`${pythonCmd} -m pip install -r requirements.txt`, { cwd: backendDir, stdio: 'inherit' });
    console.log(`${colors.green}✓ Backend dependencies installed successfully.${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to install backend dependencies: ${err.message}${colors.reset}`);
  }
}

console.log(`${colors.bold}Starting Backend (Flask on :5000) & Frontend (Vite on :5173)...${colors.reset}\n`);

let backendProcess = null;
let frontendProcess = null;
let isExiting = false;

function cleanup() {
  if (isExiting) return;
  isExiting = true;
  console.log(`\n${colors.yellow}Shutting down services...${colors.reset}`);

  const kill = (proc) => {
    if (!proc || !proc.pid) return;
    try {
      if (isWin) {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        proc.kill('SIGINT');
      }
    } catch {}
  };

  kill(backendProcess);
  kill(frontendProcess);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 3. Spawn Backend (Flask)
backendProcess = spawn(pythonCmd, ['run.py'], {
  cwd: backendDir,
  shell: isWin,
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});

backendProcess.stdout?.on('data', (data) => log('Backend', colors.cyan, data));
backendProcess.stderr?.on('data', (data) => log('Backend', colors.cyan, data));

backendProcess.on('close', (code) => {
  if (!isExiting && code !== 0 && code !== null) {
    log('Backend', colors.red, `Backend exited with code ${code}`);
  }
});

// 4. Spawn Frontend (Vite)
frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  shell: isWin,
  env: process.env,
});

frontendProcess.stdout?.on('data', (data) => log('Frontend', colors.green, data));
frontendProcess.stderr?.on('data', (data) => log('Frontend', colors.green, data));

frontendProcess.on('close', (code) => {
  if (!isExiting && code !== 0 && code !== null) {
    log('Frontend', colors.red, `Frontend exited with code ${code}`);
  }
});
