import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { execSync } from 'child_process';
import { loadConfig, saveConfig, AppConfig } from '../../core/config.js';
import { detectVaults } from '../vault-detector.js';
import { validateAzurePAT } from '../azure-validator.js';
import { prompt, promptYesNo, promptSelect, closePrompt } from '../prompts.js';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

async function findTemplatesSource(): Promise<string | null> {
  const possiblePaths = [
    path.resolve(PROJECT_ROOT, 'skill-opencode-obsidian', 'templates'),
    path.resolve(PROJECT_ROOT, '..', 'skill-opencode-obsidian', 'templates'),
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
    await fs.mkdir(templatesDest, { recursive: true });
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

async function checkPrerequisites(): Promise<{ ok: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  console.log('🔍 Verificando prerequisites...');
  
  // Check Node.js
  try {
    execSync('node --version', { stdio: 'pipe' });
    console.log('   ✅ Node.js');
  } catch {
    issues.push('Node.js no está instalado');
  }
  
  // Check if dependencies installed
  const nodeModulesPath = path.join(PROJECT_ROOT, 'node_modules');
  try {
    await fs.access(nodeModulesPath);
    console.log('   ✅ node_modules/');
  } catch {
    console.log('   ⚠️  node_modules/ no encontrado - ejecuta: npm install');
    issues.push('dependencies not installed');
  }
  
  // Check if built
  const distPath = path.join(PROJECT_ROOT, 'dist', 'index.js');
  try {
    await fs.access(distPath);
    console.log('   ✅ dist/');
  } catch {
    console.log('   ⚠️  dist/ no encontrado - ejecuta: npm run build');
    issues.push('not built');
  }
  
  // Check opencode
  try {
    execSync('opencode --version', { stdio: 'pipe' });
    console.log('   ✅ opencode CLI');
  } catch {
    console.log('   ⚠️  opencode no instalado - ejecuta: npm install -g opencode');
    issues.push('opencode not installed');
  }
  
  return { ok: issues.length === 0, issues };
}

async function installDependencies(): Promise<boolean> {
  console.log('\n📦 Instalando dependencias...');
  try {
    execSync('npm install', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('   ✅ npm install completado');
    return true;
  } catch {
    console.log('   ❌ Error en npm install');
    return false;
  }
}

async function buildProject(): Promise<boolean> {
  console.log('\n🔨 Compilando proyecto...');
  try {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('   ✅ npm run build completado');
    return true;
  } catch {
    console.log('   ❌ Error en npm run build');
    return false;
  }
}

async function configureMCP(): Promise<boolean> {
  console.log('\n🔗 Configurando MCP en opencode...');
  
  const opencodeConfigPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
  const mcpServerPath = path.join(PROJECT_ROOT, 'dist', 'index.js');
  
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(opencodeConfigPath), { recursive: true });
    
    let config: any = {};
    try {
      const content = await fs.readFile(opencodeConfigPath, 'utf-8');
      config = JSON.parse(content);
    } catch {
      // File doesn't exist, use empty config
    }
    
    if (!config.mcp) {
      config.mcp = {};
    }
    
    // Add or update opencode-obsidian MCP
    config.mcp['opencode-obsidian'] = {
      type: 'local',
      command: ['node', mcpServerPath],
      enabled: true
    };
    
    await fs.writeFile(opencodeConfigPath, JSON.stringify(config, null, 2));
    console.log('   ✅ MCP configurado en ~/.config/opencode/opencode.json');
    return true;
  } catch (error: any) {
    console.log(`   ❌ Error configurando MCP: ${error.message}`);
    return false;
  }
}

async function installOpencodeCLI(): Promise<boolean> {
  console.log('\n📥 Instalando opencode CLI...');
  try {
    execSync('npm install -g opencode', { stdio: 'inherit' });
    console.log('   ✅ opencode instalado');
    return true;
  } catch {
    console.log('   ❌ Error instalando opencode');
    return false;
  }
}

export async function setupCommand(): Promise<void> {
  console.log('🚀 oo-setup - Configuración de opencode-obsidian');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Check prerequisites
  const { ok: prereqsOk, issues } = await checkPrerequisites();
  
  if (!prereqsOk) {
    console.log('\n⚠️  Prerequisites incompletos');
    
    // Ask to fix issues
    const fixIssues = await promptYesNo('¿Deseas intentar solucionar los problemas automáticamente?', true);
    
    if (fixIssues) {
      if (issues.includes('opencode not installed')) {
        const installed = await installOpencodeCLI();
        if (!installed) {
          console.log('\n❌ No se pudo instalar opencode. Instala manualmente: npm install -g opencode');
        }
      }
      
      if (issues.includes('dependencies not installed')) {
        const installed = await installDependencies();
        if (!installed) {
          console.log('\n❌ Error instalando dependencias. Ejecuta manualmente: npm install');
        }
      }
      
      if (issues.includes('not built')) {
        const built = await buildProject();
        if (!built) {
          console.log('\n❌ Error compilando. Ejecuta manualmente: npm run build');
        }
      }
    }
  }
  
  // Ask about MCP configuration
  console.log('');
  const configureMcp = await promptYesNo('¿Configurar MCP en opencode.json?', true);
  
  if (configureMcp) {
    await configureMCP();
  }
  
  // Load existing config
  const existingConfig = await loadConfig();
  
  if (existingConfig) {
    console.log('\n📁 Configuración existente encontrada:');
    console.log(`   Vault: ${existingConfig.vault.path}`);
    console.log(`   Azure: ${existingConfig.azure.organization}/${existingConfig.azure.project}`);
    console.log('');
    
    const reconfigure = await promptYesNo('¿Deseas reconfigurar vault/Azure?', false);
    if (!reconfigure) {
      console.log('\n✅ Configuración mantenida.');
      showFinalInstructions();
      closePrompt();
      return;
    }
  }
  
  console.log('\n🔍 Buscando vaults de Obsidian...');
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
      console.log(`   Ubicación: ${path.join(PROJECT_ROOT, '.env.local')}`);
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
  
  showFinalInstructions();
  
  closePrompt();
}

function showFinalInstructions(): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Resumen de configuración');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ¡Setup completado!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('  1. Reinicia opencode completamente');
  console.log('  2. Ejecuta: >oo status');
  console.log('  3. Empieza con: >oo cap "tu primera nota"');
  console.log('');
}
