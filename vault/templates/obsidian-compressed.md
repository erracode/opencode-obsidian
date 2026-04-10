---
name: obsidian-compressed
description: Tracker comprimido para comentarios rápidos de Azure en Obsidian
triggers: ["comprimido", "compacto", "resumen", "azul", "comentario"]
language: es
---

## [{{azure_id}}] - {{titulo_corto}} #[{{detected_category}}]
- **Estado:** [🔴 LAB / 🟡 STG / 🟢 PROD] | **QA:** [✅ Revisado / ⏳ Pendiente] | **Cerrado:** [🏁 Sí / 🚧 No]
- **Repo:** `{{repositorio}}` | **Rama:** `feature/{{azure_id}}` | **Tag:** `{{version} / Pending]`
- **Links:** [🎫 Azure](https://dev.azure.com/{{azure_org}}/{{azure_project}}/_workitems/edit/{{azure_id}}) | [🚀 PR](N/A) | [📄 Docs](N/A)
- **Fecha:** {{fecha}}
- **Nota:** {{titulo}}

---

**Resumen de implementación:**
- ✅ Cambios principales: [Breve descripción]
- ⚠️ Breaking changes: [Sí/No]
- 🔧 Dependencias: [Actualizar si aplica]

**Notas adicionales:**
- [Cualquier información relevante]
