@echo off
chcp 65001 >nul
title Instalador opencode-obsidian
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║        Instalador opencode-obsidian para Windows             ║
echo ║  Sistema de gestion de conocimiento con RAG y templates      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [!] ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo [✓] Node.js detectado

:: Obtener ruta del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Instalar dependencias
echo.
echo [2/5] Instalando dependencias...
cd mcp-server
call npm install
if errorlevel 1 (
    echo [!] ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo [✓] Dependencias instaladas

:: Compilar
echo.
echo [3/5] Compilando proyecto...
call npm run build
if errorlevel 1 (
    echo [!] ERROR: No se pudo compilar el proyecto
    pause
    exit /b 1
)
echo [✓] Proyecto compilado

:: Configurar variable de entorno
echo.
echo [4/5] Configurando variable de entorno...
setx OBSIDIAN_VAULT_PATH "%SCRIPT_DIR%vault" /M >nul 2>&1
echo [✓] Variable OBSIDIAN_VAULT_PATH configurada

:: Instalar skill
echo.
echo [5/5] Instalando skill...
if not exist "%USERPROFILE%\.config\opencode\skills" (
    mkdir "%USERPROFILE%\.config\opencode\skills"
)

:: Crear symlink o copiar
if exist "%USERPROFILE%\.config\opencode\skills\opencode-obsidian" (
    rmdir /s /q "%USERPROFILE%\.config\opencode\skills\opencode-obsidian"
)

mklink /d "%USERPROFILE%\.config\opencode\skills\opencode-obsidian" "%SCRIPT_DIR%skill-opencode-obsidian" >nul 2>&1
if errorlevel 1 (
    :: Si no se puede crear symlink, copiar
    xcopy /s /e /i /y "%SCRIPT_DIR%skill-opencode-obsidian" "%USERPROFILE%\.config\opencode\skills\opencode-obsidian" >nul
)
echo [✓] Skill instalada

:: Instrucciones finales
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    INSTALACION COMPLETA                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Proximos pasos:
echo.
echo 1. Agrega esto a tu opencode.json:
echo    "mcp": {
echo      "opencode-obsidian": {
echo        "command": ["node", "%SCRIPT_DIR:\=/%mcp-server/dist/index.js"],
echo        "enabled": true
echo      }
echo    }
echo.
echo 2. Reinicia opencode
echo.
echo 3. Prueba con: /templates
echo.
echo Tu vault esta en: %SCRIPT_DIR%vault
echo.
pause
