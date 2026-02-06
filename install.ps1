# Instalador opencode-obsidian para Windows (PowerShell)
# Ejecutar con: powershell -ExecutionPolicy Bypass -File install.ps1

param(
    [string]$VaultPath = "",
    [string]$OpencodeConfig = ""
)

# Colores
$Red = "`e[0;31m"
$Green = "`e[0;32m"
$Yellow = "`e[1;33m"
$Blue = "`e[0;34m"
$NC = "`e[0m"  # No Color

Write-Host "$Green🚀 Instalador opencode-obsidian$NC"
Write-Host "$Green━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"
Write-Host ""

# Detectar directorio actual
$InstallDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "$Blue📁 Directorio de instalación:$NC $InstallDir"

# Verificar Node.js
Write-Host "$Blue🔍 Verificando Node.js...$NC"
try {
    $NodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "$Green✅ Node.js detectado:$NC $NodeVersion"
} catch {
    Write-Host "$Red❌ Node.js no está instalado$NC"
    Write-Host "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
}

# Verificar npm
Write-Host "$Blue🔍 Verificando npm...$NC"
try {
    npm --version >$null 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "$Green✅ npm detectado$NC"
} catch {
    Write-Host "$Red❌ npm no está instalado$NC"
    exit 1
}

Write-Host ""
Write-Host "$Yellow⚙️  Configuración$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Preguntar ubicación del vault
if ([string]::IsNullOrEmpty($VaultPath)) {
    $VaultPath = Read-Host "¿Dónde quieres crear tu vault? [$env:USERPROFILE\opencode-vault]"
    if ([string]::IsNullOrEmpty($VaultPath)) {
        $VaultPath = "$env:USERPROFILE\opencode-vault"
    }
}

# Expandir variables de entorno
$VaultPath = [Environment]::ExpandEnvironmentVariables($VaultPath)

# Preguntar ubicación de opencode config
if ([string]::IsNullOrEmpty($OpencodeConfig)) {
    $DefaultConfig = "$env:USERPROFILE\.config\opencode\opencode.json"
    if (Test-Path "$env:USERPROFILE\.opencode\opencode.json") {
        $DefaultConfig = "$env:USERPROFILE\.opencode\opencode.json"
    }
    
    $OpencodeConfig = Read-Host "¿Dónde está tu opencode.json? [$DefaultConfig]"
    if ([string]::IsNullOrEmpty($OpencodeConfig)) {
        $OpencodeConfig = $DefaultConfig
    }
}

$OpencodeConfig = [Environment]::ExpandEnvironmentVariables($OpencodeConfig)

# Preguntar sobre templates
$CopyTemplates = Read-Host "¿Copiar templates compartidos? [Y/n]"
if ([string]::IsNullOrEmpty($CopyTemplates)) {
    $CopyTemplates = "Y"
}

Write-Host ""
Write-Host "$Yellow📦 Instalando dependencias...$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Set-Location "$InstallDir\mcp-server"

# Instalar dependencias
Write-Host "$Blue⏳ npm install (esto puede tomar unos minutos)...$NC"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "$Red❌ Error instalando dependencias$NC"
    exit 1
}

Write-Host "$Green✅ Dependencias instaladas$NC"

# Compilar
Write-Host ""
Write-Host "$Yellow🔨 Compilando proyecto...$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "$Red❌ Error compilando proyecto$NC"
    exit 1
}

Write-Host "$Green✅ Proyecto compilado$NC"

# Crear vault
Write-Host ""
Write-Host "$Yellow📁 Creando vault...$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

New-Item -ItemType Directory -Force -Path "$VaultPath" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\inbox" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\entregas" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\tracking" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\daily" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\recursos" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\proyectos" | Out-Null
New-Item -ItemType Directory -Force -Path "$VaultPath\templates" | Out-Null

# Copiar templates
if ($CopyTemplates -match "^[Yy]$") {
    Write-Host "$Blue📄 Copiando templates...$NC"
    Copy-Item -Path "$InstallDir\skill-opencode-obsidian\templates\*" -Destination "$VaultPath\templates\" -Recurse -Force
    Write-Host "$Green✅ Templates copiados$NC"
}

