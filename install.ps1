# Instalador opencode-obsidian para Windows (PowerShell)
# Ejecutar con: powershell -ExecutionPolicy Bypass -File install.ps1

param(
    [switch]$SkipBuild
)

$Green = "`e[0;32m"
$Yellow = "`e[1;33m"
$NC = "`e[0m"

Write-Host "$Green🚀 Instalador opencode-obsidian$NC"
Write-Host "$Green━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"
Write-Host ""

$InstallDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..."
try {
    $NodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "$Green✅ Node.js:$NC $NodeVersion"
} catch {
    Write-Host "❌ Node.js no está instalado"
    Write-Host "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
}

# Instalar dependencias y compilar
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "📦 Instalando dependencias..."
    Set-Location "$InstallDir\mcp-server"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias"
        exit 1
    }

    Write-Host ""
    Write-Host "🔨 Compilando proyecto..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error compilando proyecto"
        exit 1
    }
    Write-Host "$Green✅ Proyecto compilado$NC"
}

# Crear link global
Write-Host ""
Write-Host "🔗 Creando link global..."
Set-Location "$InstallDir\mcp-server"
npm link
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ No se pudo crear link global"
}

# Configurar opencode.json
$OpencodeConfig = "$env:USERPROFILE\.config\opencode\opencode.json"
$ConfigDir = Split-Path -Parent $OpencodeConfig
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

$InstallDirForward = $InstallDir -replace '\\', '/'

if (Test-Path $OpencodeConfig) {
    $Content = Get-Content $OpencodeConfig -Raw
    if ($Content -match "opencode-obsidian") {
        Write-Host "$Green✅ MCP ya configurado$NC"
    } else {
        Write-Host "$Yellow⚠️ Agrega manualmente a opencode.json:$NC"
        Write-Host ""
        Write-Host '"mcp": {'
        Write-Host '  "opencode-obsidian": {'
        Write-Host '    "command": ["node", "'"$InstallDirForward"'/mcp-server/dist/index.js"],'
        Write-Host '    "enabled": true'
        Write-Host '  }'
        Write-Host '}'
    }
} else {
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
    $McpConfig | Out-File -FilePath $OpencodeConfig -Encoding UTF8
    Write-Host "$Green✅ opencode.json creado$NC"
}

# Instalar skill
$SkillDir = "$env:USERPROFILE\.config\opencode\skills"
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null

$SkillLink = "$SkillDir\opencode-obsidian"
if (Test-Path $SkillLink) {
    Remove-Item -Path $SkillLink -Force
}

try {
    New-Item -ItemType SymbolicLink -Path $SkillLink -Target "$InstallDir\skill-opencode-obsidian" | Out-Null
    Write-Host "$Green✅ Skill instalado$NC"
} catch {
    Copy-Item -Path "$InstallDir\skill-opencode-obsidian" -Destination $SkillLink -Recurse -Force
    Write-Host "$Green✅ Skill instalado (copiado)$NC"
}

# Resumen
Write-Host ""
Write-Host "$Green🎉 ¡Instalación completada!$NC"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "$Yellow🚀 Próximos pasos:$NC"
Write-Host ""
Write-Host "1. Configura tu vault:"
Write-Host "   oo-setup setup"
Write-Host ""
Write-Host "2. Reinicia opencode"
Write-Host ""
Write-Host "3. Verifica la instalación:"
Write-Host "   >oo status"
Write-Host ""
