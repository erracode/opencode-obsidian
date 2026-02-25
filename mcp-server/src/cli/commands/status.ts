import * as fs from 'fs/promises';
import * as path from 'path';
import { loadConfig, getDataDir, type AppConfig } from '../../core/config.js';
import { closePrompt } from '../prompts.js';
import { validateAzurePAT } from '../azure-validator.js';
import { glob } from 'glob';

async function countNotes(vaultPath: string): Promise<number> {
  try {
    const files = await glob('**/*.md', { cwd: vaultPath });
    return files.length;
  } catch {
    return 0;
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function statusCommand(): Promise<void> {
  console.log('📊 opencode-obsidian - Estado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const config = await loadConfig();
  
  if (!config) {
    console.log('❌ No hay configuración.');
    console.log('   Ejecuta: oo-setup setup');
    closePrompt();
    return;
  }
  
  // Vault
  console.log('📁 Vault');
  console.log(`   Ruta: ${config.vault.path}`);
  
  try {
    const notes = await countNotes(config.vault.path);
    console.log(`   Notas: ${notes} archivos`);
    if (config.vault.lastAccessed) {
      console.log(`   Último acceso: ${formatDate(config.vault.lastAccessed)}`);
    }
  } catch {
    console.log('   ⚠️  No accesible');
  }
  
  // Azure
  console.log('\n🔗 Azure DevOps');
  console.log(`   Organización: ${config.azure.organization}`);
  console.log(`   Proyecto: ${config.azure.project}`);
  
  const pat = process.env.AZURE_PAT;
  if (pat) {
    console.log(`   PAT: ****${pat.slice(-4)}`);
    
    const validation = await validateAzurePAT(pat, config.azure.organization, config.azure.project);
    if (validation.valid) {
      if (validation.hasWorkItemsAccess) {
        console.log('   Estado: ✅ Válido (con acceso a Work Items)');
      } else {
        console.log('   Estado: ⚠️ Válido pero sin acceso a Work Items');
        console.log('   El PAT necesita scope "Work Items (Read & Write)"');
      }
    } else {
      console.log(`   Estado: ❌ ${validation.error}`);
    }
  } else {
    console.log('   PAT: ⚠️  No configurado');
    console.log('   Crea .env.local con AZURE_PAT');
  }
  
  // Templates
  console.log('\n📚 Templates');
  try {
    const templatesPath = path.join(config.vault.path, 'templates');
    const templates = await fs.readdir(templatesPath);
    const mdFiles = templates.filter(f => f.endsWith('.md'));
    console.log(`   Disponibles: ${mdFiles.length}`);
    mdFiles.slice(0, 5).forEach(t => console.log(`   - ${t}`));
    if (mdFiles.length > 5) console.log(`   ... y ${mdFiles.length - 5} más`);
  } catch {
    console.log('   ⚠️  Sin templates');
  }
  
  // RAG
  console.log('\n📊 RAG');
  const ragPath = path.join(getDataDir(), 'lancedb');
  try {
    await fs.access(ragPath);
    console.log(`   Estado: ✅ Indexado`);
    console.log(`   Ubicación: ${ragPath}`);
  } catch {
    console.log('   Estado: ⚠️  No indexado');
    console.log('   Ejecuta: >oo idx');
  }
  
  // Config
  console.log('\n🔌 Configuración');
  console.log(`   Archivo: ~/.config/opencode-obsidian/config.json`);
  console.log(`   Versión: ${config.version}`);
  
  closePrompt();
}
