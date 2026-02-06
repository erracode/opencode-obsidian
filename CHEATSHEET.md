# 🎯 Cheat Sheet - opencode-obsidian

## Comandos Rápidos

### 📥 Captura (1 segundo)
```
>oo cap "Tengo que revisar el bug 28416"
>oo cap "docker-compose logs -f servicio"
>oo cap "Aprendí que se puede usar Redis para cache"
>oo cap -f meeting_notes.txt        # Desde archivo
```

### 🚀 Deploys (Validación automática)
```
# ✅ CORRECTO - Con Azure ID
>oo deploy "git tag -a v2.8.3 -m '28416 fix OTP'"

# ❌ INCORRECTO - Sin Azure ID (será rechazado)
>oo deploy "git tag -a v2.8.3 -m 'fix general'"

# Listar deploys
>oo deploys
```

### 📊 Tracking
```
>oo task 28416                          # Ver estado
>oo task 28416 status "🟢 PROD"         # Actualizar a PROD
>oo task 28416 tag v2.8.3               # Añadir tag
```

### 📅 Daily Standup
```
>oo daily                                # Resumen de ayer
>oo daily date "2024-02-01"              # Fecha específica
```

### 🔍 Búsqueda
```
>oo find "comando docker"              # Búsqueda simple
>oo find "git rebase"                  # Buscar recursos

>oo idx                                # Indexar (primera vez)
>oo ask "cómo solucioné el error 403"  # RAG semántico
>oo ask "qué tareas tengo pendientes"  # Preguntas naturales
```

### 🛠️ Utilidades
```
>oo tpl                                # Ver templates
>oo help                               # Mostrar ayuda
>oo read "tracking/28416.md"           # Leer nota
```

## Flujos Completos

### 1. Nueva Tarea de Azure (30 segundos)

**Paso 1**: Capturar
```
>oo cap "Implementar feature 28999 para exportar reportes en PDF"
```

**Resultado automático**:
- ✅ `entregas/28999-...md` - Template entrega Azure
- ✅ `tracking/28999.md` - Tracker de tarea
- ✅ `proyectos/28999-context.md` - Contexto para IA

**Paso 2**: Completar template
Abrir `entregas/28999-...md` y llenar:
- Contexto y objetivo
- Solución técnica
- Testing realizado
- Links de PR

**Paso 3**: Hacer deploy
```
>oo deploy "git tag -a v2.8.3 -m '28999 feat: PDF export'"
```
→ Actualiza tracker automáticamente a 🟢 PROD

### 2. Documentar Comando Útil (10 segundos)

```
>oo cap "Comando útil: docker exec -it container_name psql -U user -d db"
```

→ Guarda en `recursos/docker-psql.md`

**Después buscar**:
```
>oo ask "cómo me conecto a la base de datos de docker"
```

### 3. Preparar Daily (5 segundos)

```
>oo daily
```

**Output**:
```markdown
# 📅 Daily Standup - Miércoles 5 de febrero

## ✅ Completado Ayer
- [28416] [v2.8.6] Fix OTP validation in gateway

## 🔄 En Progreso
- [28999] Implementar export PDF

## 🚀 Deploys Realizados
- `CKC_API_GATEWAY_REST` → v2.8.6: 28416 fix OTP validation

## 💡 Aprendizajes del Día
- Comando útil: docker-compose logs -f --tail=100

## 📋 Plan para Hoy
_¿Qué vas a trabajar hoy? (Añade manualmente)_
```

**Copiar y pegar** en Slack/Azure/Teams ✅

## Patrones Detectados Automáticamente

### ✅ Se detecta automáticamente:
- **Azure IDs**: `28416`, `28976`, `2XXXX`
- **Git tags**: `git tag -a v2.8.3 -m "msg"`
- **Repos**: `CKC-API-GATEWAY`, `CKC_WEBSITE`
- **URLs**: `https://dev.azure.com/...`, PRs
- **Comandos**: `docker`, `git`, `npm`, etc.
- **Keywords**: "bug", "feature", "fix", "implementar"

### 📍 Se guarda automáticamente en:
- Azure ID → `entregas/` + `tracking/` + `proyectos/`
- Comando técnico → `recursos/`
- Idea general → `inbox/`
- Deploy tags → Actualiza `tracking/`

## Validaciones

### ❌ Rechazado:
```bash
git tag -a v2.8.3 -m "fix general"           ❌ Sin Azure ID
git tag -a v2.8.3 -m "varios fixes"          ❌ Sin Azure ID
git tag -a v2.8.3 -m "release"               ❌ Sin Azure ID
```

**Mensaje**: 
```
⚠️ DEPLOY TAGS SIN AZURE ID DETECTADOS
REQUERIDO: Usa formato: git tag -a vX.Y.Z -m "28416 descripción"
```

### ✅ Aceptado:
```bash
git tag -a v2.8.3 -m "28416 fix OTP"         ✅ Con Azure ID
git tag -a v2.8.3 -m "28999 feat PDF"        ✅ Con Azure ID
git tag -a v2.8.3 -m "28416 28999 fixes"     ✅ Múltiples IDs
```

## Tips

### 💡 Tip 1: Sé específico en ask
```
❌ ask "docker"
✅ ask "cómo ver logs de un container específico"
```

### 💡 Tip 2: Indexa después de muchas notas
```
>oo cap "muchas notas..."
>oo cap "más notas..."
>oo idx          # Indexar para que RAG funcione bien
```

### 💡 Tip 3: Usa fechas en daily
```
>oo daily date "2024-01-15"    # Revisar qué hiciste ese día
```

### 💡 Tip 4: Combina task y deploy
```
# Opción 1: Deploy automático (recomendado)
>oo deploy "git tag -a v2.8.3 -m '28416 fix'"
→ Actualiza tracker automáticamente

# Opción 2: Manual
>oo task 28416 status "🟢 PROD" tag v2.8.3
```

## Atajos Mentales

```
Necesito...                → Uso...
─────────────────────────────────────────
Guardar idea rápida        → >oo cap
Registrar deploy           → >oo deploy  
Ver qué hice ayer          → >oo daily
Buscar algo que escribí    → >oo find
Ver estado tarea           → >oo task
Listar templates           → >oo tpl
Indexar notas              → >oo idx
Ayuda                      → >oo help
```

---

**¡Listo! Imprime esta hoja y tenla a mano.** 🚀
