# ✅ CHECKLIST FINAL - Setup Completo

## 📋 Requisitos Previos

- [ ] Windows 10/11 con PowerShell
- [ ] Node.js instalado (v18+)
- [ ] Opencode instalado y funcionando
- [ ] Carpeta del proyecto en: `Documents/work/personal/opencode-obsidian/`

---

## 🚀 PASOS PARA EJECUTAR (En Orden)

### 1. Instalación Automática (Si es primera vez)

```powershell
cd Documents/work/personal/opencode-obsidian
.\install.bat
```

**Si el instalador falla, hazlo manual:**
```powershell
cd mcp-server
npm install
npm run build
```

---

### 2. Configurar Opencode

**Editar archivo:**
```
C:\Users\Jesus\.config\opencode\opencode.json
```

**Agregar configuración MCP:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "C:/Users/Jesus/Documents/work/personal/opencode-obsidian/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

⚠️ **IMPORTANTE:** Usa forward slashes `/` en la ruta

---

### 3. Configurar Variable de Entorno (Opcional pero recomendado)

**PowerShell como Administrador:**
```powershell
[Environment]::SetEnvironmentVariable("OBSIDIAN_VAULT_PATH", "C:\Users\Jesus\Documents\work\personal\opencode-obsidian\vault", "User")
```

---

### 4. Instalar Skill

**En PowerShell:**
```powershell
# Crear enlace simbólico
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\skills\opencode-obsidian" -Target "C:\Users\Jesus\Documents\work\personal\opencode-obsidian\skill-opencode-obsidian"

# Si no funciona, copiar:
Copy-Item -Path "C:\Users\Jesus\Documents\work\personal\opencode-obsidian\skill-opencode-obsidian" -Destination "$env:USERPROFILE\.config\opencode\skills\opencode-obsidian" -Recurse
```

---

### 5. Verificar Instalación

**Reiniciar opencode:**
- Cierra opencode completamente
- Vuelve a abrirlo

**Probar:**
```
/templates
```

Debe mostrar:
```
- ai-context (es): Prompt estructurado para editores IA
- azure-delivery (es): Reporte formal de tarea para Azure DevOps
- bitbucket-pr-release (en): PR simple para cherry-picks
- bitbucket-pr-standard (en): PR completo para features
- confluence-release (es): Documento de release en Confluence
- daily-standup (es): Resumen para daily meetings
- task-tracker (es): Resumen compacto para tracking
```

---

### 6. Integración con Obsidian (Opcional pero recomendado)

**Abrir Obsidian:**
1. "Abrir carpeta como vault"
2. Seleccionar: `C:\Users\Jesus\Documents\work\personal\opencode-obsidian\vault`
3. ¡Listo!

**Ver guía completa:** `OBSIDIAN_INTEGRATION.md`

---

## 🎮 COMANDOS DISPONIBLES

