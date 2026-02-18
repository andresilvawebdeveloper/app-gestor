import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const employeeProvider = {
    getAll: async () => {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        return { data };
    },
    create: async (newEmp) => {
        const { data, error } = await supabase.from('employees').insert([newEmp]).select();
        if (error) throw error;
        return { data: data[0] };
    },
    delete: async (id) => {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
    }
};

export const vacationProvider = {
    getAll: async () => {
        const { data, error } = await supabase.from('vacations').select('*');
        if (error) throw error;
        return { data };
    },
    create: async (vacation) => {
        // 1. Grava as férias
        const { data, error } = await supabase.from('vacations').insert([vacation]).select();
        if (error) throw error;

        // 2. Atualiza o saldo do colaborador via RPC ou atualização direta
        const { data: emp } = await supabase.from('employees').select('used').eq('id', vacation.employee_id).single();
        await supabase.from('employees').update({ used: emp.used + vacation.work_days }).eq('id', vacation.employee_id);
        
        return { data: data[0] };
    },
    delete: async (id) => {
        const { data: vac } = await supabase.from('vacations').select('*').eq('id', id).single();
        if (vac) {
            const { data: emp } = await supabase.from('employees').select('used').eq('id', vac.employee_id).single();
            await supabase.from('employees').update({ used: emp.used - vac.work_days }).eq('id', vac.employee_id);
        }
        await supabase.from('vacations').delete().eq('id', id);
    }
};