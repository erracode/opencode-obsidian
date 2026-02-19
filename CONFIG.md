# Configuración de opencode-obsidian

## Configuración con CLI

```bash
# Configurar todo (wizard interactivo)
oo-setup setup

# Ver estado actual
oo-setup status

# Modificar configuración
oo-setup config --vault "C:/ruta/al/vault"
oo-setup config --org mi-organizacion
oo-setup config --project "Mi Proyecto"
```

---

## Archivos de Configuración

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `config.json` | `~/.config/opencode-obsidian/` | Configuración principal |
| `.env.local` | Directorio del proyecto | Azure PAT |
| `lancedb/` | `~/.local/share/opencode-obsidian/` | Índice RAG |

---

## config.json

```json
{
  "version": "1.0.0",
  "vault": {
    "path": "C:/Users/Jesus/Documents/Obsidian Vault",
    "lastAccessed": "2026-02-19T10:00:00Z"
  },
  "azure": {
    "organization": "cinemarkintl",
    "project": "Core Backend",
    "patLast4": "4eG6"
  }
}
```

---

## .env.local (Azure DevOps)

```bash
AZURE_PAT=tu_personal_access_token
AZURE_ORG=tu_organizacion
AZURE_PROJECT=tu_proyecto
```

**Obtener PAT:**
1. Ve a https://dev.azure.com/tu_org/_usersSettings/tokens
2. Crea un nuevo token con permisos "Work Items (Read & Write)"
3. Copia el token a `.env.local`

---

## Migración desde versión anterior

Si tienes configuración en `~/.opencode-obsidian.config.json`, `oo-setup setup` la migrará automáticamente a la nueva ubicación XDG.

---

## Multi-vault

Para usar un vault diferente temporalmente:

```
>oo cap "nota" vault_path: "/otro/vault"
```

O cambiar la configuración:

```bash
oo-setup config --vault "/otro/vault"
```

---

## Troubleshooting

### Ver todo el estado

```bash
oo-setup status
```

### Reconfigurar desde cero

```bash
# Borrar configuración existente
rm ~/.config/opencode-obsidian/config.json

# Ejecutar setup
oo-setup setup
```

### PAT no funciona

1. Verifica que no haya expirado
2. Verifica que tenga permisos correctos
3. Ejecuta `oo-setup status` para validar conexión
