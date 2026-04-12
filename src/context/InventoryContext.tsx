import React, { createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';

export interface Supplier {
  id: string;
  name: string; // Nombre Comercial
  nit: string; // NIT / ID
  categories: string[];
  contact_person: string; // Contacto Principal
  phone: string; // Mantenido para compatibilidad interna
  secondary_contact?: string; // Nuevo: WhatsApp / Tel
  email: string;
  social_links?: string[]; // Nuevo: Redes Sociales
  address?: string;
  created_at: string;
}

export interface MissingItem {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  category: string;
  lifecycle_status: 'pending' | 'approved' | 'completed';
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  requested_by_role?: string;
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
  categories: string[];
  loading: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  addMissingItem: (item: Omit<MissingItem, 'id' | 'created_at' | 'is_approved' | 'requested_by' | 'requested_by_name'>, role?: string) => Promise<void>;
  updateMissingItem: (id: string, updates: Partial<MissingItem>) => Promise<void>;
  completeItem: (id: string, user: { id: string, name: string }) => Promise<void>;
  approveItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({} as InventoryContextType);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetching with React Query
  const { data: suppliersRaw = [], isLoading: loadingSuppliers } = useQuery({
     queryKey: ['suppliers'],
     queryFn: async () => {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) throw error;
        return data;
     },
     enabled: !!user
  });

  const suppliers = suppliersRaw.map((s: any) => ({
     ...s,
     categories: Array.from(new Set((s.categories || []) as string[]))
  }));
  
  const { data: categoriesData = [], isLoading: loadingCategories } = useQuery({
     queryKey: ['inventory_categories'],
     queryFn: async () => {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('inventory_categories').select('name').order('name');
        if (error) throw error;
        // Normalize categories from DB
        return Array.from(new Set(data.map((c: any) => c.name.trim().toUpperCase())));
     },
     enabled: !!user
  });

  const baseCategories = ['PAPELERÍA', 'DISEÑO', 'INSUMOS', 'LOGÍSTICA', 'TECNOLOGÍA', 'PIÑATERÍA', 'CAJAS', 'GOLOSINAS'];
  const categories = categoriesData.length > 0 ? categoriesData : baseCategories;

  const { data: missingItemsRaw = [], isLoading: loadingMissing } = useQuery({
     queryKey: ['missing_items'],
     queryFn: async () => {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('missing_items').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((item: any) => ({
           ...item,
           category: item.category?.trim().toUpperCase() || 'GENERAL'
        }));
     },
     enabled: !!user && suppliersRaw.length >= 0
  });

  const missingItems = missingItemsRaw.map(item => ({
     ...item,
     supplier_name: suppliers.find(s => s.id === item.supplier_id)?.name || 'Proveedor General'
  }));
  
  const loading = loadingSuppliers || loadingMissing || loadingCategories;

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

      const sanitized = {
        ...supplier,
        categories: Array.from(new Set(supplier.categories.map(c => c.trim().toUpperCase())))
      };

      const { data, error } = await supabase.from('suppliers').insert(sanitized).select().single();
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

  const updateSupplierMutation = useOfflineMutation(
    async ({ id, updates }: { id: string, updates: Partial<Supplier> }) => {
      // Conflict detection for updates
      const duplicate = suppliers.find(s => 
        s.id !== id && (
          (updates.name && s.name.toLowerCase() === updates.name.toLowerCase()) || 
          (updates.nit && s.nit === updates.nit)
        )
      );
      
      if (duplicate) {
        triggerHaptic('error');
        throw new Error(`Ya existe otro proveedor con este ${duplicate.nit === updates.nit ? 'NIT' : 'Nombre'}.`);
      }

      const sanitizedUpdates = {
        ...updates,
        categories: updates.categories ? Array.from(new Set(updates.categories.map(c => c.trim().toUpperCase()))) : undefined
      };

      const { data, error } = await supabase.from('suppliers').update(sanitizedUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    { mutationKey: ['suppliers'], type: 'update_supplier', table: 'suppliers' }
  );

  const approveItemMutation = useOfflineMutation(
    async (id: string) => {
      const { data, error } = await supabase.from('missing_items')
        .update({ 
          is_approved: true, 
          lifecycle_status: 'approved' 
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    { mutationKey: ['missing_items'], type: 'approve_missing_item', table: 'missing_items' }
  );

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

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      triggerHaptic('warning');
    }
  });

  const updateMissingItemMutation = useOfflineMutation(
    async ({ id, partialUpdates }: { id: string, partialUpdates: any }) => {
      const sanitized = { ...partialUpdates };
      if (sanitized.category) sanitized.category = sanitized.category.trim().toUpperCase();

      const { data, error } = await supabase.from('missing_items')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    { 
      mutationKey: ['missing_items'], 
      type: 'update_missing_item', 
      table: 'missing_items'
    }
  );

  const completeItemMutation = useOfflineMutation(
    async ({ id, user }: { id: string, user: { id: string, name: string } }) => {
      const { data, error } = await supabase.from('missing_items').update({ 
        lifecycle_status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        completed_by_name: user.name
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    { mutationKey: ['missing_items'], type: 'update_missing_item_completed', table: 'missing_items' }
  );

  const addSupplier = async (s: any) => { await addSupplierMutation.mutateAsync(s); };
  const updateSupplier = async (id: string, updates: any) => { await updateSupplierMutation.mutateAsync({ id, updates }); };
  const addMissingItem = async (item: any, role?: string) => { 
    const needsApproval = role === 'Consultora de Ventas';
    await addMissingItemMutation.mutateAsync({ 
      ...item, 
      requested_by_role: role, 
      lifecycle_status: needsApproval ? 'pending' : 'approved', 
      is_approved: !needsApproval 
    }); 
  };
  const updateMissingItem = async (id: string, partialUpdates: any) => { 
    await updateMissingItemMutation.mutateAsync({ id, partialUpdates }); 
  };
  const completeItem = async (id: string, user: any) => { 
    await completeItemMutation.mutateAsync({ id, user }); 
  };
  const approveItem = async (id: string) => { await approveItemMutation.mutateAsync(id); };
  const deleteItem = async (id: string) => { await deleteItemMutation.mutateAsync(id); };
  const deleteSupplier = async (id: string) => { await deleteSupplierMutation.mutateAsync(id); };

  const addCategory = async (name: string) => {
    if (!isSupabaseConfigured) return;
    const normalized = name.trim().toUpperCase();
    if (!normalized) return;
    if (categories.includes(normalized)) {
      triggerHaptic('error');
      alert(`La especialidad "${normalized}" ya existe.`);
      return;
    }

    const { error } = await supabase.from('inventory_categories').insert({ name: normalized });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['inventory_categories'] });
    triggerHaptic('success');
  };

  const deleteCategory = async (name: string) => {
    if (!isSupabaseConfigured || !user) return;
    // Security check (master/ceo) - though UI handles it, context enforces
    const isAuth = user.isMaster || user.role === 'Director General (CEO)';
    if (!isAuth) throw new Error('No autorizado para eliminar categorías');

    // 1. Delete from categories table
    const { error: delError } = await supabase.from('inventory_categories').delete().eq('name', name);
    if (delError) throw delError;

    // 2. Cascade to suppliers (array_remove)
    // Supabase can't do array_remove easily via simple update for all rows without a function
    // but we can try to do it via a more complex query or multiple updates if needed.
    // However, the cleanest way is a RPC or just updating relevant suppliers.
    const suppliersWithCat = suppliers.filter(s => s.categories && s.categories.includes(name));
    for (const s of suppliersWithCat) {
      await supabase.from('suppliers')
        .update({ categories: s.categories.filter((c: string) => c !== name) })
        .eq('id', s.id);
    }

    // 3. Update missing items (set to General if applicable)
    await supabase.from('missing_items')
      .update({ category: 'GENERAL' })
      .eq('category', name);

    queryClient.invalidateQueries({ queryKey: ['inventory_categories'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['missing_items'] });
    triggerHaptic('warning');
  };

  return (
    <InventoryContext.Provider value={{ suppliers, missingItems, categories, loading, addSupplier, updateSupplier, addMissingItem, updateMissingItem, completeItem, approveItem, deleteItem, deleteSupplier, addCategory, deleteCategory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
