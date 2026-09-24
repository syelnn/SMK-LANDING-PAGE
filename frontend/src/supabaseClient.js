import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frbzmhcvxofzocmhyrka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYnptaGN2eG9mem9jbWh5cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjY5MjIsImV4cCI6MjEwNTcwMjkyMn0.PyjrMAaUUMXRljPmzAnp7kKOfedMKIVsFFt4T79bqbk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);