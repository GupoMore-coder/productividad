import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { SyncService } from '@/services/SyncService';

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
  group_ids?: string[];
  createdBy?: string;
  isShared?: boolean;
  failureReason?: string;
  isGroupTask?: boolean;
  imageUrl?: string;
  isOfflinePending?: boolean; // New flag for UI indicator
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
  const [offlineTasks, setOfflineTasks] = useState<Task[]>([]);

  // 1. Fetch Tasks with React Query (Vanguard Hybrid)
  const { data: serverTasks = [], isLoading: loading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (!isSupabaseConfigured) {
        // MODO LOCAL: lee tareas de localStorage filtrando por usuario
        const saved = localStorage.getItem(`mock_tasks_${user.id}`);
        const allTasks: Task[] = saved ? JSON.parse(saved) : [];
        return allTasks;
      }

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

  // 2. Poll for Offline Pending Tasks (Persistent Visibility)
  useEffect(() => {
    const fetchOffline = async () => {
      const queue = await SyncService.getQueue();
      const pendingTasks = queue
        .filter(a => a.endpoint === 'tasks' && a.type === 'create_task')
        .map(a => ({
          ...a.payload,
          id: a.id,
          isOfflinePending: true,
          // Map back to CamelCase for the UI
          userId: a.payload.user_id,
          isShared: a.payload.is_shared,
          createdBy: a.payload.created_by,
          isGroupTask: a.payload.user_id !== user?.id
        }));
      setOfflineTasks(pendingTasks);
    };

    fetchOffline();
    const t = setInterval(fetchOffline, 5000); 
    return () => clearInterval(t);
  }, [user?.id]);

  // Merge server and offline data
  const tasks = [...offlineTasks, ...serverTasks];

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

  // 3. Mutations
  const addTaskMutation = useOfflineMutation(
    async (taskData: Partial<Task>) => {
      const newTask = transformToDb(taskData, user?.id);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) throw error;
        return transformFromDb(data, user?.id);
      }
      // MODO LOCAL: persiste en localStorage
      const localTask: Task = {
        ...newTask,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: newTask.user_id,
        isShared: newTask.is_shared,
        createdBy: newTask.created_by,
        failureReason: newTask.failure_reason,
        imageUrl: newTask.image_url,
        isGroupTask: false,
        completed: false,
      } as Task;
      const storageKey = `mock_tasks_${user?.id}`;
      const existingRaw = localStorage.getItem(storageKey);
      const existing: Task[] = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(storageKey, JSON.stringify([localTask, ...existing]));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      return localTask;
    },
    {
      mutationKey: ['tasks'],
      type: 'create_task',
      table: 'tasks',
      transform: (variables) => transformToDb(variables, user?.id)
    }
  );

  const transformToDb = (taskData: Partial<Task>, uid?: string) => ({
    title: taskData.title || '',
    date: taskData.date || new Date().toISOString().split('T')[0],
    time: taskData.time || '12:00',
    priority: taskData.priority || 'media',
    completed: taskData.completed || false,
    status: taskData.status || 'accepted',
    user_id: taskData.userId || uid,
    created_by: taskData.createdBy || uid,
    group_ids: taskData.group_ids || [],
    is_shared: taskData.isShared || false,
    image_url: taskData.imageUrl || null,
    description: taskData.description || null,
    failure_reason: taskData.failureReason || null
  });

  const transformFromDb = (data: any, uid?: string) => ({
    ...data,
    userId: data.user_id,
    isShared: data.is_shared,
    createdBy: data.created_by,
    failureReason: data.failure_reason,
    imageUrl: data.image_url,
    isGroupTask: data.user_id !== uid
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
      }
      return { id, ...updates };
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
      tasks, addTask, updateTask, deleteTask, loading, 
      hasMore: false, loadMore: async () => {}, 
      refreshTasks: async () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }) } 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
