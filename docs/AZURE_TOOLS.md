# Azure DevOps Tools Reference

## Overview

Integración completa con Azure DevOps (cinemarkintl/Core Backend) para gestionar work items, crear tareas y publicar entregas directamente desde OpenCode.

## Available Commands

### `>oo azure` (azure_get_my_assignments)

Obtiene los work items asignados a ti en el proyecto Core Backend.

**Usage:**
```bash
>oo azure
```

**Output:**
- Lista de tareas agrupadas por estado
- Información de effort/completed/remaining
- Links a Azure DevOps

---

### `>oo review [id]` (azure_prepare_delivery)

Prepara un documento de entrega para un work item usando el template `azure-delivery`.

**Usage:**
```bash
>oo review 28719
```

**Features:**
- Obtiene datos de la tarea desde Azure DevOps
- Obtiene datos de la HU padre (si existe)
- Detecta información de git (rama, commits, PRs)
- Pre-llena el template con todas las variables
- Crea archivo en `vault/entregas/`

**Output:**
- Archivo generado con ruta
- Datos detectados (rama, commit, PR)
- Instrucciones para completar

**Next Steps:**
Completa las secciones faltantes en el archivo generado, luego usa `>oo comment [id]` para publicar.

---

### `>oo comment [id]` (azure_publish_comment)

Publica un comentario de entrega en Azure DevOps y cambia el estado a Resolved.

**Usage:**
```bash
>oo comment 28719
```

**Features:**
- Busca el archivo de entrega en `vault/entregas/`
- Extrae secciones relevantes del template
- Publica comentario formateado en Azure DevOps
- Cambia estado automáticamente a Resolved
- Crea/actualiza tracking en Obsidian

**Prerequisites:**
- Debe existir un archivo de entrega creado con `>oo review [id]`

---

### `>oo subtask [parent-id]` (azure_create_dev_task)

Crea una tarea DEV hija de una User Story en Azure DevOps.

**Usage:**
```bash
>oo subtask 28618
>oo subtask 28618 --effort 8
```

**Features:**
- Valida que el padre sea una User Story
- Crea Task con título: "Implementar [título de HU]"
- Asigna automáticamente al usuario actual
- Estado inicial: New
- Calcula remaining = effort (si se especifica)
- Crea tracking en Obsidian

**Parameters:**
- `parent_id`: ID de la HU padre (requerido)
- `effort`: Horas estimadas (opcional)

---

### `>oo hours [id] [completed]` (azure_update_hours)

Actualiza las horas completadas y calcula remaining automáticamente.

**Usage:**
```bash
>oo hours 28719 6
```

**Features:**
- Actualiza campo Completed Work
- Calcula automáticamente: Remaining = Effort - Completed
- Actualiza tracking en Obsidian (si existe)
- Sugerencia automática cuando se alcanza 100%

**Example:**
```
Effort: 8h
Completed: 6h  ← Tu input
Remaining: 2h  ← Calculado automáticamente
```

---

## Workflow Examples

### Daily Workflow

```bash
# 1. Revisar asignaciones
>oo azure

# 2. Preparar entrega de tarea completada
>oo review 28719

# 3. Completar el template en Obsidian
# (Editar vault/entregas/28719-*.md)

# 4. Publicar entrega
>oo comment 28719
```

### Sprint Planning

```bash
# Crear tareas DEV para HUs
>oo subtask 28618 --effort 8
>oo subtask 28620 --effort 13

# Los trackers se crean automáticamente en vault/tracking/
```

### Progress Tracking

```bash
# Actualizar horas diariamente
>oo hours 28719 2
>oo hours 28719 4
>oo hours 28719 8  # Al 100%, sugiere entregar
```

## Data Flow

```
Azure DevOps ←→ MCP Server ←→ Obsidian Vault
     ↓                ↓              ↓
 Work Items      API Client      Templates
     ↓                ↓              ↓
  Comments      Integration      Tracking
```

## Templates Integration

Los tools utilizan los templates existentes:

- **azure-delivery**: Para documentos de entrega
- **task-tracker**: Para tracking de tareas nuevas

Las variables se extraen automáticamente:
- Datos de Azure (título, descripción, effort, etc.)
- Datos de Obsidian (rama, repositorio, PR)
- Datos de git (último commit, archivos modificados)

## Error Messages

Los tools proporcionan mensajes de error claros:

- `AZURE_PAT no configurado` → Falta configurar el token
- `Work item #XXX no encontrado` → ID no existe o no tienes acceso
- `No se encontró archivo de entrega` → Usa `>oo review` primero
- `HU #XXX no es una User Story` → Usa ID de HU válido

## Tips

1. **Siempre usa `>oo review` antes de `>oo comment`**
2. **Mantén actualizado el tracking** con rama y PR info
3. **Actualiza horas regularmente** para tracking de progreso
4. **Las tareas se crean con estado New** - cámbialas a Active al iniciar

## See Also

- [Setup Guide](./AZURE_DEVOPS_SETUP.md) - Configuración del PAT
- [WIQL Queries](./WIQL_QUERIES.md) - Queries internas (opcional)
