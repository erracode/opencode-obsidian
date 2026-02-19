@echo off
chcp 65001 >nul
title Instalador opencode-obsidian
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║        Instalador opencode-obsidian para Windows             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [1/4] Verificando Node.js...
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
echo [2/4] Instalando dependencias...
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
echo [3/4] Compilando proyecto...
call npm run build
if errorlevel 1 (
    echo [!] ERROR: No se pudo compilar el proyecto
    pause
    exit /b 1
)
echo [✓] Proyecto compilado

:: Crear link global
echo.
echo [4/4] Creando link global...
call npm link
if errorlevel 1 (
    echo [!] No se pudo crear link global
    echo     Puedes usar: npm run setup
) else (
    echo [✓] Link global creado
)

:: Instalar skill
if not exist "%USERPROFILE%\.config\opencode\skills" (
    mkdir "%USERPROFILE%\.config\opencode\skills"
)

if exist "%USERPROFILE%\.config\opencode\skills\opencode-obsidian" (
    rmdir /s /q "%USERPROFILE%\.config\opencode\skills\opencode-obsidian"
)

mklink /d "%USERPROFILE%\.config\opencode\skills\opencode-obsidian" "%SCRIPT_DIR%skill-opencode-obsidian" >nul 2>&1
if errorlevel 1 (
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
echo 1. Configura tu vault:
echo    oo-setup setup
echo.
echo 2. Reinicia opencode
echo.
echo 3. Verifica la instalacion:
echo    ^>oo status
echo.
pause