### Básicos (5 comandos principales):

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/c` | Capturar nota | `/c Tengo que revisar bug 28416` |
| `/f` | Buscar | `/f error 403` |
| `/t` | Ver tarea | `/t 28416` |
| `/d` | Daily | `/d` |
| `/h` | Ayuda | `/h` |

### Adicionales:
- `/templates` - Ver templates disponibles
- `/i` - Reindexar manualmente (normalmente automático)

---

## 📁 ESTRUCTURA DEL VAULT

```
Documents/work/personal/opencode-obsidian/
├── 📁 vault/                          ← TU VAULT DE OBSIDIAN
│   ├── 📁 inbox/                     ← Notas capturadas
│   ├── 📁 entregas/                  ← Templates Azure
│   ├── 📁 tracking/                  ← Trackers de tareas
│   ├── 📁 daily/                     ← Daily notes
│   ├── 📁 recursos/                  ← Comandos, snippets
│   ├── 📁 proyectos/                 ← Contextos IA
│   ├── 📁 templates/                 ← Templates base
│   ├── 📄 README.md                  ← Guía del vault
│   └── 📁 .lancedb/                  ← Base de datos RAG
│
├── 📁 mcp-server/
│   ├── 📁 dist/                      ← Código compilado
│   ├── 📁 src/                       ← Código fuente
│   └── 📄 package.json
│
├── 📁 skill-opencode-obsidian/
│   ├── 📄 SKILL.md                   ← Instrucciones para Claude
│   ├── 📁 templates/                 ← Templates
│   └── 📁 references/                ← Guías
│
├── 📄 README.md                       ← Documentación principal
├── 📄 QUICKSTART.md                   ← Guía rápida
├── 📄 OBSIDIAN_INTEGRATION.md         ← Integración con Obsidian
├── 📄 CHEATSHEET.md                   ← Referencia rápida
├── 📄 install.bat                     ← Instalador Windows
└── 📄 setup.sh                        ← Setup Unix/Mac
```

---

## ⚙️ CONFIGURACIÓN DE SISTEMA

### Archivos de Configuración:

**1. Opencode:**
```
C:\Users\Jesus\.config\opencode\opencode.json
```

**2. Variables de entorno (Windows):**
```
OBSIDIAN_VAULT_PATH=C:\Users\Jesus\Documents\work\personal\opencode-obsidian\vault
```

**3. Skill:**
```
C:\Users\Jesus\.config\opencode\skills\opencode-obsidian -> 
C:\Users\Jesus\Documents\work\personal\opencode-obsidian\skill-opencode-obsidian
```

---

## 🔧 MANTENIMIENTO

### Recompilar si haces cambios:
```powershell
cd mcp-server
npm run build
```

### Limpiar notas (si necesitas empezar de cero):
```powershell
cd vault
Remove-Item -Path "inbox\*","entregas\*","tracking\*","proyectos\*","recursos\*","daily\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".lancedb" -Recurse -Force -ErrorAction SilentlyContinue
```

### Actualizar índice (si la búsqueda falla):
```
/i
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Problema | Solución |
|----------|----------|
| "Vault path is not set" | `obsidian_set_vault` con la ruta completa |
| "Configuration is invalid" | Usa forward slashes `/` en opencode.json |
| "Cannot find module" | `cd mcp-server && npm install && npm run build` |
| Comandos no aparecen | Reiniciar opencode completamente |
| Búsqueda no funciona | Ejecutar `/i` para reindexar |
| Obsidian no ve notas | Refrescar Obsidian (Ctrl+R) |

---

## 📚 DOCUMENTACIÓN DISPONIBLE

- **README.md** - Esta guía, setup completo
- **QUICKSTART.md** - Inicio rápido (5 min)
- **OBSIDIAN_INTEGRATION.md** - Cómo usar con Obsidian app
- **CHEATSHEET.md** - Comandos rápidos y ejemplos
- **CONFIG.md** - Configuración avanzada
- **PROJECT_SUMMARY.md** - Resumen del proyecto

---

## ✅ VERIFICACIÓN FINAL

**Después de seguir todos los pasos, verifica:**

- [ ] Opencode abre sin errores
- [ ] `/templates` muestra los 7 templates
- [ ] `/c "test"` captura una nota
- [ ] La nota aparece en `vault/inbox/`
- [ ] `/f "test"` encuentra la nota
- [ ] Obsidian abre el vault correctamente
- [ ] Puedes editar notas en Obsidian

---

## 🎯 PRIMER USO

**Ejemplo de flujo completo:**

```bash
# 1. Capturar tarea nueva
/c "Tengo que implementar feature 29999 para exportar PDF"

# 2. Verificar que se creó
# (revisa vault/entregas/ y vault/tracking/)

# 3. Buscar información
/f "comandos útiles docker"

# 4. Preparar daily
/d

# 5. Editar en Obsidian
# (abre Obsidian, completa el template de entrega)

# 6. Registrar deploy cuando termines
/c "git tag -a v2.9.0 -m '29999 feat: PDF export'"
```

---

## 🎉 ¡LISTO PARA USAR!

**Tu sistema tiene:**
- ✅ 5 comandos cortos fáciles de recordar
- ✅ Organización automática en carpetas
- ✅ Búsqueda semántica con RAG (LanceDB)
- ✅ 7 templates predefinidos
- ✅ Validación de deploys
- ✅ Integración completa con Obsidian
- ✅ Indexación automática

**Todo está funcionando al 100%**

---

**¿Preguntas? Revisa:**
1. Este archivo (README.md)
2. OBSIDIAN_INTEGRATION.md para integración con Obsidian
3. CHEATSHEET.md para comandos rápidos
