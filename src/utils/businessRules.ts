/**
 * Ecosistema de Reglas de Negocio Antigravity v3.0
 * Este archivo contiene la lógica pura, desacoplada de React, para facilitar
 * el testeo de estrés y la auditoría de seguridad.
 */

export interface TestUser {
  id: string;
  username: string;
  role: string;
  isMaster?: boolean;
}

/**
 * REGLA 1: Generación de Identificador Único
 * Los colaboradores SIEMPRE generan prefijo DEMO-
 * Los administrativos generan UUID (DB) o ID Real
 */
export function generateOrderId(user: TestUser, isMock: boolean = false): string {
  const isColaborador = user.role === 'Colaborador';
  
  if (isColaborador) {
    // Formato: DEMO-XXXX-USER
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DEMO-${random}-${user.username.toUpperCase()}`;
  }
  
  return isMock ? `ORD-REAL-${Math.floor(Math.random() * 999999)}` : 'UUID-FROM-DB';
}

/**
 * REGLA 2: Validación de Promoción "Limo"
 * Solo Master o CEO pueden promover una orden de demo a real.
 */
export function canPromoteOrder(user: TestUser): boolean {
  return user.role === 'Administrador maestro' || user.role === 'Director General (CEO)';
}

/**
 * REGLA 3: Visibilidad Directiva
 * Roles con acceso a métricas globales de BI
 */
export function hasElevatedDashboardAccess(user: TestUser): boolean {
  const elevatedRoles = [
    'Administrador maestro',
    'Director General (CEO)',
    'Gestor Administrativo',
    'Analista Contable'
  ];
  return elevatedRoles.includes(user.role);
}

/**
 * REGLA 4: Derivación Automática de Estado de Pago
 * Calcula el estado basado en el saldo pendiente sin intervención humana.
 */
export function derivePaymentStatus(total: number, deposit: number): 'pendiente' | 'abono' | 'pagado' {
  if (deposit <= 0) return 'pendiente';
  if (deposit >= total) return 'pagado';
  return 'abono';
}

/**
 * REGLA 5: Guarda de Despacho (v3.1)
 * Bloquea la entrega física si hay deuda, permitiendo bypass solo a Admin/Gestor.
 */
export function canCompleteOrder(order: { totalCost: number, depositAmount: number }, user: TestUser): { allowed: boolean; message?: string } {
  const pendingBalance = order.totalCost - order.depositAmount;
  const hasDebt = pendingBalance > 0;
  
  // Si no hay deuda, cualquiera puede completar
  if (!hasDebt) return { allowed: true };

  // Si hay deuda, solo Admin Maestro o Gestor Administrativo pueden forzar
  const isPrivileged = user.role === 'Administrador maestro' || user.role === 'Gestor Administrativo' || user.isMaster;
  
  if (isPrivileged) return { allowed: true };

  return { 
    allowed: false, 
    message: '⚠️ BLOQUEO FINANCIERO: Solo el "Administrador Maestro" o el "Gestor Administrativo" están facultados para liberar órdenes con saldos pendientes.' 
  };
}
