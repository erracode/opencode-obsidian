#!/usr/bin/env node

/**
 * Instalador Universal opencode-obsidian
 * Detecta sistema operativo y ejecuta instalador correspondiente
 */

const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

const platform = os.platform();
const installDir = __dirname;

console.log('🚀 Instalador opencode-obsidian');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Sistema detectado: ${platform}`);
console.log(`Directorio: ${installDir}`);
console.log('');

try {
  if (platform === 'win32') {
    // Windows - usar PowerShell
    console.log('Ejecutando instalador Windows...');
    execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(installDir, 'install.ps1')}"`, {
      stdio: 'inherit',
      cwd: installDir
    });
  } else {
    // Mac/Linux - usar Bash
    console.log('Ejecutando instalador Unix...');
    execSync(`bash "${path.join(installDir, 'install.sh')}"`, {
      stdio: 'inherit',
      cwd: installDir
    });
  }
} catch (error) {
  console.error('❌ Error en instalación:', error.message);
  process.exit(1);
}
