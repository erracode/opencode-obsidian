# Azure DevOps Integration Setup

## Configuración del Personal Access Token (PAT)

### Paso 1: Generar tu PAT en Azure DevOps

1. Ve a: https://dev.azure.com/cinemarkintl/_usersSettings/tokens
2. Click en **"New Token"**
3. Configuración:
   - **Name:** `OpenCode-Integration`
   - **Organization:** `cinemarkintl`
   - **Expiration:** 90 days (recomendado)
   - **Scopes:**
     - ✅ **Work Items:** Full
     - ✅ **Code:** Read
     - ✅ **Project and Team:** Read
4. Click **"Create"**
5. **¡IMPORTANTE!** Copia el token inmediatamente (solo se muestra una vez)

### Paso 2: Configurar en tu máquina local

1. Abre el archivo:
   ```
   C:\Users\Jesus\Documents\work\personal\opencode-obsidian\mcp-server\.env.local
   ```

2. Completa las variables:
   ```bash
   AZURE_PAT=tu_token_aqui_pega_el_token_copiado
   AZURE_ORG=cinemarkintl
   AZURE_PROJECT=Core Backend
   AZURE_AREA=Core Backend
   ```

3. Guarda el archivo

### Paso 3: Verificar configuración

Después de configurar el PAT, prueba la conexión:

```bash
cd mcp-server
npm run build
```

Si no hay errores, la configuración es correcta.

## Seguridad

⚠️ **IMPORTANTE:**
- El archivo `.env.local` nunca se sube a Git (está en `.gitignore`)
- Cada usuario debe tener su propio PAT
- El PAT expira cada 90 días (debes renovarlo)
- No compartas tu PAT con nadie

## Solución de problemas

### Error: "AZURE_PAT no configurado"
- Verifica que el archivo `.env.local` exista
- Verifica que la variable `AZURE_PAT` tenga tu token
- Reinicia OpenCode después de configurar

### Error: "401 Unauthorized"
- Tu PAT puede haber expirado
- Ve a Azure DevOps y genera uno nuevo
- Actualiza el archivo `.env.local`

### Error: "404 Not Found"
- Verifica que el work item ID exista
- Verifica que estés usando el proyecto correcto (`Core Backend`)
