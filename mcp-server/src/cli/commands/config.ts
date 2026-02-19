import { loadConfig, saveConfig } from '../../core/config.js';
import { closePrompt } from '../prompts.js';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        result[key] = value;
        i++;
      }
    }
  }
  
  return result;
}

export async function configCommand(args: string[]): Promise<void> {
  const config = await loadConfig();
  
  if (!config) {
    console.log('❌ No hay configuración. Ejecuta: oo-setup setup');
    closePrompt();
    return;
  }
  
  const parsedArgs = parseArgs(args);
  
  if (parsedArgs.vault) {
    config.vault.path = parsedArgs.vault;
    config.vault.lastAccessed = new Date().toISOString();
    console.log(`📁 Vault actualizado: ${parsedArgs.vault}`);
  }
  
  if (parsedArgs.org) {
    config.azure.organization = parsedArgs.org;
    console.log(`🔗 Organización actualizada: ${parsedArgs.org}`);
  }
  
  if (parsedArgs.project) {
    config.azure.project = parsedArgs.project;
    console.log(`🔗 Proyecto actualizado: ${parsedArgs.project}`);
  }
  
  if (!parsedArgs.vault && !parsedArgs.org && !parsedArgs.project) {
    console.log(`
🔧 oo-setup config - Modificar configuración

Opciones:
  --vault <ruta>      Cambiar ruta del vault
  --org <nombre>      Cambiar organización Azure
  --project <nombre>  Cambiar proyecto Azure

Ejemplos:
  oo-setup config --vault "C:/Users/Jesus/Documents/Obsidian Vault"
  oo-setup config --org mi-organizacion
  oo-setup config --project "Mi Proyecto"

Configuración actual:
  Vault: ${config.vault.path}
  Azure: ${config.azure.organization}/${config.azure.project}
`);
    closePrompt();
    return;
  }
  
  await saveConfig(config);
  console.log('✅ Configuración guardada');
  
  closePrompt();
}
