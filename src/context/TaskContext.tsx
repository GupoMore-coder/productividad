import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { SyncService } from '@/services/SyncService';
import { 
  scheduleTaskNotifications, 
  cancelTaskNotifications 
} from '@/services/NotificationsService';
import { addDays, addWeeks, addMonths, addYears, parseISO, format as formatDate } from 'date-fns';
import { triggerHaptic } from '@/utils/haptics';

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
  is_muted?: boolean;
  muted_alarms?: number[];
  isBirthday?: boolean;
  type?: 'task' | 'reminder';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  originalTaskId?: string; // To link recurring instances
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  extendTaskSeries: (task: Task) => Promise<void>;
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

  // 3. Fetch Profiles for Birthdays
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return JSON.parse(localStorage.getItem('mock_users_db') || '[]');
      }
      const { data, error } = await supabase.from('profiles').select('id, full_name, username, birth_date, role, avatar');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate Virtual Birthday Tasks
  const birthdayTasks = React.useMemo(() => {
    if (!user || allProfiles.length === 0) return [];
    
    const virtuals: Task[] = [];
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    allProfiles.forEach((p: any) => {
      if (p.id === user.id || !p.birth_date) return;
      
      const bday = new Date(p.birth_date);
      // Generate for current and next year to ensure visibility in future calendar views
      [currentYear, nextYear].forEach(year => {
        const dateStr = `${year}-${String(bday.getUTCMonth() + 1).padStart(2, '0')}-${String(bday.getUTCDate()).padStart(2, '0')}`;
        virtuals.push({
          id: `bday-${p.id}-${year}`,
          title: `🎂 Cumpleaños de ${p.full_name || p.username}`,
          date: dateStr,
          time: '08:00',
          priority: 'alta',
          completed: false,
          status: 'accepted',
          isBirthday: true,
          userId: p.id,
          description: `¡Hoy es el cumpleaños de ${p.full_name || p.username}! No olvides felicitarle. ✨`
        });
      });
    });
    return virtuals;
  }, [allProfiles, user]);

  // Merge server, offline and virtual data with Memoization for stability (Google level)
  const tasks = React.useMemo(() => {
    return [...offlineTasks, ...serverTasks, ...birthdayTasks];
  }, [offlineTasks, serverTasks, birthdayTasks]);

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
      if (isSupabaseConfigured) {
        const newTask = transformToDb(taskData, user?.id);
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) throw error;
        const mainTask = transformFromDb(data, user?.id);

        // Handle Recurrence Generation (If Reminder)
        if (mainTask.type === 'reminder' && mainTask.recurrence && mainTask.recurrence !== 'none') {
          const instances = generateRecurrenceInstances(mainTask);
          if (instances.length > 0) {
            const dbInstances = instances.map(inst => transformToDb(inst, user?.id));
            await supabase.from('tasks').insert(dbInstances);
          }
        }

        return mainTask;
      }
      
      // MODO LOCAL
      const localTask: Task = {
        ...transformToDb(taskData, user?.id),
        id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user?.id,
        isShared: taskData.isShared,
        createdBy: user?.id,
        completed: false,
      } as any;
      
      const instances = localTask.type === 'reminder' ? generateRecurrenceInstances(localTask) : [];
      const allToSave = [localTask, ...instances.map(inst => ({
        ...inst,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user?.id,
        completed: false
      }))];

      const storageKey = `mock_tasks_${user?.id}`;
      const existing: any[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...allToSave, ...existing]));
      
      for (const t of allToSave) {
        await scheduleTaskNotifications(t as Task);
      }

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
    failure_reason: taskData.failureReason || null,
    is_muted: taskData.is_muted || false,
    muted_alarms: taskData.muted_alarms || [],
    type: taskData.type || 'task',
    recurrence: taskData.recurrence || 'none',
    recurrence_interval: taskData.recurrenceInterval || 1,
    original_task_id: taskData.originalTaskId || null,
    recurrence_end_date: taskData.recurrenceEndDate || null
  });

  const generateRecurrenceInstances = (baseTask: Task): Partial<Task>[] => {
    const instances: Partial<Task>[] = [];
    if (!baseTask.recurrence || baseTask.recurrence === 'none') return [];
    
    let current = parseISO(baseTask.date);
    const interval = baseTask.recurrenceInterval || 1;
    const originalId = baseTask.id;
    
    let limit: Date;
    switch(baseTask.recurrence) {
      case 'daily': limit = addDays(current, 30); break;
      case 'weekly': limit = addMonths(current, 6); break; // 6 months for weekly
      case 'monthly': limit = addMonths(current, 12); break; // 12 months for monthly
      case 'yearly': limit = addYears(current, 2); break; // 2 years for yearly
      default: return [];
    }

    while (true) {
      let next: Date;
      switch(baseTask.recurrence) {
        case 'daily': next = addDays(current, interval); break;
        case 'weekly': next = addWeeks(current, interval); break;
        case 'monthly': next = addMonths(current, interval); break;
        case 'yearly': next = addYears(current, interval); break;
        default: return instances;
      }
      
      if (next > limit) break;
      current = next;

      instances.push({
        ...baseTask,
        id: undefined,
        date: formatDate(current, 'yyyy-MM-dd'),
        originalTaskId: originalId,
        recurrence: 'none' // Prevent nested recursion
      });
    }
    return instances;
  };

  const extendTaskSeries = async (task: Task) => {
    if (!task.recurrence || task.recurrence === 'none') return;
    triggerHaptic('medium');
    
    // Find already existing instances to find the true "last" date
    // For simplicity, we celebrate from the selected task's date
    const instances = generateRecurrenceInstances(task);
    if (instances.length > 0) {
      if (isSupabaseConfigured) {
        const dbInstances = instances.map(inst => transformToDb(inst, user?.id));
        await supabase.from('tasks').insert(dbInstances);
      } else {
        const storageKey = `mock_tasks_${user?.id}`;
        const existing: any[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const allToSave = instances.map(inst => ({
          ...transformToDb(inst, user?.id),
          id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: user?.id,
          completed: false
        }));
        localStorage.setItem(storageKey, JSON.stringify([...allToSave, ...existing]));
        for (const t of allToSave) {
          await scheduleTaskNotifications(t as any);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  const transformFromDb = (data: any, uid?: string): Task => ({
    ...data,
    userId: data.user_id,
    isShared: data.is_shared,
    createdBy: data.created_by,
    failureReason: data.failure_reason,
    imageUrl: data.image_url,
    recurrenceInterval: data.recurrence_interval,
    originalTaskId: data.original_task_id,
    recurrenceEndDate: data.recurrence_end_date,
    isGroupTask: data.user_id !== uid,
    muted_alarms: data.muted_alarms || []
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      const dbUpdates: any = { ...updates };
      if (updates.id) delete dbUpdates.id;
      if (updates.userId) dbUpdates.user_id = updates.userId;
      if (updates.isShared) dbUpdates.is_shared = updates.isShared;
      if (updates.createdBy) dbUpdates.created_by = updates.createdBy;
      if (updates.muted_alarms) dbUpdates.muted_alarms = updates.muted_alarms;
      if (updates.group_ids) dbUpdates.group_ids = updates.group_ids;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.recurrence) dbUpdates.recurrence = updates.recurrence;
      if (updates.recurrenceInterval) dbUpdates.recurrence_interval = updates.recurrenceInterval;
      if (updates.originalTaskId) dbUpdates.original_task_id = updates.originalTaskId;
      if (updates.recurrenceEndDate) dbUpdates.recurrence_end_date = updates.recurrenceEndDate;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      return { id, ...updates };
    },
    onSuccess: (data) => {
      // Re-schedule alarms with new data (is_muted, etc)
      if (data) {
        scheduleTaskNotifications(transformFromDb(data, user?.id));
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      }
      // Cancel local alarms
      await cancelTaskNotifications(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const addTask = async (task: Partial<Task>) => addTaskMutation.mutateAsync(task) as Promise<Task>;
  const updateTask = async (id: string, updates: Partial<Task>) => updateTaskMutation.mutateAsync({ id, updates }) as Promise<Task>;
  const deleteTask = async (id: string) => deleteTaskMutation.mutateAsync(id);

  // 4. In-App 1-Hour Notification Banner
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkOneHourAlarms = () => {
      const now = new Date();
      tasks.forEach(t => {
        if (t.completed || t.is_muted) return;
        const taskTime = new Date(`${t.date}T${t.time}:00`);
        const diffMs = taskTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        // Notify exactly at 60 minutes mark
        if (diffMinutes === 60) {
          triggerHaptic('warning');
          window.dispatchEvent(new CustomEvent('app:show-unified-alarm', {
            detail: {
              id: `alert-1h-${t.id}`,
              type: 'global',
              title: `En 1 Hora: ${t.title}`,
              body: t.description || `Tienes un compromiso programado a las ${t.time}. ¡Prepárate!`
            }
          }));
        }
      });
    };

    const alignTimeout = setTimeout(() => {
      checkOneHourAlarms();
      const interval = setInterval(checkOneHourAlarms, 60000);
      return () => clearInterval(interval);
    }, 60000 - (new Date().getSeconds() * 1000 + new Date().getMilliseconds()));

    return () => clearTimeout(alignTimeout);
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ 
      tasks, addTask, updateTask, deleteTask, extendTaskSeries, loading, 
      hasMore: false, loadMore: async () => {}, 
      refreshTasks: async () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }) } 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
