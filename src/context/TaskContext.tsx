import React, { createContext, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  priority: 'alta' | 'media' | 'baja';
  completed: boolean;
  status?: 'pending_acceptance' | 'accepted' | 'declined' | 'expired' | 'cancelled_with_reason' | 'completed';
  userId?: string;
  groupId?: string;
  group_ids?: string[]; // Multiple groups
  createdBy?: string;
  isShared?: boolean;
  failureReason?: string;
  isGroupTask?: boolean; // Label for UI
  imageUrl?: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType>({} as TaskContextType);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Tasks with React Query
  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('mock_tasks');
        return saved ? JSON.parse(saved) : [];
      }

      // Fetch my memberships
      const { data: myMemberships } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');
      
      const myGroupIds = myMemberships?.map(m => m.group_id) || [];

      let query = supabase.from('tasks').select('*');

      if (!user.isSuperAdmin) {
        if (myGroupIds.length > 0) {
          query = query.or(`user_id.eq.${user.id},group_ids.overlap.{${myGroupIds.join(',')}}`);
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('time', { ascending: false });
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        userId: t.user_id,
        isShared: t.is_shared,
        createdBy: t.created_by,
        failureReason: t.failure_reason,
        imageUrl: t.image_url,
        isGroupTask: t.user_id !== user.id
      }));
    },
    enabled: !!user,
  });

  // Real-time Sync
  useEffect(() => {
    if (isSupabaseConfigured && user?.id) {
      const channel = supabase
        .channel('task-sync-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        })
        .subscribe();

      return () => { supabase.removeChannel(channel).catch(console.error); };
    }
  }, [isSupabaseConfigured, user?.id, queryClient]);

  // 2. Local Fallback Sync
  useEffect(() => {
    if (!isSupabaseConfigured && tasks.length > 0) {
      localStorage.setItem('mock_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isSupabaseConfigured]);

  // 3. Mutations
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      // 1. Sanitize for Supabase (Snake Case)
      const newTask: any = {
        title: taskData.title || '',
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time || '12:00',
        priority: taskData.priority || 'media',
        completed: taskData.completed || false,
        status: taskData.status || 'accepted',
        user_id: taskData.userId || user?.id,
        created_by: taskData.createdBy || user?.id,
        group_ids: taskData.group_ids || [],
        is_shared: taskData.isShared || false,
        image_url: taskData.imageUrl || null,
        description: taskData.description || null,
        failure_reason: taskData.failureReason || null
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) {
          console.error('Error inserting task:', error);
          throw error;
        }
        // Map keys to camelCase for UI consistency
        return {
          ...data,
          id: data.id,
          title: data.title,
          date: data.date,
          time: data.time,
          priority: data.priority,
          completed: data.completed,
          status: data.status,
          userId: data.user_id,
          isShared: data.is_shared,
          createdBy: data.created_by,
          failureReason: data.failure_reason,
          imageUrl: data.image_url,
          isGroupTask: data.user_id !== user?.id
        };
      } else {
        return { ...newTask, id: Math.random().toString(36).substring(7) };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      const dbUpdates: any = { ...updates };
      if (updates.userId) dbUpdates.user_id = updates.userId;
      if (updates.isShared) dbUpdates.is_shared = updates.isShared;
      if (updates.createdBy) dbUpdates.created_by = updates.createdBy;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        return { id, ...updates };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const addTask = async (task: Partial<Task>) => addTaskMutation.mutateAsync(task) as Promise<Task>;
  const updateTask = async (id: string, updates: Partial<Task>) => updateTaskMutation.mutateAsync({ id, updates }) as Promise<Task>;
  const deleteTask = async (id: string) => deleteTaskMutation.mutateAsync(id);

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTask, 
      deleteTask, 
      loading, 
      hasMore: false, 
      loadMore: async () => {}, 
      refreshTasks: async () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }) } 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
