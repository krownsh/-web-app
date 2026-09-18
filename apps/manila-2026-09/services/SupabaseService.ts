import { createClient } from '@supabase/supabase-js';
import { Budget, ChecklistStatus, ExpenseItem, ItineraryItem, MustBuyItem, Traveler, Trip, TripDay } from '../types';
import { imageForItem } from '../lib/spotImages';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY，無法連線');
}

const TRIP_SLUG = 'manila-2026-09';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-manila-2026-09',
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
            .from('zentravel_trips')
            .select('*')
            .eq('slug', TRIP_SLUG)
            .order('start_date', { ascending: false });
        if (error) throw error;
        return (data || []) as Trip[];
    },

    async joinThisAppTrip(): Promise<string> {
        const { data, error } = await supabase.rpc('zentravel_join_this_app_trip');
        if (error) throw error;
        return data as string;
    },

    async setActiveTrip(tripId: string) {
        const { error } = await supabase.rpc('zentravel_set_active_trip', { p_trip_id: tripId });
        if (error) throw error;
    },

    async getTripDays(tripId: string): Promise<TripDay[]> {
        const { data, error } = await supabase
            .from('zentravel_trip_days')
            .select('*')
            .eq('trip_id', tripId)
            .order('day_index', { ascending: true });
        if (error) throw error;
        return (data || []) as TripDay[];
    },

    async getItinerary(tripId: string) {
        const { data, error } = await supabase
            .from('zentravel_itinerary_items')
            .select('*')
            .eq('trip_id', tripId)
            .order('day_key', { ascending: true })
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return (data || []).map(mapItinerary);
    },

    async getTravelers(tripId: string): Promise<Traveler[]> {
        const { data, error } = await supabase
            .from('zentravel_travelers')
            .select('id, trip_id, user_id, display_name, photo_url, outbound, inbound, sort_order')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return (data || []) as Traveler[];
    },

    async getReminders(tripId: string) {
        const { data, error } = await supabase
            .from('zentravel_reminders')
            .select('*')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getPrepItems(tripId: string) {
        const { data, error } = await supabase
            .from('zentravel_prep_items')
            .select('*')
            .eq('trip_id', tripId)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getMustBuys(tripId: string, _ownerId: string): Promise<MustBuyItem[]> {
        const { data, error } = await supabase
            .from('zentravel_must_buys')
            .select('*')
            .eq('trip_id', tripId);
        if (error) throw error;
        return data || [];
    },

    async getBudgetRecords(tripId: string, _ownerId: string): Promise<ExpenseItem[]> {
        const { data, error } = await supabase
            .from('zentravel_budget_records')
            .select('*')
            .eq('trip_id', tripId)
            .order('date', { ascending: false })
            .order('time', { ascending: false });
        if (error) throw error;
        return (data || []) as ExpenseItem[];
    },

    async getChecklistStatuses(tripId: string, ownerId: string): Promise<ChecklistStatus[]> {
        const { data, error } = await supabase
            .from('zentravel_checklist_statuses')
            .select('*')
            .eq('trip_id', tripId)
            .eq('owner_id', ownerId);
        if (error) throw error;
        return data || [];
    },

    async getBudgets(tripId: string, ownerId: string): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('zentravel_budgets')
            .select('*')
            .eq('trip_id', tripId);
        if (error) throw error;
        return ((data || []) as Budget[]).filter((b) => b.budget_type === 'public' || b.owner_id === ownerId);
    },

    async syncChecklistStatus(tripId: string, itemId: string, ownerId: string, isChecked: boolean) {
        const { data, error } = await supabase
            .from('zentravel_checklist_statuses')
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
        let query = supabase
            .from('zentravel_budgets')
            .select('id')
            .eq('trip_id', tripId)
            .eq('budget_type', budgetType);
        if (budgetType === 'self') query = query.eq('owner_id', ownerId);
        const { data: existing, error: findErr } = await query.maybeSingle();
        if (findErr) throw findErr;
        if (existing?.id) {
            const { data, error } = await supabase
                .from('zentravel_budgets')
                .update({ amount, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select();
            if (error) throw error;
            return data;
        }
        const { data, error } = await supabase
            .from('zentravel_budgets')
            .insert({
                trip_id: tripId,
                budget_type: budgetType,
                owner_id: ownerId,
                amount,
                updated_at: new Date().toISOString(),
            })
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
            .from('zentravel_itinerary_items')
            .select('*')
            .eq('trip_id', tripId)
            .eq('is_current', true)
            .maybeSingle();
        if (error) throw error;
        return data ? mapItinerary(data) : null;
    },

    async setCurrentItinerary(tripId: string, id: string) {
        await supabase
            .from('zentravel_itinerary_items')
            .update({ is_current: false })
            .eq('trip_id', tripId)
            .eq('is_current', true);
        const { data, error } = await supabase
            .from('zentravel_itinerary_items')
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
            .from('zentravel_itinerary_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        if (error) throw error;
        if (!data?.length) throw new Error('集合點沒有寫入資料庫');
        return data;
    },

    async getMyGameClaim(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_my_identity', { p_trip_id: tripId });
        if (error) throw error;
        const row = (data || [])[0];
        if (!row) return null;
        const kind = row.kind === 'guest' ? 'guest' : 'traveler';
        return {
            kind: kind as 'guest' | 'traveler',
            traveler_id: row.id as string,
            display_name: row.display_name as string,
            photo_url: row.photo_url as string | null,
            lottery_played_at: (row.lottery_played_at as string | null) || null,
        };
    },

    async getGuestPersonas(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_guest_personas_for_trip', { p_trip_id: tripId });
        if (error) throw error;
        return (data || []) as {
            id: string;
            display_name: string;
            photo_url: string | null;
            exclusive: boolean;
            sort_order: number;
            taken: boolean;
        }[];
    },

    async claimGuestPersona(tripId: string, personaId: string) {
        const { error } = await supabase.rpc('zentravel_claim_guest_persona', {
            p_trip_id: tripId,
            p_persona_id: personaId,
        });
        if (error) throw error;
    },

    async getUnclaimedTravelers(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_unclaimed_travelers', { p_trip_id: tripId });
        if (error) throw error;
        return (data || []) as { id: string; display_name: string; photo_url: string | null; sort_order: number }[];
    },

    async claimTraveler(tripId: string, travelerId: string) {
        const { error } = await supabase.rpc('zentravel_claim_traveler', {
            p_trip_id: tripId,
            p_traveler_id: travelerId,
        });
        if (error) throw error;
    },

    async startGameDraw(tripId: string) {
        const { error } = await supabase.rpc('zentravel_start_game_draw', { p_trip_id: tripId });
        if (error) throw error;
    },

    async finishGameLottery(tripId: string) {
        const { error } = await supabase.rpc('zentravel_finish_game_lottery', { p_trip_id: tripId });
        if (error) throw error;
    },

    async getMyGameDraw(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_my_game_draw', { p_trip_id: tripId });
        if (error) throw error;
        const row = (data || [])[0];
        return row
            ? {
                  drawer_id: row.drawer_id as string,
                  angel_id: row.angel_id as string,
                  devil_id: row.devil_id as string,
                  angel_name: row.angel_name as string,
                  devil_name: row.devil_name as string,
                  angel_photo: row.angel_photo as string | null,
                  devil_photo: row.devil_photo as string | null,
              }
            : null;
    },

    async getGameRevealInfo(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_game_reveal_info', { p_trip_id: tripId });
        if (error) throw error;
        const row = (data || [])[0];
        return {
            reveal_at: row?.reveal_at as string,
            revealed: !!row?.revealed,
        };
    },

    async getAllGameDraws(tripId: string) {
        const { data, error } = await supabase.rpc('zentravel_game_all_draws', { p_trip_id: tripId });
        if (error) {
            if (/not revealed/i.test(error.message)) return [];
            throw error;
        }
        return (data || []) as {
            drawer_id: string;
            drawer_name: string;
            drawer_photo: string | null;
            angel_id: string;
            angel_name: string;
            angel_photo: string | null;
            devil_id: string;
            devil_name: string;
            devil_photo: string | null;
        }[];
    },

    async getGameWishes(tripId: string) {
        const { data, error } = await supabase
            .from('zentravel_game_wishes')
            .select('traveler_id, body')
            .eq('trip_id', tripId);
        if (error) throw error;
        return (data || []) as { traveler_id: string; body: string }[];
    },

    async addGameWish(tripId: string, travelerId: string, body: string) {
        const { error } = await supabase.from('zentravel_game_wishes').insert({
            trip_id: tripId,
            traveler_id: travelerId,
            body,
        });
        if (error) throw error;
    },

    async getDevilPhotos(tripId: string, targetId?: string) {
        let query = supabase
            .from('zentravel_game_devil_photos')
            .select('id, target_id, uploader_id, storage_path, created_at')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false });
        if (targetId) query = query.eq('target_id', targetId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as { id: string; target_id: string; uploader_id: string; storage_path: string; created_at: string }[];
    },

    async signedGamePhoto(path: string) {
        const { data, error } = await supabase.storage.from('zentravel-game-photos').createSignedUrl(path, 3600);
        if (error) throw error;
        return data.signedUrl;
    },

    async uploadDevilPhoto(tripId: string, userId: string, file: Blob) {
        const name = `${tripId}/${userId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from('zentravel-game-photos').upload(name, file, {
            contentType: 'image/jpeg',
            upsert: false,
        });
        if (upErr) throw upErr;
        const { error } = await supabase.rpc('zentravel_add_devil_photo', {
            p_trip_id: tripId,
            p_storage_path: name,
        });
        if (error) throw error;
    },

    async getMyGuess(tripId: string, userId: string) {
        const { data, error } = await supabase
            .from('zentravel_game_guesses')
            .select('guessed_angel_id, guessed_devil_id')
            .eq('trip_id', tripId)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data as { guessed_angel_id: string | null; guessed_devil_id: string | null } | null;
    },

    async saveGuess(tripId: string, userId: string, angelId: string | null, devilId: string | null) {
        const { error } = await supabase.from('zentravel_game_guesses').upsert({
            trip_id: tripId,
            user_id: userId,
            guessed_angel_id: angelId,
            guessed_devil_id: devilId,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },
};
