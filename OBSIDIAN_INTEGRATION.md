# 🔗 Guía de Integración con Obsidian App

Esta guía te muestra cómo usar tu vault de opencode-obsidian dentro de la aplicación Obsidian.

## 📥 Opción 1: Abrir como Carpeta (Recomendada)

Esta es la forma más rápida y mantiene todo funcionando correctamente.

### Pasos:

1. **Abre Obsidian** en tu computadora

2. **En la pantalla de inicio**, haz clic en:
   ```
   "Abrir carpeta como vault"
   ```
   (o "Open folder as vault" si está en inglés)

3. **Navega hasta:**
   ```
   C:\Users\Jesus\Documents\work\personal\opencode-obsidian\vault
   ```

4. **Haz clic en "Seleccionar carpeta"**

5. **¡Listo!** Obsidian abrirá tu vault con toda la estructura:
   ```
   📁 inbox/
   📁 entregas/
   📁 tracking/
   📁 proyectos/
   📁 recursos/
   📁 daily/
   📁 templates/
   📄 README.md
   ```

### Ventajas:
- ✅ Rápido de configurar
- ✅ Mantiene la sincronización con opencode
- ✅ Puedes editar notas desde Obsidian y opencode las lee
- ✅ Funciona inmediatamente

---

## 📦 Opción 2: Crear Vault Nuevo (Alternativa)

Si prefieres tener el vault en otra ubicación o con otro nombre.

### Pasos:

1. **Abre Obsidian**

2. **Clic en:**
   ```
   "Crear nuevo vault"
   ```

3. **Configura:**
   - **Nombre:** `opencode-vault` (o el que prefieras)
   - **Ubicación:** 
     ```
     C:\Users\Jesus\Documents\work\personal\opencode-obsidian\
     ```

4. **Abre el nuevo vault** (estará vacío)

5. **Copia el contenido** de la carpeta `vault/`:
   - Abre File Explorer
   - Ve a: `opencode-obsidian\vault\`
   - Selecciona todo (Ctrl+A)
   - Copia (Ctrl+C)
   - Ve a: `opencode-obsidian\opencode-vault\`
   - Pega (Ctrl+V)

6. **Ahora en Obsidian** verás todas las carpetas

### Ventajas:
- ✅ Puedes tener múltiples vaults
- ✅ Organización flexible
- ⚠️ Desventaja: Tienes que mantener sincronización manual

---

## 📱 Opción 3: Obsidian Sync (Premium)

Si tienes Obsidian Sync (pago), puedes acceder desde cualquier dispositivo.

### Configuración:

1. **En tu PC (con opencode):**
   - Abre el vault siguiendo Opción 1
   - Activa Obsidian Sync en configuración
   - Sincroniza

2. **En tu móvil/tablet:**
   - Abre Obsidian app
   - Inicia sesión con tu cuenta Sync
   - Descarga el vault
   - ¡Accede a tus notas desde cualquier lugar!

---

## 🎨 Configuración Recomendada en Obsidian

### Plugins Sugeridos

1. **Graph View** (viene por defecto)
   - Ver conexiones entre notas
   - Visualizar relaciones de tareas

2. **Templates** (viene por defecto)
   - Usar los templates de opencode-obsidian
   - Insertar templates rápidamente

3. **Daily Notes** (viene por defecto)
   - Complementa la carpeta daily/
   - Automatizar creación de daily notes

4. **Tag Wrangler** (comunidad)
   - Organizar tags
   - Renombrar tags masivamente

### Ajustes Recomendados

**1. Archivos y enlaces:**
```
Configuración → Archivos y enlaces
✅ Usar extensiones de archivo Markdown
✅ Detectar automáticamente todas las extensiones de archivo
```

**2. Apariencia:**
```
Configuración → Apariencia
Tema: Dracula o Similar (recomendado para código)
```

**3. Hotkeys:**
```
Configuración → Hotkeys
Crear atajo para: "Open today's daily note"
```

---

## 🔄 Flujo de Trabajo Recomendado

### Escenario 1: Captura rápida desde opencode

```
1. En opencode:
   /c "Tengo que revisar bug 28416"
   
2. Se crean automáticamente:
   - vault/entregas/28416-...md
   - vault/tracking/28416.md
   - vault/proyectos/28416-context.md
   
3. Abres Obsidian → editas el template
4. Completas la información de la entrega
5. Guardas
6. Listo para enviar a Azure
```

### Escenario 2: Uso de templates

```
1. En Obsidian:
   - Vas a templates/
   - Copias el template que necesitas
   - Lo pegas en entregas/
   - Lo editas
   
2. O más fácil:
   /c "descripción" en opencode
   → Se crea automáticamente con template
```

### Escenario 3: Búsqueda

```
1. En opencode:
   /f "error 403"
   
2. Te muestra las notas relevantes
   
3. En Obsidian:
   - Abres la nota
   - Ves el contenido completo
   - Editas si necesitas
