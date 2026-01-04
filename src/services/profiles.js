import { supabase } from './supabase';

export const profileService = {
    // Get current user profile
    async getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    },

    // Update profile
    async updateProfile(updates) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
};
