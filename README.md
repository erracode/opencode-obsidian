# opencode-obsidian

> Sistema inteligente de gestión de conocimiento que transforma notas desordenadas en entregables estructurados.  
> Inspirado en [gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian) de thoreinstein.

## 🚀 Instalación Rápida (3 pasos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/opencode-obsidian.git
cd opencode-obsidian
```

### 2. Ejecutar instalador

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

**Mac/Linux:**
```bash
bash install.sh
```

O usa el instalador universal:
```bash
node install.js
```

### 3. Reiniciar opencode

Cierra y vuelve a abrir opencode.

**Verifica la instalación:**
```
-?
```

---

## 🎮 Uso Rápido

### Comandos Cortos

| Comando | Significado | Descripción | Ejemplo |
|---------|-------------|-------------|---------|
| `-?` | **?** (ayuda) | Mostrar comandos disponibles | `-?` |
| `-c` | **C**apture | Capturar nota | `-c "Tengo que revisar bug 28416"` |
| `-f` | **F**ind | Buscar en vault | `-f "error 403"` |
| `-t` | **T**ask | Ver/actualizar tarea | `-t 28416` o `-t 28416 status:"PROD"` |
| `-d` | **D**aily | Resumen del día | `-d` |
| `-tpl` | **TPL** (templates) | Listar templates | `-tpl` |
| `-idx` | **IDX** (index) | Indexar vault | `-idx` |
| `-q` | **Q**uestion | Preguntar al vault | `-q "cómo solucioné el error"` |

### Flujo de Trabajo Típico

```bash
# 1. Ver ayuda y comandos disponibles
-?

# 2. Capturar idea rápida
-c "Implementar feature 29999 para exportar PDF"

# 3. Verificar se crearon los archivos
# → entregas/29999-...md
# → tracking/29999.md
# → proyectos/29999-context.md

# 4. Registrar deploy cuando termines (incluye Azure ID)
-c "git tag -a v2.9.0 -m '29999 feat: PDF export'"

# 5. Buscar información después
-f "comandos útiles docker"

# 6. Preparar daily
-d
```

---

## 📁 Estructura del Vault

```
~/opencode-vault/          # Tu vault (creado automáticamente)
├── 📁 inbox/              # Notas capturadas
├── 📁 entregas/           # Templates Azure
├── 📁 tracking/           # Seguimiento de tareas
├── 📁 daily/              # Daily notes
├── 📁 recursos/           # Comandos, snippets
├── 📁 proyectos/          # Contextos para IA
└── 📁 templates/          # 7 templates base
```

---

## 🔗 Integración con Obsidian

1. **Abre Obsidian**
2. **"Abrir carpeta como vault"**
3. **Selecciona:** `~/opencode-vault`
4. **¡Listo!**

Ahora puedes editar notas desde Obsidian y se sincronizan automáticamente.

---

## 🛠️ Solución de Problemas

### "Comandos no aparecen"
→ Reinicia opencode completamente

### "Vault path is not set"
→ Ejecuta el instalador de nuevo o ejecuta:
```
obsidian_set_vault
path: "/ruta/a/tu/vault"
```

### "Error en instalación"
→ Verifica que tienes Node.js instalado:
```bash
node --version  # Debe ser v18+
```

---

## 📚 Documentación Completa

- **QUICKSTART.md** - Guía de inicio rápido
- **CHEATSHEET.md** - Referencia de comandos  
- **OBSIDIAN_INTEGRATION.md** - Integración con Obsidian
- **SETUP_CHECKLIST.md** - Checklist de instalación

---

## 🙏 Créditos

- Inspirado en [gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian) de [thoreinstein](https://github.com/thoreinstein)
- Adaptado y extendido para Opencode
- Tecnologías: LanceDB, Transformers.js, MCP

## 📄 Licencia

ISC - Libre para usar, modificar y distribuir

---

**¿Listo? Empieza con:** `-c "Mi primera nota"`
