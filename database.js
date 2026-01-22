// Конфигурация Supabase - ЗАМЕНИ НА СВОИ ЗНАЧЕНИЯ
const SUPABASE_CONFIG = {
    url: 'https://arcvzwxzohvbbwlmviit.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3Z6d3h6b2h2YmJ3bG12aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI1MDMsImV4cCI6MjA4NDY0ODUwM30.01LWHc3VZmCkLZdS07iPw-Q3elf89jOYiphkW1A0zvI'
};

// Проверяем, доступен ли Supabase
async function checkSupabaseConnection() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_CONFIG.key,
                'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка подключения к Supabase:', error);
        return false;
    }
}

// Инициализация Supabase
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url, 
    SUPABASE_CONFIG.key,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// Глобальный объект для работы с базой данных
window.database = {
    // Проверка подключения
    async checkConnection() {
        return await checkSupabaseConnection();
    },

    // Получить все проекты
    async getAllProjects() {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Ошибка при загрузке проектов:', error);
            return [];
        }
    },

    // Создать новый проект
    async createProject(project) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([project])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ошибка при создании проекта:', error);
            return null;
        }
    },

    // Получить идеи для проекта
    async getProjectIdeas(projectId) {
        try {
            const { data, error } = await supabase
                .from('ideas')
                .select('*')
                .eq('project_id', projectId)
                .order('votes', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Ошибка при загрузке идей:', error);
            return [];
        }
    },

    // Добавить идею
    async addIdea(idea) {
        try {
            const { data, error } = await supabase
                .from('ideas')
                .insert([idea])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ошибка при добавлении идеи:', error);
            return null;
        }
    },

    // Проголосовать за проект
    async voteForProject(projectId) {
        try {
            // Сначала получаем текущее значение
            const { data: project, error: fetchError } = await supabase
                .from('projects')
                .select('votes')
                .eq('id', projectId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Увеличиваем счетчик
            const newVotes = (project.votes || 0) + 1;
            
            const { error: updateError } = await supabase
                .from('projects')
                .update({ votes: newVotes })
                .eq('id', projectId);
            
            if (updateError) throw updateError;
            return true;
        } catch (error) {
            console.error('Ошибка при голосовании:', error);
            return false;
        }
    },

    // Проголосовать за идею
    async voteForIdea(ideaId) {
        try {
            const { data: idea, error: fetchError } = await supabase
                .from('ideas')
                .select('votes')
                .eq('id', ideaId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const newVotes = (idea.votes || 0) + 1;
            
            const { error: updateError } = await supabase
                .from('ideas')
                .update({ votes: newVotes })
                .eq('id', ideaId);
            
            if (updateError) throw updateError;
            return true;
        } catch (error) {
            console.error('Ошибка при голосовании за идею:', error);
            return false;
        }
    },

    // Получить статистику
    async getStats() {
        try {
            // Параллельно получаем данные
            const [projectsResponse, ideasResponse] = await Promise.all([
                supabase.from('projects').select('id'),
                supabase.from('ideas').select('id, votes')
            ]);
            
            if (projectsResponse.error) throw projectsResponse.error;
            if (ideasResponse.error) throw ideasResponse.error;
            
            const projectsCount = projectsResponse.data?.length || 0;
            const ideasCount = ideasResponse.data?.length || 0;
            const totalVotes = ideasResponse.data?.reduce((sum, idea) => sum + (idea.votes || 0), 0) || 0;
            
            return { projectsCount, ideasCount, totalVotes };
        } catch (error) {
            console.error('Ошибка при получении статистики:', error);
            return { projectsCount: 0, ideasCount: 0, totalVotes: 0 };
        }
    },

    // Поиск проектов
    async searchProjects(query) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Ошибка при поиске проектов:', error);
            return [];
        }
    }
};
