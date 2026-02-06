# 📦 opencode-obsidian - Resumen del Proyecto

## 🎯 Qué es

Un **sistema inteligente de gestión de conocimiento** que convierte tus notas desordenadas en entregables estructurados usando IA y templates automáticos.

## ✨ Features Implementadas

### ✅ Core Features (100%)
- [x] **Captura Inteligente** - Detecta Azure IDs, comandos, URLs automáticamente
- [x] **7 Templates Base** - azure-delivery, task-tracker, ai-context, daily-standup, bitbucket-prs, confluence-release
- [x] **Organización Automática** - Clasifica en carpetas (entregas, tracking, recursos, etc.)
- [x] **Validación de Deploys** - Rechaza git tags sin Azure ID
- [x] **Actualización Automática** - Actualiza trackers cuando detecta deploys

### ✅ Búsqueda y RAG (100%)
- [x] **Indexación** - Indexa todas las notas para búsqueda semántica
- [x] **RAG Local** - Usa Xenova/all-MiniLM-L6-v2 para embeddings
- [x] **Búsqueda Semántica** - `/ask "cómo solucioné el error 403"`
- [x] **Búsqueda Simple** - `/search "comando docker"`
- [x] **Fallback** - Si el modelo no carga, usa búsqueda por texto

### ✅ Daily Summaries (100%)
- [x] **Detección Automática** - Encuentra tareas completadas, en progreso, bloqueadas
- [x] **Deploys** - Lista deploys realizados
- [x] **Aprendizajes** - Extrae tips y comandos útiles
- [x] **Formato Profesional** - Listo para copiar a Slack/Azure

### ✅ Comandos Cortos (100%)
- [x] `/capture` - Capturar notas
- [x] `/deploy` - Registrar deploys
- [x] `/track` - Ver/actualizar trackers
- [x] `/daily` - Resumen del día
- [x] `/search` - Búsqueda simple
- [x] `/ask` - Búsqueda semántica (RAG)
- [x] `/index` - Indexar vault
- [x] `/templates` - Listar templates

### ✅ Instalación y Setup (100%)
- [x] **Instalador Windows** - `install.bat` automático
- [x] **Guía Quickstart** - Inicio rápido para nuevos usuarios
- [x] **Documentación Completa** - README, SKILL.md, guías
- [x] **Configuración MCP** - Lista para opencode

## 📁 Estructura del Proyecto

```
opencode-obsidian/
├── 📁 vault/                    # Tu vault de Obsidian
│   ├── 📁 inbox/               # Captura inicial
│   ├── 📁 entregas/            # Templates Azure
│   ├── 📁 tracking/            # Seguimiento
│   ├── 📁 daily/               # Daily notes
│   ├── 📁 recursos/            # Comandos, snippets
│   ├── 📁 proyectos/           # Contextos IA
│   └── 📁 templates/           # Templates personalizados
│
├── 📁 mcp-server/              # Servidor MCP (Node.js/TypeScript)
│   ├── 📁 src/
│   │   ├── 📄 index.ts        # Entry point + comandos
│   │   ├── 📁 core/
│   │   │   ├── 📄 vault.ts    # Gestión de archivos
│   │   │   ├── 📄 template-engine.ts  # Motor de templates
│   │   │   ├── 📄 detector.ts # Detectores de contenido
│   │   │   └── 📄 rag.ts      # RAG y búsqueda semántica
│   │   └── 📄 ...
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 gemini-extension.json
│
├── 📁 skill-opencode-obsidian/ # Skill para opencode
│   ├── 📄 SKILL.md             # Instrucciones principales
│   ├── 📁 templates/           # 7 templates base
│   └── 📁 references/          # Guías adicionales
│
├── 📄 README.md                # Documentación principal
├── 📄 QUICKSTART.md            # Guía de inicio rápido
├── 📄 CONFIG.md                # Guía de configuración
├── 📄 install.bat              # Instalador Windows
└── 📄 setup.sh                 # Setup Unix/Linux/Mac
```

## 🚀 Instalación

