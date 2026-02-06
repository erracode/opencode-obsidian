---
name: daily-standup
description: Resumen para daily meetings y standups
triggers: ["daily", "standup", "resumen", "ayer", "summary"]
language: es
---

# Daily Standup - {{fecha}}

## ✅ Completado Ayer
{{tareas_completadas_ayer}}

## 🔄 En Progreso Hoy
{{tareas_en_progreso}}

## 📋 Plan para Hoy
{{plan_hoy}}

## 🚧 Bloqueos / Impedimentos
{{bloqueos}}

## 💡 Aprendizajes / Notas
{{aprendizajes}}

---

*Generado: {{fecha_generacion}} | Basado en actividad de: {{fecha_referencia}}*
