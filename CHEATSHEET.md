# 🎯 Cheat Sheet - opencode-obsidian

## Comandos Rápidos (con prefijo -)

### 📥 Captura (1 segundo)
```
-c "Tengo que revisar el bug 28416"
-c "docker-compose logs -f servicio"
-c "Aprendí que se puede usar Redis para cache"
```

### 🚀 Deploys (Validación automática)
```
# ✅ CORRECTO - Con Azure ID
-c "git tag -a v2.8.3 -m '28416 fix OTP'"

# ❌ INCORRECTO - Sin Azure ID (será rechazado)
-c "git tag -a v2.8.3 -m 'fix general'"
```

### 📊 Tracking
```
-t 28416                          # Ver estado
-t 28416 status:"🟢 PROD"         # Actualizar a PROD
-t 28416 tag:v2.8.3               # Añadir tag
```

### 📅 Daily Standup
```
-d                                # Resumen de ayer
-d date:"2024-02-01"              # Fecha específica
```

### 🔍 Búsqueda
```
-f "comando docker"              # Búsqueda simple
-f "git rebase"                  # Buscar recursos

-idx                              # Indexar (primera vez)
-q "cómo solucioné el error 403"  # RAG semántico
-q "qué tareas tengo pendientes"  # Preguntas naturales
```

### 🛠️ Utilidades
```
-tpl                              # Ver templates
-?                                # Mostrar ayuda
```

## Flujos Completos

### 1. Nueva Tarea de Azure (30 segundos)

**Paso 1**: Capturar
```
-c "Implementar feature 28999 para exportar reportes en PDF"
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
-c "git tag -a v2.8.3 -m '28999 feat: PDF export'"
```
→ Actualiza tracker automáticamente a 🟢 PROD

### 2. Documentar Comando Útil (10 segundos)

```
-c "Comando útil: docker exec -it container_name psql -U user -d db"
```

→ Guarda en `recursos/docker-psql.md`

**Después buscar**:
```
-q "cómo me conecto a la base de datos de docker"
```

### 3. Preparar Daily (5 segundos)

```
-d
```

**Output**:
```markdown
# 📅 Daily Standup - Miércoles 5 de febrero

## ✅ Completado
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

### 4. Buscar Información Vieja (10 segundos)

**Escenario**: "¿Cómo era ese comando para ver logs?"

```
/ask qué comandos tengo sobre docker logs
```

**Resultado**:
```
🔍 Resultados para: "qué comandos tengo sobre docker logs"

1. **recursos/docker-logs.md** (relevancia: 95.3%)
   Comando útil: docker-compose logs -f --tail=100 nombre_servicio...

2. **daily/2024-02-04.md** (relevancia: 78.2%)
   Hoy aprendí a usar docker logs para debuggear...
```

### 5. Registrar Múltiples Deploys

```
/deploy 
# CKC_API_GATEWAY_REST
git tag -a v2.8.3 -m "28416 fix OTP"
git push --tags

# CKC_WEBSITE  
git tag -a v21.5.7 -m "28976 update styles"
git push --tags
```

→ Valida ambos tienen Azure ID
→ Actualiza ambos trackers a PROD

## Patrones de Texto Detectados

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

### Deploy Tags ❌ Rechazados:
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

### Deploy Tags ✅ Aceptados:
```bash
git tag -a v2.8.3 -m "28416 fix OTP"         ✅ Con Azure ID
git tag -a v2.8.3 -m "28999 feat PDF"        ✅ Con Azure ID
git tag -a v2.8.3 -m "28416 28999 fixes"     ✅ Múltiples IDs
```

## Tips y Trucos

### 💡 Tip 1: Sé específico en /ask
```
❌ /ask "docker"
✅ /ask "cómo ver logs de un container específico"
```

### 💡 Tip 2: Indexa después de muchas notas
```
/capture [muchas notas...]
/capture [más notas...]
/index          # Indexar para que RAG funcione bien
```

### 💡 Tip 3: Usa fechas en daily
```
/daily date:"2024-01-15"    # Revisar qué hiciste ese día
```

### 💡 Tip 4: Combina track y deploy
```
# Opción 1: Deploy automático (recomendado)
/deploy git tag -a v2.8.3 -m "28416 fix"
→ Actualiza tracker automáticamente

# Opción 2: Manual
/track 28416 status:"🟢 PROD" tag:v2.8.3
```

## Errores Comunes

### ❌ "Vault path is not set"
**Solución**: 
```
obsidian_set_vault
path: "C:/Users/.../vault"
```

### ❌ "El índice no existe"
**Solución**:
```
/index
```

### ❌ "Tag sin Azure ID"
**Solución**: Incluir ID en mensaje
```bash
git tag -a v2.8.3 -m "28416 descripción"
```

### ❌ Comando no encontrado
**Solución**: Reiniciar opencode

## Atajos Mentales

```
Necesito...                → Uso...
─────────────────────────────────────────
Guardar idea rápida        → /capture
Registrar deploy           → /deploy  
Ver qué hice ayer          → /daily
Buscar algo que escribí    → /ask
Ver estado tarea           → /track
Listar templates           → /templates
Indexar notas              → /index
```

## Checklist Diario

- [ ] Capturar tareas pendientes: `/capture ...`
- [ ] Revisar daily: `/daily`
- [ ] Registrar deploys: `/deploy ...`
- [ ] Buscar info si necesito: `/ask ...`

---

**¡Listo! Imprime esta hoja y tenla a mano.** 🚀
