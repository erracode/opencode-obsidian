import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { loadConfig, saveConfig, AppConfig } from '../../core/config.js';
import { detectVaults } from '../vault-detector.js';
import { validateAzurePAT } from '../azure-validator.js';
import { prompt, promptYesNo, promptSelect, closePrompt } from '../prompts.js';

async function findTemplatesSource(): Promise<string | null> {
  const possiblePaths = [
    path.resolve(process.cwd(), 'skill-opencode-obsidian', 'templates'),
    path.resolve(process.cwd(), '..', 'skill-opencode-obsidian', 'templates'),
    path.resolve(__dirname, '..', '..', '..', '..', 'skill-opencode-obsidian', 'templates'),
  ];
  
  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }
  
  return null;
}

async function copyTemplates(vaultPath: string): Promise<number> {
  const templatesSource = await findTemplatesSource();
  
  if (!templatesSource) {
    return 0;
  }
  
  const templatesDest = path.join(vaultPath, 'templates');
  let copied = 0;
  
  try {
    const files = await fs.readdir(templatesSource);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const srcPath = path.join(templatesSource, file);
      const destPath = path.join(templatesDest, file);
      
      try {
        await fs.access(destPath);
      } catch {
        await fs.copyFile(srcPath, destPath);
        copied++;
      }
    }
  } catch {
    return 0;
  }
  
  return copied;
}

interface VaultOption {
  name: string;
  path: string;
}

async function ensureVaultStructure(vaultPath: string): Promise<void> {
  const folders = ['inbox', 'entregas', 'tracking', 'daily', 'recursos', 'proyectos', 'templates'];
  
  console.log(`\n📁 Verificando estructura: ${vaultPath}`);
  
  for (const folder of folders) {
    const fullPath = path.join(vaultPath, folder);
    try {
      await fs.access(fullPath);
      console.log(`   ✅ ${folder}/`);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`   📁 ${folder}/ (creado)`);
    }
  }
  
  const obsidianPath = path.join(vaultPath, '.obsidian');
  try {
    await fs.access(obsidianPath);
  } catch {
    await fs.mkdir(obsidianPath, { recursive: true });
    console.log(`   📁 .obsidian/ (creado)`);
  }
}

export async function setupCommand(): Promise<void> {
  console.log('🚀 oo-setup - Configuración de opencode-obsidian');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const existingConfig = await loadConfig();
  
  if (existingConfig) {
    console.log('📁 Configuración existente encontrada:');
    console.log(`   Vault: ${existingConfig.vault.path}`);
    console.log(`   Azure: ${existingConfig.azure.organization}/${existingConfig.azure.project}`);
    console.log('');
    
    const reconfigure = await promptYesNo('¿Deseas reconfigurar?', false);
    if (!reconfigure) {
      console.log('\n✅ Configuración mantenida.');
      closePrompt();
      return;
    }
  }
  
  console.log('🔍 Buscando vaults de Obsidian...');
  const detectedVaults = await detectVaults();
  
  let selectedVaultPath: string;
  
  if (detectedVaults.length > 0) {
    console.log(`   Encontrados ${detectedVaults.length} vault(s)`);
    
    const options: VaultOption[] = [
      ...detectedVaults.map(v => ({ name: `${v.name} (${v.path})`, path: v.path })),
      { name: '► Crear nuevo vault', path: '__new__' },
      { name: '► Ingresar ruta manualmente', path: '__manual__' }
    ];
    
    const selected = await promptSelect('Selecciona tu vault:', options);
    
    if (!selected) {
      console.log('\n❌ Cancelado.');
      closePrompt();
      return;
    }
    
    if (selected.path === '__new__') {
      const defaultPath = path.join(os.homedir(), 'opencode-vault');
      selectedVaultPath = await prompt('Ruta del nuevo vault', defaultPath);
    } else if (selected.path === '__manual__') {
      selectedVaultPath = await prompt('Ruta del vault');
    } else {
      selectedVaultPath = selected.path;
    }
  } else {
    console.log('   No se encontraron vaults existentes');
    const defaultPath = path.join(os.homedir(), 'opencode-vault');
    selectedVaultPath = await prompt('Ruta del vault', defaultPath);
  }
  
  await ensureVaultStructure(selectedVaultPath);
  
  const templatesCopied = await copyTemplates(selectedVaultPath);
  if (templatesCopied > 0) {
    console.log(`   📄 ${templatesCopied} templates copiados`);
  }
  
  console.log('\n🔗 Configuración de Azure DevOps');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const configureAzure = await promptYesNo('¿Configurar Azure DevOps?', true);
  
  const azureConfig: AppConfig['azure'] = {
    organization: 'cinemarkintl',
    project: 'Core Backend'
  };
  
  if (configureAzure) {
    azureConfig.organization = await prompt('Organización', azureConfig.organization);
    azureConfig.project = await prompt('Proyecto', azureConfig.project);
    
    const currentPAT = process.env.AZURE_PAT;
    
    if (currentPAT) {
      console.log('\n🔍 PAT detectado en .env.local');
      const validPAT = await promptYesNo('¿Usar PAT existente?', true);
      
      if (!validPAT) {
        const newPAT = await prompt('Nuevo PAT (dejar vacío para mantener actual)');
        if (newPAT) {
          azureConfig.patLast4 = newPAT.slice(-4);
        }
      }
      
      console.log('\n⏳ Validando conexión...');
      const validation = await validateAzurePAT(
        currentPAT,
        azureConfig.organization,
        azureConfig.project
      );
      
      if (validation.valid) {
        console.log('✅ Conexión exitosa');
      } else {
        console.log(`❌ ${validation.error}`);
        console.log('   Puedes actualizar el PAT en .env.local manualmente');
      }
    } else {
      console.log('\n⚠️  No hay PAT configurado');
      console.log('   Agrega AZURE_PAT a .env.local');
      console.log(`   Ubicación: ${path.join(process.cwd(), '.env.local')}`);
    }
  }
  
  const newConfig: AppConfig = {
    version: '1.0.0',
    vault: {
      path: selectedVaultPath,
      lastAccessed: new Date().toISOString()
    },
    azure: azureConfig
  };
  
  await saveConfig(newConfig);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Resumen de configuración');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 Vault: ${selectedVaultPath}`);
  console.log(`🔗 Azure: ${azureConfig.organization}/${azureConfig.project}`);
  console.log(`📄 Config: ~/.config/opencode-obsidian/config.json`);
  console.log('');
  console.log('🎉 ¡Setup completado!');
  console.log('');
  console.log('Próximos pasos:');
  console.log('  1. Reinicia opencode');
  console.log('  2. Ejecuta: >oo status');
  console.log('  3. Empieza con: >oo cap "tu primera nota"');
  
  closePrompt();
}