```

---

## 📊 Estructura en Obsidian

Cuando abras el vault, verás:

```
📁 inbox/           ← Notas rápidas (capturadas con /c)
📁 entregas/        ← Entregas de Azure (generadas automáticamente)
📁 tracking/        ← Trackers de tareas (actualizados con deploys)
📁 proyectos/       ← Contextos para IA
📁 recursos/        ← Comandos, snippets (capturados automáticamente)
📁 daily/           ← Daily notes (generados con /d)
📁 templates/       ← Templates base (7 disponibles)
📄 README.md        ← Índice y guía
```

### Ejemplo de uso:

1. **Capturas en opencode:**
   ```
   /c "Comando útil: docker-compose logs -f"
   ```

2. **Va a:** `vault/recursos/docker-compose-logs.md`

3. **En Obsidian:**
   - Abres la nota
   - Le agregas más detalles
   - Le pones tags: #docker #comandos
   - Lo enlazas con otras notas

4. **Después buscas:**
   ```
   /f "comandos docker"
   ```

5. **Encuentras la nota** con el contexto completo

---

## ⚠️ Importante: Sincronización

### ¿Qué pasa si edito en Obsidian?

**Si editas una nota en Obsidian:**
- ✅ opencode puede leerla inmediatamente
- ✅ La búsqueda `/f` encontrará el contenido actualizado
- ✅ El RAG usará el contenido nuevo

### ¿Qué pasa si edito en opencode?

**Si usas `/c` para capturar:**
- ✅ Se crea la nota en el vault
- ✅ Se indexa automáticamente en LanceDB
- ✅ En Obsidian verás la nota nueva inmediatamente

### Regla de oro:

**¡Solo edita un archivo a la vez!**
- No edites el mismo archivo en Obsidian y opencode simultáneamente
- Guarda cambios antes de cambiar de app
- Obsidian auto-guarda, opencode guarda inmediatamente

---

## 🎯 Tips para Obsidian

### 1. Usa el Graph View

```
Presiona: Ctrl+G
```

Verás todas las notas como nodos conectados. Útil para ver:
- Qué tareas están relacionadas
- Cómo se conectan los comandos
- Clusters de conocimiento

### 2. Usa Tags

En las notas, agrega tags:
```markdown
#bug #docker #urgente #aprendizaje
```

Después puedes filtrar por tags.

### 3. Backlinks

Cuando mencionas otra nota:
```markdown
Véase también: [[28416-tracker]]
```

Obsidian crea automáticamente un enlace bidireccional.

### 4. Vista previa de templates

Antes de aplicar un template en opencode, puedes:
1. Ir a `templates/` en Obsidian
2. Leer el template
3. Ver qué campos necesitas
4. Preparar la información

---

## 🆘 Solución de Problemas

### "No veo las notas nuevas en Obsidian"

**Solución:**
1. En Obsidian, presiona: `Ctrl+R` (refrescar)
2. O cierra y abre Obsidian
3. Verifica que el vault esté en la ruta correcta

### "Las notas se ven raras/formateo extraño"

**Solución:**
1. Ve a Configuración → Editor
2. Desactiva "Strict line breaks"
3. Activa "Readable line length"

### "No puedo editar una nota"

**Verifica:**
- La nota no está abierta en otro programa
- Tienes permisos de escritura en la carpeta
- No es un archivo de sistema (como .obsidian-search-index)

---

## 📱 Acceso Móvil (Opcional)

### Si tienes Obsidian Sync:

1. **En móvil:** Abre Obsidian app
2. **Inicia sesión** con tu cuenta
3. **Descarga** el vault
4. **Consulta** tus notas desde cualquier lugar

### Sin Obsidian Sync:

1. **Usa cloud** (OneDrive, Dropbox, etc.)
2. **Sincroniza** la carpeta `vault/` 
3. **En móvil:** Abre archivos .md con cualquier editor
4. **Limitación:** No verás el grafo de conexiones

---

## ✅ Checklist de Verificación

- [ ] Vault abierto en Obsidian
- [ ] Veo todas las carpetas (inbox, entregas, tracking, etc.)
- [ ] Puedo crear/editar notas
- [ ] Puedo ver el graph (Ctrl+G)
- [ ] Las notas creadas con /c aparecen en Obsidian
- [ ] Puedo usar templates desde Obsidian
- [ ] Los cambios se guardan correctamente

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ opencode para captura rápida y búsqueda
- ✅ Obsidian para edición y visualización
- ✅ Integración completa entre ambos

**Tu flujo de trabajo ideal:**
1. Captura rápida con opencode (`/c`)
2. Edición detallada en Obsidian
3. Búsqueda inteligente con opencode (`/f`)
4. Todo sincronizado automáticamente

---

**¿Tienes algún problema con la integración?** Revisa la sección "Solución de Problemas" arriba.
