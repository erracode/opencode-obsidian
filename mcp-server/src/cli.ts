#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

// Buscar .env.local en orden de prioridad:
// 1. Directorio del paquete (donde está package.json)
const packageDir = path.dirname(path.dirname(process.argv[1]));
dotenv.config({ path: path.resolve(packageDir, '.env.local') });

// 2. Directorio actual (por si se ejecuta desde el proyecto)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 3. XDG config dir (fallback)
dotenv.config({ path: path.resolve(os.homedir(), '.config', 'opencode-obsidian', '.env.local') });

import { setupCommand } from './cli/commands/setup.js';
import { statusCommand } from './cli/commands/status.js';
import { configCommand } from './cli/commands/config.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'setup':
      await setupCommand();
      break;
    case 'status':
      await statusCommand();
      break;
    case 'config':
      await configCommand(args.slice(1));
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      process.exit(0);
  }
}

function showHelp() {
  console.log(`
🚀 oo-setup - opencode-obsidian CLI

Comandos:
  oo-setup setup    Configurar vault y Azure (wizard interactivo)
  oo-setup status   Mostrar configuración actual
  oo-setup config   Modificar configuración
  oo-setup help     Mostrar esta ayuda

Ejemplos:
  oo-setup setup
  oo-setup status
  oo-setup config --vault "C:/ruta/al/vault"
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
