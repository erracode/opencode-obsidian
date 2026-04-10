---
name: azure-delivery
description: Reporte formal de entrega Azure DevOps con estructura completa
triggers: ["azure", "entrega", "delivery", "tarea", "task", "release"]
language: es
---

# 🎉 [Tipo: FEATURE / BUGFIX / REFACTOR] - {{titulo}}

---

## 1. Contexto y Objetivo 🎯

* **Problema Resuelto / Valor Agregado:** {{contexto}}
* **Comportamiento Anterior:** {{comportamiento_anterior}}
* **Comportamiento Esperado:** {{comportamiento_esperado}}

---

## 2. Decisión de Diseño y Justificación 💡

> *Esta sección justifica la elección técnica (Robustez de Ideas).*

* **Solución Técnica Clave:** {{solucion_tecnica}}
* **Trade-offs (Ventajas/Desventajas):**
    * ✅ **Ventaja Principal:** {{ventaja}}
    * ❌ **Riesgo/Impacto Aceptado:** {{riesgo}}

---

## 3. Implementación y Trazabilidad 🔧

* **Repositorio(s) Afectado(s):** {{repositorios}}
* **Rama Desarrollo:** `{{rama}}`
* **Pull Request (PR):** {{pr_link}}
* **Archivos Clave Modificados:** {{archivos}}
* **Fix / Commit Cherry-Picked (si aplica):** {{commit}}

---

## 4. Testing y Validación QA 🧪

### Deploy de Laboratorio
* **[LINK de Deploy/Lab]:** {{deploy_link}}
* **[LINK de Postman (si es Backend)]:** {{postman_link}}

### Pasos Críticos de Validación
* [ ] **Caso 1: Flujo Éxito.** {{caso_exito}}
* [ ] **Caso 2: Backward Compatibility / Casos Borde.** {{caso_borde}}
* [ ] **Caso 3: Error Controlado.** {{caso_error}}

---

## 5. Monitoreo y Tracking 📈

* [ ] **Verificación de Ambiente:** Confirmar que la lógica distingue entre **ambiente de Desarrollo (LAB)** y **Producción**.
* [ ] **Métricas de Éxito:** {{metricas}}

---

## 6. Documentación y Release 🚀

### Estatus de Despliegue (Control de Entregas)
* [ ] **Desarrollo/Laboratorio (LAB):** ✅ Listo para QA / ❌ Pendiente
* [ ] **Staging/QA:** ✅ Aprobado / ❌ En Prueba
* [ ] **Producción (PROD):** ✅ Desplegado / ❌ Pendiente

### Trazabilidad del Release
* **Versión de Release (Tag):** `{{version}}`
* **Fecha Estimada de Prod:** {{fecha_prod}}
* **Link/Tag del Deploy:** {{deploy_tag}}

### Alcance y Notas
* **Wiki de Feature:** {{wiki_link}}
* **Criticidad:** 🟡 Media / 🟢 Low / 🔴 High
* **Backward Compatible:** ✅ Yes / ❌ No
* **Notas Adicionales:** {{notas}}

---

*Azure ID: {{azure_id}} | Generado: {{fecha_generacion}}*