# Copiar README
Copy-Item -Path "$InstallDir\README.md" -Destination "$VaultPath\" -Force

Write-Host "$Green✅ Vault creado en:$NC $VaultPath"

# Configurar opencode
Write-Host ""
Write-Host "$Yellow⚙️  Configurando opencode...$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Crear directorio si no existe
$ConfigDir = Split-Path -Parent $OpencodeConfig
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

# Convertir ruta a forward slashes para JSON
$InstallDirForward = $InstallDir -replace '\\', '/'

$McpConfig = @"
{
  "`$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "$InstallDirForward/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
"@

if (Test-Path $OpencodeConfig) {
    # Backup
    $BackupName = "$OpencodeConfig.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item -Path $OpencodeConfig -Destination $BackupName
    
    # Verificar si ya tiene configuración MCP
    $Content = Get-Content $OpencodeConfig -Raw
    if ($Content -match "opencode-obsidian") {
        Write-Host "$Yellow⚠️  MCP ya configurado, actualizando...$NC"
        Write-Host "$Yellowℹ️  Por favor verifica manualmente la configuración en:$NC $OpencodeConfig"
    } else {
        # Agregar configuración MCP
        # Esto es simplificado, en realidad necesitaríamos parsear JSON
        Write-Host "$Yellowℹ️  Archivo de configuración existente. Por favor agrega manualmente:$NC"
        Write-Host $McpConfig
    }
} else {
    # Crear nuevo archivo
    $McpConfig | Out-File -FilePath $OpencodeConfig -Encoding UTF8
    Write-Host "$Green✅ Configuración creada$NC"
}

# Instalar skill
$SkillDir = "$env:USERPROFILE\.config\opencode\skills"
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null

$SkillLink = "$SkillDir\opencode-obsidian"
if (Test-Path $SkillLink) {
    Remove-Item -Path $SkillLink -Force
}

# Crear symlink o copiar
try {
    New-Item -ItemType SymbolicLink -Path $SkillLink -Target "$InstallDir\skill-opencode-obsidian" | Out-Null
    Write-Host "$Green✅ Skill instalado (symlink)$NC"
} catch {
    # Si no se puede crear symlink, copiar
    Copy-Item -Path "$InstallDir\skill-opencode-obsidian" -Destination $SkillLink -Recurse -Force
    Write-Host "$Green✅ Skill instalado (copiado)$NC"
}

# Resumen
Write-Host ""
Write-Host "$Green🎉 ¡Instalación completada!$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "$Blue📁 Vault:$NC $VaultPath"
Write-Host "$Blue⚙️  Configuración:$NC $OpencodeConfig"
Write-Host ""
Write-Host "$Yellow🚀 Próximos pasos:$NC"
Write-Host "1. Reinicia opencode"
Write-Host "2. Ejecuta: /templates"
Write-Host "3. Empieza a usar: /c 'tu nota aquí'"
Write-Host ""
Write-Host "$Blue📚 Documentación:$NC"
Write-Host "- README.md: Guía completa"
Write-Host "- CHEATSHEET.md: Comandos rápidos"
Write-Host "- OBSIDIAN_INTEGRATION.md: Integración con Obsidian"
Write-Host ""

# Preguntar si quiere abrir Obsidian
$OpenObsidian = Read-Host "¿Quieres abrir el vault en Obsidian ahora? [y/N]"
if ($OpenObsidian -match "^[Yy]$") {
    # Intentar abrir Obsidian
    $ObsidianPath = "${env:ProgramFiles}\Obsidian\Obsidian.exe"
    if (Test-Path $ObsidianPath) {
        Start-Process $ObsidianPath -ArgumentList "$VaultPath"
    } else {
        Write-Host "$Yellowℹ️  Obsidian no encontrado en ruta estándar$NC"
        Write-Host "Abre Obsidian manualmente y selecciona: $VaultPath"
    }
}
