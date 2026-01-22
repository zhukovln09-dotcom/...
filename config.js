// Получите эти ключи из настроек вашего проекта Supabase
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co'; // Замените на ваш URL
const SUPABASE_KEY = 'sb_publishable_RPZBZKwZ_0IfYoYPHV3Dqg_j1q6e2SD'; // Замените на ваш public key

// Инициализация Supabase клиента
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
