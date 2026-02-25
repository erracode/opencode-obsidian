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

### 2. Configurar Azure PAT

Crear archivo `.env.local` en `opencode-obsidian/mcp-server/`:

```bash
AZURE_PAT=tu_personal_access_token
AZURE_ORG=cinemarkintl
AZURE_PROJECT=Core Backend
```

### 3. Ejecutar setup

```bash
oo-setup setup
```

El wizard te guiará para:
- Detectar vaults de Obsidian existentes
- Crear estructura de carpetas necesaria
- Validar conexión Azure

### 4. Reiniciar opencode

**Verifica la instalación:**
```
>oo status
```

---

## 📋 Comandos CLI

| Comando | Descripción |
|---------|-------------|
| `oo-setup setup` | Wizard de configuración |
| `oo-setup status` | Ver estado actual |
| `oo-setup config` | Modificar configuración |

---

## 📋 Comandos MCP (>oo)

### Estado y Notas

| Comando | Descripción |
|---------|-------------|
| `>oo status` | Ver configuración actual |
| `>oo help` | Mostrar ayuda completa |
| `>oo cap "texto"` | Capturar nota |
| `>oo find "query"` | Buscar en vault |
| `>oo task <id>` | Ver/actualizar tarea |
| `>oo daily` | Resumen del día |
| `>oo idx` | Indexar para RAG |
| `>oo ask "pregunta"` | Preguntar al vault |

### Azure DevOps

| Comando | Descripción |
|---------|-------------|
| `>oo azure` | Ver mis tareas asignadas |
| `>oo deliver 28999` | Preparar documento de entrega |
| `>oo comment 28999` | Publicar comentario y resolver |
| `>oo subtask 28618` | Crear tarea DEV hija |
| `>oo hours 28999 4` | Actualizar horas trabajadas |

---

## 📌 Flujo Azure Típico

```
1. >oo azure              → Ver tareas asignadas
2. >oo deliver 28999      → Preparar documento de entrega
3. (Editar documento en Obsidian)
4. >oo comment 28999      → Publicar y resolver
```

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

## 📁 Estructura de Configuración

```
opencode-obsidian/mcp-server/
├── .env.local           # Azure PAT (IMPORTANTE)

~/.config/opencode-obsidian/
├── config.json          # Configuración principal

~/.local/share/opencode-obsidian/
├── lancedb/             # Índice RAG
```

---

## 🔗 Integración con Obsidian

1. **Abre Obsidian**
2. **"Abrir carpeta como vault"**
3. **Selecciona tu vault**
4. **¡Listo!**

---

## 🛠️ Solución de Problemas

### "Azure PAT inválido"
```bash
# Verificar estado
oo-setup status

# El .env.local debe estar en:
opencode-obsidian/mcp-server/.env.local
```

### "Comandos no aparecen"
→ Reinicia opencode

### "RAG no funciona"
→ Ejecuta `>oo idx`

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
