import { createClient } from '@supabase/supabase-js';
import { Budget, ChecklistStatus, ExpenseItem, ItineraryItem, MustBuyItem, Trip, TripDay } from '../types';
import { imageForItem } from '../lib/spotImages';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const JOIN_CODE = 'BKK512';
const TRIP_SLUG = 'bangkok-hua-hin-2025-12';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-thaiwomao',
    },
});

function mapItinerary(row: any): ItineraryItem {
    return {
        ...row,
        day: row.day_key || row.day,
        description: row.description || '',
        note: row.description || '',
        image: imageForItem(row.title, row.image_url),
    };
}

export const SupabaseService = {
    async getMyTrips(): Promise<Trip[]> {
        const { data, error } = await supabase
            .from('thaiwomao_trips')
            .select('*')
            .eq('slug', TRIP_SLUG)
            .order('start_date', { ascending: false });
        if (error) throw error;
        return (data || []) as Trip[];
    },

    async joinTrip(code: string): Promise<string> {
        if (code.trim().toUpperCase() !== JOIN_CODE) {
            throw new Error('?? App ????? BKK512');
        }
        const { data, error } = await supabase.rpc('thaiwomao_join_trip', { p_code: code });
        if (error) throw error;
        return data as string;
    },

    async setActiveTrip(tripId: string) {
        const { error } = await supabase.rpc('thaiwomao_set_active_trip', { p_trip_id: tripId });
        if (error) throw error;
    },

    async getTripDays(tripId: string): Promise<TripDay[]> {
        const { data, error } = await supabase
            .from('thaiwomao_trip_days')
            .select('*')
            .eq('trip_id', tripId)
            .order('day_index', { ascending: true });
        if (error) throw error;
        return (data || []) as TripDay[];
    },

    async getItinerary(tripId: string) {
        const { data, error } = await supabase
            .from('thaiwomao_itinerary_items')
            .select('*')
            .eq('trip_id', tripId)
            .order('day_key', { ascending: true })
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return (data || []).map(mapItinerary);
    },

    async getReminders(tripId: string) {
        const { data, error } = await supabase
            .from('thaiwomao_reminders')
            .select('*')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getPrepItems(tripId: string) {
        const { data, error } = await supabase
            .from('thaiwomao_prep_items')
            .select('*')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getMustBuys(tripId: string, _ownerId: string): Promise<MustBuyItem[]> {
        const { data, error } = await supabase
            .from('thaiwomao_must_buys')
            .select('*')
            .eq('trip_id', tripId);
        if (error) throw error;
        return data || [];
    },

    async getBudgetRecords(tripId: string, _ownerId: string): Promise<ExpenseItem[]> {
        const { data, error } = await supabase
            .from('thaiwomao_budget_records')
            .select('*')
            .eq('trip_id', tripId)
            .order('date', { ascending: false })
            .order('time', { ascending: false });
        if (error) throw error;
        return (data || []) as ExpenseItem[];
    },

    async getChecklistStatuses(tripId: string, ownerId: string): Promise<ChecklistStatus[]> {
        const { data, error } = await supabase
            .from('thaiwomao_checklist_statuses')
            .select('*')
            .eq('trip_id', tripId)
            .eq('owner_id', ownerId);
        if (error) throw error;
        return data || [];
    },

    async getBudgets(tripId: string, _ownerId: string): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('thaiwomao_budgets')
            .select('*')
            .eq('trip_id', tripId);
        if (error) throw error;
        return data || [];
    },

    async syncChecklistStatus(tripId: string, itemId: string, ownerId: string, isChecked: boolean) {
        const { data, error } = await supabase
            .from('thaiwomao_checklist_statuses')
            .upsert({
                trip_id: tripId,
                item_id: itemId,
                owner_id: ownerId,
                is_checked: isChecked,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'trip_id,item_id,owner_id' })
            .select();
        if (error) throw error;
        return data;
    },

    async syncBudget(tripId: string, budgetType: string, ownerId: string, amount: number) {
        const { data, error } = await supabase
            .from('thaiwomao_budgets')
            .upsert({
                trip_id: tripId,
                budget_type: budgetType,
                owner_id: ownerId,
                amount,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'trip_id,budget_type,owner_id' })
            .select();
        if (error) throw error;
        return data;
    },

    async addRecord(table: string, record: any) {
        const { data, error } = await supabase
            .from(table)
            .insert([record])
            .select();
        if (error) throw error;
        return data;
    },

    async updateRecord(table: string, id: string, updates: any) {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    async deleteRecord(table: string, id: string) {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    async getCurrentItinerary(tripId: string) {
        const { data, error } = await supabase
            .from('thaiwomao_itinerary_items')
            .select('*')
            .eq('trip_id', tripId)
            .eq('is_current', true)
            .maybeSingle();
        if (error) throw error;
        return data ? mapItinerary(data) : null;
    },

    async setCurrentItinerary(tripId: string, id: string) {
        await supabase
            .from('thaiwomao_itinerary_items')
            .update({ is_current: false })
            .eq('trip_id', tripId)
            .eq('is_current', true);
        const { data, error } = await supabase
            .from('thaiwomao_itinerary_items')
            .update({ is_current: true })
            .eq('id', id)
            .eq('trip_id', tripId)
            .select()
            .single();
        if (error) throw error;
        return mapItinerary(data);
    },

    async updateItinerary(id: string, updates: { location?: string; description?: string; title?: string; time?: string }) {
        const { data, error } = await supabase
            .from('thaiwomao_itinerary_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },
};
