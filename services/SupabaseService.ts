import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SupabaseService = {
    /**
     * Fetch all itinerary items
     */
    async getItinerary() {
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .order('day', { ascending: true })
            .order('time', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch must buy items
     */
    async getMustBuys(ownerId: string) {
        const { data, error } = await supabase
            .from('must_buys')
            .select('*')
            .or(`visibility.eq.public,owner_id.eq.${ownerId}`);

        if (error) throw error;
        return data;
    },

    /**
     * Fetch budget records
     */
    async getBudgetRecords(ownerId: string) {
        const { data, error } = await supabase
            .from('budget_records')
            .select('*')
            .or(`payment_type.eq.public,owner_id.eq.${ownerId}`)
            .order('date', { ascending: false })
            .order('time', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch checklist status
     */
    async getChecklistStatuses(ownerId: string) {
        const { data, error } = await supabase
            .from('checklist_statuses')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;
        return data;
    },

    /**
     * Fetch budgets
     */
    async getBudgets(ownerId: string) {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .or(`budget_type.eq.public,owner_id.eq.${ownerId}`);

        if (error) throw error;
        return data;
    },

    /**
     * Sync checklist item status
     */
    async syncChecklistStatus(itemId: string, ownerId: string, isChecked: boolean) {
        const { data, error } = await supabase
            .from('checklist_statuses')
            .upsert({
                item_id: itemId,
                owner_id: ownerId,
                is_checked: isChecked,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'item_id,owner_id'
            })
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Sync budget amount
     */
    async syncBudget(id: string, budgetType: string, ownerId: string, amount: number) {
        const { data, error } = await supabase
            .from('budgets')
            .upsert({
                id,
                budget_type: budgetType,
                owner_id: ownerId,
                amount,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Generic Add Record
     */
    async addRecord(table: string, record: any) {
        const { data, error } = await supabase
            .from(table)
            .insert([record])
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Generic Update Record
     */
    async updateRecord(table: string, id: string, updates: any) {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Generic Delete Record
     */
    async deleteRecord(table: string, id: string) {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Get the currently active itinerary item
     */
    async getCurrentItinerary() {
        const { data, error } = await supabase
            .from('itineraries')
            .select() // Use minimal select to rely on implicit format
            .eq('is_current', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Set a specific itinerary item as current
     * NOTE: This is a client-side implementation. Ideally, use a Database Function (RPC).
     */
    async setCurrentItinerary(id: string) {
        // 1. Unset all current items (Safety check)
        await supabase
            .from('itineraries')
            .update({ is_current: false } as any)
            .eq('is_current', true);

        // 2. Set new item as current
        const { data, error } = await supabase
            .from('itineraries')
            .update({ is_current: true } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update itinerary details (Location, Note, etc.)
     */
    async updateItinerary(id: string, updates: { location?: string; description?: string; title?: string }) {
        const { data, error } = await supabase
            .from('itineraries')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    }
};
