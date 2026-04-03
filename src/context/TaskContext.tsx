import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // 1. Initial Load & Real-time Sync
  const loadTasks = async (isLoadMore = false) => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem('mock_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
        setHasMore(false);
      }
      setLoading(false);
      return;
    }

    try {
      if (!isLoadMore) {
        setLoading(true);
        setPage(0);
      }
      
      const currentPage = isLoadMore ? page + 1 : 0;

      // Fetch my memberships
      const { data: myMemberships } = await supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');
      
      const myGroupIds = myMemberships?.map(m => m.group_id) || [];

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' });

      if (myGroupIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},group_ids.overlap.{${myGroupIds.join(',')}}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error, count } = await query
        .order('date', { ascending: false }) // Newer tasks first for better infinite scroll UX
        .order('time', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
      
      if (data) {
        const mappedData = data.map(t => ({
          ...t,
          userId: t.user_id,
          isShared: t.is_shared,
          createdBy: t.created_by,
          failureReason: t.failure_reason,
          imageUrl: t.image_url,
          isGroupTask: t.user_id !== user.id
        }));

        if (isLoadMore) {
          setTasks(prev => [...prev, ...mappedData]);
        } else {
          setTasks(mappedData);
        }
        
        if (count !== null) {
          setHasMore((isLoadMore ? tasks.length + mappedData.length : mappedData.length) < count);
        }
        if (isLoadMore) setPage(currentPage);
      }
      if (error) console.error('Error fetching tasks:', error);
    } catch (err) {
      console.error('Task load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    if (isSupabaseConfigured && user?.id) {
      const channel = supabase
        .channel('task-sync-complex')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          loadTasks();
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'group_memberships', 
          filter: `user_id=eq.${user.id}` 
        }, () => {
          loadTasks();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel).catch(console.error); };
    }
  }, [isSupabaseConfigured, user?.id]);

  // 2. Local Fallback Sync
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('mock_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isSupabaseConfigured]);

  const addTask = async (taskData: Partial<Task>) => {
    const newTask: any = {
      title: taskData.title || '',
      date: taskData.date || new Date().toISOString().split('T')[0],
      time: taskData.time || '12:00',
      priority: taskData.priority || 'media',
      completed: false,
      status: 'accepted',
      user_id: user?.id,
      created_by: user?.id,
      group_ids: taskData.group_ids || [],
      is_shared: taskData.isShared || false,
      ...taskData
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
      if (error) throw error;
      return {
        ...data,
        userId: data.user_id,
        isShared: data.is_shared,
        createdBy: data.created_by,
        imageUrl: data.image_url
      };
    } else {
      const mockTask = { ...newTask, id: Math.random().toString(36).substring(7) } as Task;
      setTasks(prev => [...prev, mockTask]);
      return mockTask;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Map camelCase to snake_case for Supabase
    const dbUpdates: any = { ...updates };
    if (updates.userId) dbUpdates.user_id = updates.userId;
    if (updates.isShared) dbUpdates.is_shared = updates.isShared;
    if (updates.createdBy) dbUpdates.created_by = updates.createdBy;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
      if (error) throw error;
      return {
        ...data,
        userId: data.user_id,
        isShared: data.is_shared,
        createdBy: data.created_by,
        imageUrl: data.image_url
      };
    } else {
      let updatedTask: Task | undefined;
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          updatedTask = { ...t, ...updates };
          return updatedTask;
        }
        return t;
      }));
      return updatedTask!;
    }
  };

  const deleteTask = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, loading, hasMore, loadMore: () => loadTasks(true), refreshTasks: () => loadTasks(false) }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
