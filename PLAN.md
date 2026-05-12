# Plan de Proyecto - Antigravity PWA v.2026

**Última actualización:** Mayo 2026
**Estado del proyecto:** Activo - Desarrollo continuo

---

## Resumen Ejecutivo

El proyecto se encuentra en un estado **funcional y estable**. El build compila correctamente y todos los errores de TypeScript y React Hooks han sido resueltos.

---

## 1. Correcciones de Lint Completadas

### ✅ Prioridad ALTA - React Hooks exhaustivos (4/4 corregidos)

- [x] `CreateTaskModal.tsx:115` - Agregadas dependencias `fetchAllProfiles`, `user?.id`
- [x] `PresenceContext.tsx:130` - Agregada dependencia `updateLastSeen` (usando useCallback)
- [x] `TaskContext.tsx:465` - Agregada dependencia `user?.id`
- [x] `UnifiedAlarmModal.tsx:100` - playAlarmSound envuelto en useCallback

### ✅ Prioridad MEDIA - useMemo/useCallback optimizables (3/3 corregidos)

- [x] `ExecutiveSummaryModal.tsx:81` - Agregada dependencia `data`
- [x] `HelpManualModal.tsx:125` - Array `tabs` movido dentro de useMemo
- [x] `ImageZoomModal.tsx:14,19` - handleNext/handlePrev envueltos en useCallback

### ✅ Prioridad BAJA - Refactorizaciones varias (completadas)

- [x] `OrderContext.tsx:225` - Agregado eslint-disable para `let` (necesario para reassign)
- [x] Dependencias innecesarias `isSupabaseConfigured` removidas de:
  - GroupContext.tsx
  - OrderContext.tsx
  - TaskContext.tsx
  - Tasks.tsx

---

## 2. Advertencias Restantes (14 warnings)

### Arquitectura Context/Provider (12 warnings)
Estas advertencias indican que los archivos exportan tanto providers como hooks desde el mismo archivo. Son patrones válidos en React pero触发an el warning de fast-refresh. Para eliminarlas completamente se requeriría refactorización significativa (separar providers en archivos propios).

**Archivos afectados:**
- `context/ApprovalContext.tsx`
- `context/AuthContext.tsx`
- `context/GroupContext.tsx`
- `context/InventoryContext.tsx`
- `context/OrderContext.tsx`
- `context/PresenceContext.tsx`
- `context/TaskContext.tsx`
- `context/WhatsAppContext.tsx`
- `components/ui/button.tsx`

### Uso de variables no utilizadas (2 warnings)
- `useSyncManager.ts:70` - `_id` para destructuring (eslint-disable ya aplicado)
- `Tasks.tsx:518` - Parámetros de filtro no usados

---

## 3. Métricas de Salud del Proyecto

| Métrica | Estado | Antes | Target |
|---------|--------|-------|--------|
| Build | ✅ OK | ✅ OK | Verde |
| Lint Errors | ✅ 0 errores | 1 error | 0 |
| Lint Warnings | ⚠️ 14 advertencias | 22 advertencias | < 10 |
| Bundle Size | ⚠️ ~2.6MB total | ~2.6MB | < 2MB |
| Cobertura Tests | ❌ 0% | 0% | > 60% |

---

## 4. Archivos Modificados

### Correcciones de hooks y performance:
- `src/components/CreateTaskModal.tsx`
- `src/components/UnifiedAlarmModal.tsx`
- `src/components/ImageZoomModal.tsx`
- `src/components/HelpManualModal.tsx`
- `src/components/ExecutiveSummaryModal.tsx`
- `src/context/PresenceContext.tsx`
- `src/context/TaskContext.tsx`
- `src/context/GroupContext.tsx`
- `src/context/OrderContext.tsx`
- `src/hooks/useSyncManager.ts`

### Documentación:
- `PLAN.md` - Plan de proyecto creado

### Pendientes de commit:
- `recovery-codes Vercel.txt` (staged)
- Todos los archivos modificados listados arriba

---

## 5. Próximos Pasos Opcionales

1. **Refactorización arquitectónica** - Separar providers en archivos propios (12 warnings restantes)
2. **Lazy loading** - Implementar code-splitting para ImageZoomModal (102KB)
3. **Testing** - Activar suite de Vitest y agregar tests unitarios
4. **Bundle optimization** - Analizar y reducir tamaño total (~2.6MB)

---

*Plan actualizado: Mayo 2026 - Todas las correcciones de lint críticas completadas.*