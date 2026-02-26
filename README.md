# opencode-obsidian

Sistema de gestión de conocimiento que transforma notas en entregables estructurados con integración Azure DevOps y capacidades RAG locales.

---

## 🚀 Instalación Rápida (5 minutos)

### Requisitos Previos
- **Opencode** instalado: `npm install -g opencode`
- **Node.js** 18+
- **Git**

### Instalación Completa

```bash
# 1) Clonar el proyecto
git clone https://github.com/erracode/opencode-obsidian.git
cd opencode-obsidian/mcp-server

# 2) Ejecutar setup (hace TODO automáticamente)
npx oo-setup setup
```

El setup automáticamente:
- ✅ Verifica si opencode está instalado
- ✅ Instala dependencias si faltan (`npm install`)
- ✅ Compila el proyecto si hace falta (`npm run build`)
- ✅ Configura el MCP en `opencode.json`
- ✅ Detecta tu vault de Obsidian
- ✅ Crea la estructura de carpetas
- ✅ Copia los templates
- ✅ Configura Azure DevOps (opcional)

### Después del Setup

```bash
# Reinicia opencode completamente
# Luego verifica que todo funciona:
>oo status
>oo azure    # si configuraste Azure
>oo idx      # para RAG
```

---

## 🔧 Instalación Manual (sin el wizard)

Si prefieres hacer todo paso a paso:

```bash
# 1) Clonar
git clone https://github.com/erracode/opencode-obsidian.git
cd opencode-obsidian/mcp-server

# 2) Instalar dependencias
npm install

# 3) Compilar
npm run build

# 4) Configurar MCP manualmente
# Edita ~/.config/opencode/opencode.json y agrega:
{
  "mcp": {
    "opencode-obsidian": {
      "type": "local",
      "command": ["node", "ruta/al/proyecto/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}

# 5) Configurar Azure (opcional)
# Crea mcp-server/.env.local:
AZURE_PAT=tu_token
AZURE_ORG=tu_org
AZURE_PROJECT=tu_proyecto

# 6) Setup del vault
npx oo-setup setup

# 7) Reiniciar opencode
```

---

## 📋 Comandos

| Comando | Descripción |
|--------|-------------|
| `>oo help` | Mostrar comandos |
| `>oo status` | Ver configuración |
| `>oo cap "texto"` | Capturar nota |
| `>oo find "query"` | Buscar vault |
| `>oo daily` | Resumen daily |
| `>oo azure` | Tareas Azure |
| `>oo deliver <id>` | Preparar entrega |
| `>oo comment <id>` | Publicar y resolver |
| `>oo idx` | Indexar RAG |

---

## 📁 Estructura del Vault

```
vault/
├── inbox/         # Notas capturadas
├── entregas/     # Documentos de entrega
├── tracking/     # Seguimiento tareas
├── daily/        # Daily notes
├── recursos/     # Comandos, snippets
├── proyectos/    # Contexto IA
└── templates/   # Templates
```

---

## 📄 Templates

| Template | Uso |
|----------|-----|
| `azure-delivery` | Entrega Azure |
| `task-tracker` | Seguimiento |
| `daily-standup` | Daily standup |
| `bitbucket-pr-*` | PRs |
| `ai-context` | Contexto IA |

Uso: `>oo create <azure_id> <template>`

---

## ⚠️ Solución de Problemas

**401 al obtener tareas Azure**
→ PAT sin permisos. Scopes: Work Items Read/Write/Manage, Project and Team Read

**Comandos no aparecen**
→ Reiniciar opencode completamente

**RAG no funciona**
→ `>oo idx`

**MCP no carga**
→ Verificar en `~/.config/opencode/opencode.json` que existe `opencode-obsidian`

---

## 🏗️ Arquitectura

```
mcp-server/
├── src/cli/       # CLI
├── src/core/     # RAG, config, vault
├── src/azure/    # Azure DevOps
└── dist/        # Compilado
```

Tecnologías: LanceDB, Transformers.js, MCP SDK

---

## 📝 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para detalles.

### v1.1.0
- Comandos Azure: `>oo azure`, `>oo deliver`, `>oo comment`, `>oo subtask`, `>oo hours`
- Setup wizard automático: `oo-setup` ahora hace todo
- Prefijo `>oo` para comandos

### v1.0.0
- RAG con LanceDB
- 7 templates
- Integración Obsidian

---

## 🙏 Créditos

Inspirado en [gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian)

Tecnologías: LanceDB, Transformers.js, MCP SDK

---

## 📄 Licencia

ISC
