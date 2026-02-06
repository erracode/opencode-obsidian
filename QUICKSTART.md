# 🚀 Guía de Inicio Rápido - opencode-obsidian

## Instalación (5 minutos)

### Opción 1: Instalador Automático (Windows)

1. Descarga el repo
2. Ejecuta `install.bat`
3. Sigue las instrucciones
4. Agrega la configuración MCP a tu `opencode.json`
5. Reinicia opencode

### Opción 2: Manual

```bash
# 1. Entrar al directorio
cd opencode-obsidian/mcp-server

# 2. Instalar dependencias
npm install

# 3. Compilar
npm run build

# 4. Configurar variable de entorno
setx OBSIDIAN_VAULT_PATH "C:\ruta\a\tu\vault"

# 5. Agregar a opencode.json
{
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "C:/ruta/a/opencode-obsidian/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}

# 6. Instalar skill
mklink /d %USERPROFILE%\.config\opencode\skills\opencode-obsidian C:\ruta\a\skill-opencode-obsidian
```

## Primeros Pasos

### 1. Verificar instalación
```
-?
```
Debería mostrar la lista de comandos disponibles.

### 2. Ver templates
```
-tpl
```
Debería mostrar los 7 templates disponibles.

### 3. Indexar tu vault (para RAG)
```
/index
```
Esto indexa todas tus notas para búsqueda semántica.

### 3. Capturar tu primera nota
```
/capture Tengo que revisar el bug 28416 en el gateway de pagos
```

## Comandos Esenciales

### 📥 Captura y Gestión
```
/capture "texto"              # Capturar nota rápida
/deploy "git tags"            # Registrar deploy (valida Azure ID)
/track 28416                  # Ver tracker de tarea
/track 28416 status:"🟢 PROD" tag:v2.8.3  # Actualizar tarea
```

### 📊 Daily y Resúmenes
```
/daily                        # Resumen de ayer
/daily date:"2024-02-01"      # Resumen de fecha específica
```

### 🔍 Búsqueda
```
/search "comando docker"      # Búsqueda simple
/ask "cómo solucioné el error 403"  # Búsqueda semántica (RAG)
```

### 🛠️ Utilidades
```
/index                        # Indexar vault para RAG
/templates                    # Listar templates
```

## Flujos de Trabajo Comunes

### Flujo 1: Nueva Tarea de Azure
```
/capture Tengo que implementar la feature 28999 para exportar reportes
→ Genera automáticamente:
   - entregas/28999-...
   - tracking/28999.md
   - proyectos/28999-context.md
```

### Flujo 2: Registrar Deploy
```
/deploy git tag -a v2.8.3 -m "28999 fix report export"
→ Valida que tenga Azure ID
→ Actualiza tracker 28999 a PROD
→ Cambia estado a 🟢 PROD
```

### Flujo 3: Daily Standup
```
/daily
→ Analiza todas las notas de ayer
→ Detecta tareas completadas
→ Muestra deploys realizados
→ Lista aprendizajes
```

### Flujo 4: Buscar Información
```
/ask qué comandos útiles tengo sobre docker
→ Busca semánticamente en todas las notas
→ Encuentra recursos relacionados
```

## Estructura del Vault

```
vault/
├── inbox/           # Notas rápidas (brain dump)
├── entregas/        # Templates Azure terminados
├── tracking/        # Seguimiento de tareas
├── daily/           # Daily notes
├── recursos/        # Comandos, snippets, aprendizajes
├── proyectos/       # Contextos para IA
└── templates/       # Templates personalizados
```

## Tips

1. **Siempre usa Azure ID** en los mensajes de git tags: `git tag -a v2.8.3 -m "28416 fix"`
2. **Indexa regularmente** si agregas muchas notas: `/index`
3. **Sé específico** en tus preguntas al usar `/ask`
4. **Los templates** se generan automáticamente, solo llénalos

## Solución de Problemas

### Error: "Vault path is not set"
**Solución**: Ejecuta `obsidian_set_vault` con la ruta de tu vault

### Error: "Configuration is invalid"
**Solución**: Verifica que tu `opencode.json` tenga el formato correcto (usa array para command)

### Error: "El índice no existe"
**Solución**: Ejecuta `/index` primero antes de usar `/ask`

### Los comandos no aparecen
**Solución**: Reinicia opencode completamente

## Ejemplos Reales

### Ejemplo 1: Bug en Producción
```
/capture URGENTE: Error 500 en el endpoint de pagos afectando usuarios
→ Genera entrega para reportar
→ Crea tracker con prioridad alta
```

### Ejemplo 2: Aprender algo nuevo
```
/capture Comando útil: docker-compose logs -f --tail=100 nombre_servicio
→ Guarda en recursos/
→ Disponible para búsqueda después
```

### Ejemplo 3: Preparar Daily
```
/daily
→ Revisa qué hiciste ayer
→ Prepara tu standup en 10 segundos
```

## Soporte

Si tienes problemas:
1. Verifica que Node.js esté instalado: `node --version`
2. Revisa que el build existe: `mcp-server/dist/index.js`
3. Confirma la configuración en `opencode.json`
4. Reinicia opencode

## Próximos Pasos

1. ✅ Comienza a capturar tus notas
2. ✅ Indexa tu vault: `/index`
3. ✅ Prueba el daily: `/daily`
4. ✅ Experimenta con RAG: `/ask`

**¡Listo! Ahora tienes un second brain funcional.** 🧠
