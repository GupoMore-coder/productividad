import React, { createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

export interface Supplier {
  id: string;
  name: string;
  nit: string;
  categories: string[];
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  created_at: string;
}

export interface MissingItem {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  product_name: string;
  brand: 'More Paper' | 'More Design';
  quantity: string;
  status: 'agotado' | 'poco_stock' | 'normal';
  priority: 'baja' | 'media' | 'alta';
  is_approved: boolean;
  requested_by: string;
  requested_by_name: string;
  created_at: string;
}

interface InventoryContextType {
  suppliers: Supplier[];
  missingItems: MissingItem[];
  loading: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  addMissingItem: (item: Omit<MissingItem, 'id' | 'created_at' | 'is_approved' | 'requested_by' | 'requested_by_name'>) => Promise<void>;
  approveItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({} as InventoryContextType);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetching with React Query
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
     queryKey: ['suppliers'],
     queryFn: async () => {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) throw error;
        return data;
     },
     enabled: !!user
  });

  const { data: missingItemsRaw = [], isLoading: loadingMissing } = useQuery({
     queryKey: ['missing_items'],
     queryFn: async () => {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('missing_items').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
     },
     enabled: !!user && suppliers.length >= 0
  });

  const missingItems = missingItemsRaw.map(item => ({
     ...item,
     supplier_name: suppliers.find(s => s.id === item.supplier_id)?.name || 'Proveedor General'
  }));

  const loading = loadingSuppliers || loadingMissing;

  // 2. Mutations with Vanguard Sync
  const addSupplierMutation = useOfflineMutation(
    async (supplier: Omit<Supplier, 'id' | 'created_at'>) => {
      // Conflict detection: Same name or NIT
      const duplicate = suppliers.find(s => 
        s.name.toLowerCase() === supplier.name.toLowerCase() || 
        (supplier.nit && s.nit === supplier.nit)
      );
      
      if (duplicate) {
        triggerHaptic('error');
        throw new Error(`Ya existe un proveedor con este ${duplicate.nit === supplier.nit ? 'NIT' : 'Nombre'}.`);
      }

      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    { mutationKey: ['suppliers'], type: 'create_supplier', table: 'suppliers' }
  );

  const addMissingItemMutation = useOfflineMutation(
    async (item: any) => {
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase.from('missing_items').insert({
        ...item,
        requested_by: user.id,
        requested_by_name: user.full_name || user.username,
        is_approved: user.isSupervisor || user.isMaster || user.role === 'Director General (CEO)'
      }).select().single();

      if (error) throw error;
      return data;
    },
    { mutationKey: ['missing_items'], type: 'create_missing_item', table: 'missing_items' }
  );

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Supplier> }) => {
      const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      triggerHaptic('success');
    }
  });

  const approveItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('missing_items').update({ is_approved: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing_items'] });
      triggerHaptic('success');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('missing_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing_items'] });
      triggerHaptic('medium');
    }
  });

  const addSupplier = async (s: any) => { await addSupplierMutation.mutateAsync(s); };
  const updateSupplier = async (id: string, updates: any) => { await updateSupplierMutation.mutateAsync({ id, updates }); };
  const addMissingItem = async (item: any) => { await addMissingItemMutation.mutateAsync(item); };
  const approveItem = async (id: string) => { await approveItemMutation.mutateAsync(id); };
  const deleteItem = async (id: string) => { await deleteItemMutation.mutateAsync(id); };

  return (
    <InventoryContext.Provider value={{ suppliers, missingItems, loading, addSupplier, updateSupplier, addMissingItem, approveItem, deleteItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