### Windows (Recomendado)
```batch
# 1. Descargar repo
# 2. Ejecutar
install.bat

# 3. Agregar a opencode.json
# 4. Reiniciar opencode
# 5. Listo!
```

### Manual
```bash
cd mcp-server
npm install
npm run build

# Configurar variable
setx OBSIDIAN_VAULT_PATH "C:\ruta\a\vault"

# Agregar a opencode.json
{
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "C:/ruta/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
```

## 📝 Uso Básico

### Capturar Nota
```
/capture Tengo que revisar el bug 28416 en el gateway
→ Crea entrega + tracker + contexto automáticamente
```

### Registrar Deploy
```
/deploy git tag -a v2.8.3 -m "28416 fix OTP"
→ Valida Azure ID
→ Actualiza tracker a PROD
```

### Daily Summary
```
/daily
→ Analiza notas del día anterior
→ Genera resumen completo
```

### Buscar con IA
```
/index                    # Indexar primero
/ask cómo solucioné el error 403
→ Busca semánticamente
→ Encuentra notas relacionadas
```

## 🎨 Personalización

### Crear Template Propio
1. Crear archivo en `vault/templates/mi-template.md`
2. Añadir frontmatter:
```yaml
---
name: mi-template
description: Descripción
triggers: ["keyword1", "keyword2"]
language: es
---
```
3. Usar placeholders: `{{variable}}`
4. Disponible inmediatamente

### Estructura de Carpetas
Puedes modificar la estructura en `vault/` según tus necesidades. El sistema se adapta automáticamente.

## 📊 Estadísticas

- **7 Templates** predefinidos
- **9 Comandos** cortos disponibles
- **2+2 Funciones** de búsqueda (simple + RAG)
- **0 Dependencias** externas (todo local)
- **∞ Posibilidades** de personalización

## 🔧 Tech Stack

- **TypeScript** - Lenguaje principal
- **Node.js** - Runtime
- **MCP SDK** - Protocolo de comunicación
- **Xenova/Transformers** - Embeddings locales
- **Glob** - Búsqueda de archivos
- **Gray-matter** - Frontmatter YAML

## 🎯 Casos de Uso

### Desarrollador Individual
- Capturar ideas rápidas
- Tracking de tareas Azure
- Documentar comandos útiles
- Preparar daily standups

### Equipo de Desarrollo
- Estandarizar entregas
- Compartir conocimiento
- Onboarding rápido
- Documentación viva

## 🚀 Roadmap Futuro

### Posibles Mejoras
- [ ] Exportar a PDF
- [ ] Integración con Slack
- [ ] Sync con Obsidian mobile
- [ ] Más templates (incidentes, RFCs)
- [ ] Dashboard web
- [ ] Colaboración multi-usuario
- [ ] Integración con Jira
- [ ] Métricas y analytics

## 🤝 Contribuir

1. Fork el repo
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -am 'Añadir nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Pull Request

## 📄 Licencia

ISC - Libre para usar, modificar y distribuir

## 🙏 Créditos

### Inspiración Original
Este proyecto está **inspirado y basado** en **[gemini-obsidian](https://github.com/thoreinstein/gemini-obsidian)** creado por **[Jimmy Beaudoin (thoreinstein)](https://github.com/thoreinstein)**.

Gemini-obsidian es una extensión MCP para Google Gemini CLI que permite interactuar con vaults de Obsidian mediante RAG y gestión de notas.

### Adaptaciones realizadas para Opencode:
- Migración de Gemini CLI a **Opencode**
- Simplificación de comandos (`/c`, `/f`, `/t`, `/d`, `/h`)
- **LanceDB** para búsqueda vectorial
- Indexación automática
- 7 templates predefinidos
- Validación de deploys
- Integración con Obsidian App
- Instalador Windows

### Tecnologías:
- **LanceDB** - Base de datos vectorial
- **Transformers.js** - Embeddings locales ([Xenova](https://github.com/xenova/transformers.js))
- **MCP SDK** - Model Context Protocol
- **Obsidian** - Sistema de notas markdown

---

**¡Listo para usar!** Tu second brain está configurado y funcionando. 🧠✨
