import { supabase } from './supabase';

export const appointmentService = {
    // Get all appointments for a user (customer or tradesman)
    async getAppointments() {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        *,
        service:services(*),
        tradesman:profiles!tradesman_id(*),
        customer:profiles!customer_id(*)
      `)
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Create a new appointment
    async createAppointment(appointmentData) {
        const { data, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update appointment status
    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Cancel appointment (soft delete or status change)
    async cancelAppointment(id) {
        return this.updateStatus(id, 'cancelled');
    }
};
