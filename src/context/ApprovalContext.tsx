import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { triggerCriticalAlert } from '../services/NotificationsService';

export interface ApprovalRequest {
  id: string;
  type: 'reactivacion_orden' | 'faltante_inventario' | 'modificacion_financiera';
  source_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  requested_by_name: string;
  created_at: string;
  details: any;
}

interface ApprovalContextType {
  requests: ApprovalRequest[];
  loading: boolean;
  createRequest: (type: ApprovalRequest['type'], source_id: string, details: any) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
}

const ApprovalContext = createContext<ApprovalContextType>({} as ApprovalContextType);

export const ApprovalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    };

    fetchRequests();

    // Real-time subscription for Master/CEO/Supervisor
    const subscription = supabase
      .channel('approval_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'approval_requests' }, (payload) => {
        const newReq = payload.new as ApprovalRequest;
        
        // Alertas críticas para los que aprueban
        if (
          (user.isMaster || user.role === 'Director General (CEO)') || 
          (user.isSupervisor && newReq.type === 'faltante_inventario')
        ) {
          triggerCriticalAlert(
            '🔔 Nueva Solicitud de Aprobación',
            `Tipo: ${newReq.type.replace('_', ' ')}\nSolicitado por: ${newReq.requested_by_name}`
          );
        }
        
        setRequests(prev => [newReq, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'approval_requests' }, (payload) => {
        const updated = payload.new as ApprovalRequest;
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createRequest = async (type: ApprovalRequest['type'], source_id: string, details: any) => {
    if (!user) return;
    
    const { error } = await supabase.from('approval_requests').insert({
      type,
      source_id,
      details,
      requested_by: user.id,
      requested_by_name: user.full_name || user.username,
      status: 'pending'
    });

    if (error) throw error;
  };

  const approveRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('approval_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (error) throw error;
  };

  const rejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('approval_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;
  };

  return (
    <ApprovalContext.Provider value={{ requests, loading, createRequest, approveRequest, rejectRequest }}>
      {children}
    </ApprovalContext.Provider>
  );
};

export const useApprovals = () => useContext(ApprovalContext);
