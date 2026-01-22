// Замени эти значения на свои из Supabase
const SUPABASE_URL = 'https://arcvzwxzohvbbwlmviit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyY3Z6d3h6b2h2YmJ3bG12aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzI1MDMsImV4cCI6MjA4NDY0ODUwM30.01LWHc3VZmCkLZdS07iPw-Q3elf89jOYiphkW1A0zvI';

// Инициализируем подключение к Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Экспортируем функции для работы с базой данных
window.database = {
    // Получить все проекты
    async getAllProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Ошибка при загрузке проектов:', error);
            return [];
        }
        
        return data || [];
    },

    // Создать новый проект
    async createProject(project) {
        const { data, error } = await supabase
            .from('projects')
            .insert([project])
            .select();
        
        if (error) {
            console.error('Ошибка при создании проекта:', error);
            return null;
        }
        
        return data ? data[0] : null;
    },

    // Получить идеи для проекта
    async getProjectIdeas(projectId) {
        const { data, error } = await supabase
            .from('ideas')
            .select('*')
            .eq('project_id', projectId)
            .order('votes', { ascending: false });
        
        if (error) {
            console.error('Ошибка при загрузке идей:', error);
            return [];
        }
        
        return data || [];
    },

    // Добавить идею
    async addIdea(idea) {
        const { data, error } = await supabase
            .from('ideas')
            .insert([idea])
            .select();
        
        if (error) {
            console.error('Ошибка при добавлении идеи:', error);
            return null;
        }
        
        return data ? data[0] : null;
    },

    // Проголосовать за проект
    async voteForProject(projectId) {
        // Получаем текущее количество голосов
        const { data: project } = await supabase
            .from('projects')
            .select('votes')
            .eq('id', projectId)
            .single();
        
        if (project) {
            const newVotes = project.votes + 1;
            const { data, error } = await supabase
                .from('projects')
                .update({ votes: newVotes })
                .eq('id', projectId)
                .select();
            
            if (error) {
                console.error('Ошибка при голосовании:', error);
                return false;
            }
            
            return true;
        }
        
        return false;
    },

    // Проголосовать за идею
    async voteForIdea(ideaId) {
        const { data: idea } = await supabase
            .from('ideas')
            .select('votes')
            .eq('id', ideaId)
            .single();
        
        if (idea) {
            const newVotes = idea.votes + 1;
            const { data, error } = await supabase
                .from('ideas')
                .update({ votes: newVotes })
                .eq('id', ideaId)
                .select();
            
            if (error) {
                console.error('Ошибка при голосовании за идею:', error);
                return false;
            }
            
            return true;
        }
        
        return false;
    },

    // Получить статистику
    async getStats() {
        const [projectsResponse, ideasResponse] = await Promise.all([
            supabase.from('projects').select('id'),
            supabase.from('ideas').select('id, votes')
        ]);
        
        const projectsCount = projectsResponse.data?.length || 0;
        const ideasCount = ideasResponse.data?.length || 0;
        const totalVotes = ideasResponse.data?.reduce((sum, idea) => sum + idea.votes, 0) || 0;
        
        return { projectsCount, ideasCount, totalVotes };
    }
};
