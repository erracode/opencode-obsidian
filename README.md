# opencode-obsidian

> Sistema inteligente de gestión de conocimiento que transforma notas desordenadas en entregables estructurados.

## 🚀 Instalación Rápida

### 1. Clonar y compilar

```bash
git clone https://github.com/erracode/opencode-obsidian.git
cd opencode-obsidian/mcp-server
npm install
npm run build
npm link
```

### 2. Configurar

```bash
oo-setup setup
```

El wizard te guiará para:
- Detectar vaults de Obsidian existentes
- Crear estructura de carpetas necesaria
- Configurar Azure DevOps (opcional)

### 3. Reiniciar opencode

Cierra y vuelve a abrir opencode.

**Verifica la instalación:**
```
>oo status
```

---

## 📋 Comandos CLI

| Comando | Descripción |
|---------|-------------|
| `oo-setup setup` | Wizard de configuración interactivo |
| `oo-setup status` | Ver estado actual del sistema |
| `oo-setup config` | Modificar configuración |

**Ejemplos:**
```bash
oo-setup setup                              # Configurar todo
oo-setup status                             # Ver estado
oo-setup config --vault "C:/ruta/al/vault"  # Cambiar vault
oo-setup config --org mi-organizacion       # Cambiar org Azure
```

---

## 📋 Comandos MCP (>oo)

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `>oo status` | Ver configuración actual | `>oo status` |
| `>oo cap` | Capturar nota | `>oo cap "Tengo que revisar bug 28416"` |
| `>oo find` | Buscar en vault | `>oo find "error 403"` |
| `>oo task` | Ver/actualizar tarea | `>oo task 28416` |
| `>oo daily` | Resumen del día | `>oo daily` |
| `>oo tpl` | Listar templates | `>oo tpl` |
| `>oo idx` | Indexar para RAG | `>oo idx` |
| `>oo ask` | Preguntar al vault | `>oo ask "cómo solucioné el error"` |
| `>oo help` | Mostrar ayuda | `>oo help` |

---

## 📁 Estructura del Vault

```
vault/
├── inbox/           # Notas capturadas
├── entregas/        # Templates Azure terminados
├── tracking/        # Seguimiento de tareas
├── daily/           # Daily notes
├── recursos/        # Comandos, snippets
├── proyectos/       # Contextos para IA
└── templates/       # Templates personalizados
```

---

## 📁 Estructura de Configuración (XDG)

```
~/.config/opencode-obsidian/
├── config.json      # Configuración principal

~/.local/share/opencode-obsidian/
├── lancedb/         # Índice RAG
```

---

## 🔗 Integración con Azure DevOps

El sistema se integra con Azure DevOps para:
- Ver tareas asignadas
- Preparar documentos de entrega
- Actualizar horas de trabajo
- Publicar comentarios

Configura Azure DevOps durante `oo-setup setup` o edita `.env.local`:

```bash
AZURE_PAT=tu_pat_aqui
AZURE_ORG=tu_organizacion
AZURE_PROJECT=tu_proyecto
```

---

## 🔗 Integración con Obsidian

1. **Abre Obsidian**
2. **"Abrir carpeta como vault"**
3. **Selecciona tu vault**
4. **¡Listo!**

Las notas se sincronizan automáticamente.

---

## 🛠️ Solución de Problemas

### "Comandos no aparecen"
→ Reinicia opencode completamente

### "Vault path is not set"
→ Ejecuta `oo-setup setup`

### "Azure PAT inválido"
→ Ejecuta `oo-setup status` para diagnosticar
→ Actualiza `.env.local` con PAT válido

### "RAG no funciona"
→ Ejecuta `>oo idx` para indexar el vault

---

## 📚 Documentación

- **QUICKSTART.md** - Guía de inicio rápido
- **CHEATSHEET.md** - Referencia de comandos

---

## 🙏 Créditos

- Inspirado en [gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian)
- Tecnologías: LanceDB, Transformers.js, MCP

## 📄 Licencia

ISC - Libre para usar, modificar y distribuir
