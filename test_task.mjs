import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://grsaehpmaihrztusehkb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I will get it from .env

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');

const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : supabaseUrl;
const key = keyMatch ? keyMatch[1].trim() : supabaseAnonKey;

const supabase = createClient(url, key);

async function testTaskInsert() {
  console.log('Testing task insert...');
  
  // First, authenticate as Fernando to get a valid token
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'fernando830609@gmail.com',
    password: 'Jota72345510*'
  });

  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in as:', userId);

  const testTask = {
    title: 'Test Task Script',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    priority: 'media',
    completed: false,
    status: 'accepted',
    user_id: userId,
    created_by: userId,
    group_ids: [],
    is_shared: false,
    description: null,
    failure_reason: null
  };

  const { data, error } = await supabase.from('tasks').insert(testTask);
  
  if (error) {
    console.error('Task Insert Error:', error);
  } else {
    console.log('Task inserted successfully:', data);
  }
}

testTaskInsert();
