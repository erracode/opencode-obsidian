---
name: ai-context
description: Prompt estructurado para editores IA
aliases: ["contexto", "prompt", "ia-context"]
triggers: ["contexto", "ia", "ai", "prompt"]
language: es
---

# ⚡ CONTEXTO DE TAREA: [{{azure_id}}] - {{titulo_tarea}}

## 🎯 OBJETIVO PRINCIPAL
{{objetivo_principal}}

## 📋 INFORMACIÓN DE AZURE (Contexto)
> {{contexto_azure}}

## 🛠️ REGLAS DE NEGOCIO / CRITERIOS (Priority)
{{reglas_negocio}}

## 💻 ESPECIFICACIONES TÉCNICAS (Subtask Dev)
- **Repositorio:** {{repositorio}}
- **Archivos Clave Sugeridos:** {{archivos_clave}}
- **Ramas Relacionadas:** {{ramas}}

## 🔍 CONTEXTO ADICIONAL
{{contexto_adicional}}

---

## 🤖 INSTRUCCIÓN PARA LA IA
Basado en lo anterior, realiza las siguientes acciones:
1. **Analiza** los archivos mencionados y busca dónde aplicar la lógica.
2. **Propón** un plan de implementación detallado antes de escribir código.
3. **Identifica** posibles efectos colaterales o "breaking changes".
4. Si es un Bug, busca la causa raíz del [Error X] en el flujo descrito.

¿Entendido? Por favor, empieza proponiendo el plan de acción.

---

*Contexto generado: {{fecha_generacion}} | Azure ID: {{azure_id}}*
