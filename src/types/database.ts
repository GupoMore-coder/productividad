import type { ServiceOrder, OrderHistoryEntry } from '@/context/OrderContext';

// Tipos de la base de datos (snake_case) para mapeo seguro
export interface ServiceOrderDBRow {
  id: string;
  customer_name: string;
  customer_cedula?: string;
  customer_phone: string;
  customer_email?: string;
  services: string[];
  notes?: string;
  responsible?: string;
  created_at: string;
  delivery_date: string;
  created_by: string;
  created_by_role?: string;
  completed_at?: string;
  status: ServiceOrder['status'];
  payment_status: ServiceOrder['paymentStatus'];
  total_cost: number;
  deposit_amount: number;
  pending_balance: number;
  cancel_reason?: string;
  photos: string[];
  last_status_change_by?: string;
  is_demo?: boolean;
  is_test?: boolean;
  pdf_url?: string;
  pdf_expires_at?: string;
  record_type?: 'orden' | 'cotizacion';
  quote_items?: ServiceOrder['quoteItems'];
  quote_expires_at?: string;
  quote_extended_days?: number;
  order_history?: OrderHistoryDBRow[];
}

export interface OrderHistoryDBRow {
  id: string;
  order_id: string;
  timestamp: string;
  type: OrderHistoryEntry['type'];
  user_name: string;
  description: string;
}

export interface OrderUpdateDB {
  customer_name?: string;
  customer_cedula?: string;
  customer_phone?: string;
  customer_email?: string;
  services?: string[];
  notes?: string;
  responsible?: string;
  delivery_date?: string;
  status?: ServiceOrder['status'];
  payment_status?: ServiceOrder['paymentStatus'];
  total_cost?: number;
  deposit_amount?: number;
  pending_balance?: number;
  cancel_reason?: string;
  photos?: string[];
  last_status_change_by?: string;
  completed_at?: string | null;
  created_by_role?: string;
  quote_extended_days?: number;
  is_demo?: boolean;
  is_test?: boolean;
  record_type?: 'orden' | 'cotizacion';
  quote_items?: ServiceOrder['quoteItems'];
  quote_expires_at?: string | null;
  created_at?: string;
  created_by?: string;
  pdf_url?: string;
  pdf_expires_at?: string;
}
