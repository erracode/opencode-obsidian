---
name: task-tracker
description: Resumen compacto para tracking personal de tareas
triggers: ["tracking", "tracker", "seguimiento", "resumen"]
language: es
---

## [{{azure_id}}] - {{titulo_corto}} #{{tipo_tarea}}

- **Estado:** {{estado}} | **QA:** {{estado_qa}} | **Cerrado:** {{cerrado}}
- **Repo:** `{{repositorio}}` | **Rama:** `{{rama}}` | **Tag:** `{{tag_version}}`
- **Links:** [🎫 Azure]({{azure_link}}) | [🚀 PR]({{pr_link}}) | [📄 Docs]({{wiki_link}})
- **Fecha:** {{fecha}}
- **Nota:** {{nota_resumen}}

---

### Historial de Cambios
{{historial}}

### Tags de Deploy
{{deploy_tags}}

*Actualizado: {{fecha_actualizacion}}*
