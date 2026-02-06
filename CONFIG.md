# Configuración de opencode-obsidian

## Variables de Entorno

### Obligatoria
```bash
export OBSIDIAN_VAULT_PATH="/ruta/completa/a/opencode-obsidian/vault"
```

### Opcionales
```bash
# Para debugging
export OBSIDIAN_DEBUG=true

# Para cambiar el modelo de embeddings (default: local)
export EMBEDDING_MODEL="Xenova/all-MiniLM-L6-v2"
```

## Configuración de MCP (opencode.json)

Ubicación: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "type": "local",
      "command": "node",
      "args": [
        "C:/Users/USUARIO/Documents/work/personal/opencode-obsidian/mcp-server/dist/index.js"
      ],
      "enabled": true
    }
  },
  "provider": {
    ...
  }
}
```

**Nota**: En Windows, usa forward slashes (/) en las rutas dentro de opencode.json

## Verificación de Instalación

Después de configurar, verifica que todo funciona:

```bash
# 1. Listar templates disponibles
obsidian_list_templates

# 2. Capturar una nota de prueba
obsidian_capture_note
content: "Tarea de prueba 99999 para verificar funcionamiento"

# 3. Verificar archivos creados
ls vault/inbox/
ls vault/tracking/
```

## Troubleshooting

### Error: "Vault path is not set"
Solución: Asegúrate de que la variable OBSIDIAN_VAULT_PATH esté configurada

### Error: "Cannot find module"
Solución: Ejecuta `npm install` y `npm run build` en la carpeta mcp-server

### Error: "Unknown tool"
Solución: Verifica que el MCP esté habilitado en opencode.json

## Configuración por Proyecto

Si trabajas en múltiples proyectos, puedes tener un vault por proyecto:

```bash
# Vault personal
export OBSIDIAN_VAULT_PATH="$HOME/Documents/work/personal/opencode-obsidian/vault"

# Vault trabajo (sobrescribe para sesión específica)
export OBSIDIAN_VAULT_PATH="$HOME/work/company-vault"
```

O usar el argumento `vault_path` en cada comando:
```
obsidian_capture_note
content: "nota"
vault_path: "/otro/vault"
```
