# 🚀 Guía de Inicio Rápido - opencode-obsidian

## Instalación (3 pasos)

### 1. Clonar y compilar

```bash
git clone https://github.com/erracode/opencode-obsidian.git
cd opencode-obsidian/mcp-server
npm install
npm run build
npm link
```

### 2. Configurar con wizard

```bash
oo-setup setup
```

El wizard:
- ✅ Detecta vaults de Obsidian existentes
- ✅ Crea estructura de carpetas necesaria
- ✅ Configura Azure DevOps (opcional)
- ✅ Valida conexión

### 3. Reiniciar opencode

Cierra y vuelve a abrir opencode.

---

## Verificar Instalación

```bash
oo-setup status
```

Deberías ver:
```
📊 opencode-obsidian - Estado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Vault: C:/Users/.../Obsidian Vault
   Notas: 48 archivos

🔗 Azure: cinemarkintl/Core Backend
   PAT: ****4eG6
   Estado: ✅ Válido

📊 RAG: ⚠️ No indexado
```

---

## Primeros Pasos

### 1. Indexar vault para RAG

```
>oo idx
```

### 2. Capturar primera nota

```
>oo cap "Tengo que revisar el bug 28416 en el gateway"
```

Esto crea automáticamente:
- `proyectos/28416-context.md`
- `tracking/28416.md`

### 3. Ver templates disponibles

```
>oo tpl
```

---

## Comandos Esenciales

### 📥 Captura

```
>oo cap "texto"              # Capturar nota rápida
>oo cap "Implementar 28999"  # Con Azure ID detectado
```

### 📊 Tracking

```
>oo task 28416               # Ver estado
>oo task 28416 status "🟢 PROD" tag v2.8.3  # Actualizar
```

### 📅 Daily

```
>oo daily                    # Resumen de ayer
>oo daily date "2026-02-01"  # Fecha específica
```

### 🔍 Búsqueda

```
>oo find "docker"            # Búsqueda simple
>oo ask "cómo solucioné el error 403"  # RAG semántico
```

---

## Flujo de Trabajo Típico

```
┌─────────────────────────────────────────────────────┐
│  1. Capturar idea                                   │
│     >oo cap "Implementar feature 28999"            │
│                                                     │
│  2. Trabajar en la tarea                            │
│     ...                                             │
│                                                     │
│  3. Actualizar estado                               │
│     >oo task 28999 status "🟡 STG"                  │
│                                                     │
│  4. Deploy                                          │
│     git tag -a v2.8.3 -m "28999 feat: PDF export"  │
│     >oo cap "git tag..."                            │
│                                                     │
│  5. Daily standup                                   │
│     >oo daily                                       │
└─────────────────────────────────────────────────────┘
```

---

## Detección Automática

El sistema detecta automáticamente:

| Patrón | Ejemplo | Acción |
|--------|---------|--------|
| Azure ID | `28416` | Crea tracker + entrega |
| Git tag | `git tag -a v2.8.3 -m "28416..."` | Actualiza tracker a PROD |
| Repositorio | `CKC-API-GATEWAY` | Tag para búsqueda |
| Comando técnico | `docker ps` | Guarda en recursos/ |

---

## Configuración

### Ver configuración actual

```bash
oo-setup status
```

### Modificar configuración

```bash
oo-setup config --vault "C:/nueva/ruta"
oo-setup config --org mi-organizacion
oo-setup config --project "Mi Proyecto"
```

### Archivos de configuración

| Archivo | Ubicación |
|---------|-----------|
| Config principal | `~/.config/opencode-obsidian/config.json` |
| Azure PAT | `.env.local` en el proyecto |
| RAG index | `~/.local/share/opencode-obsidian/lancedb/` |

---

## Tips

1. **Indexa regularmente** si agregas muchas notas: `>oo idx`
2. **Sé específico** en `>oo ask` para mejores resultados
3. **Usa Azure IDs** en mensajes de git tags para actualización automática
4. **Ejecuta `oo-setup status`** para diagnosticar problemas

---

## Solución de Problemas

### Error: "Vault path is not set"
```bash
oo-setup setup
```

### Error: "Azure PAT inválido"
```bash
# Verificar estado
oo-setup status

# Actualizar PAT en .env.local
AZURE_PAT=nuevo_pat_aqui
```

### Error: "RAG no funciona"
```
>oo idx
```

---

**¡Listo! Ahora tienes un second brain funcional.** 🧠
