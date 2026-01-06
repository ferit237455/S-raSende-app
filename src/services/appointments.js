import { supabase } from './supabase';

export const appointmentService = {
    // Get all appointments for a user (customer or tradesman)
    async getAppointments(filters = {}) {
        try {
            let query = supabase
                .from('appointments')
                .select(`
            id,
            start_time,
            end_time,
            status,
            tradesman_id,
            customer_id,
            service_id,
            service:services(id, name, duration, price),
            tradesman:profiles!tradesman_id(id, business_name, full_name),
            customer:profiles!customer_id(id, full_name, email)
          `);

            if (filters.tradesman_id) {
                query = query.eq('tradesman_id', filters.tradesman_id);
            }
            if (filters.customer_id) {
                query = query.eq('customer_id', filters.customer_id);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query.order('start_time', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return [];
        }
    },

    // Create a new appointment
    async createAppointment(appointmentData) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select('id, start_time, end_time, status, tradesman_id, customer_id, service_id')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    },

    // Update appointment status
    async updateStatus(id, status) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id)
                .select('id, status, start_time, end_time')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    },

    // Cancel appointment (soft delete or status change)
    async cancelAppointment(id) {
        return this.updateStatus(id, 'cancelled');
    },

    // Delete appointment permanently (only for cancelled appointments)
    async deleteAppointment(id) {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }
};
