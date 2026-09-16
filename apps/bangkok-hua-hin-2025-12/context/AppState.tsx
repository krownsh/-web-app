import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, SupabaseService } from '../services/SupabaseService';
import { Trip, TripDay } from '../types';

interface SessionState {
    session: Session | null;
    user: User | null;
    loading: boolean;
    enrolled: boolean;
    enrollThisApp: () => Promise<void>;
}

interface TripState {
    trips: Trip[];
    trip: Trip | null;
    days: TripDay[];
    role: 'owner' | 'member' | null;
    loading: boolean;
    refresh: () => Promise<void>;
    joinWithCode: (code: string) => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);
const TripContext = createContext<TripState | null>(null);

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession outside provider');
    return ctx;
}

export function useTrip() {
    const ctx = useContext(TripContext);
    if (!ctx) throw new Error('useTrip outside provider');
    return ctx;
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [enrolled, setEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);

    const refreshEnrollment = useCallback(async (userId?: string) => {
        if (!userId) {
            setEnrolled(false);
            return;
        }
        const { data } = await supabase
            .from('thaiwomao_users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
        setEnrolled(!!data);
        if (data) {
            await supabase
                .from('thaiwomao_users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', userId);
        }
    }, []);

    const enrollThisApp = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('尚未登入');
        const { error } = await supabase.from('thaiwomao_users').upsert({
            id: user.id,
            display_name: user.email,
            last_seen_at: new Date().toISOString(),
        });
        if (error) throw error;
        setEnrolled(true);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            setSession(data.session);
            await refreshEnrollment(data.session?.user?.id);
            setLoading(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
            setSession(next);
            refreshEnrollment(next?.user?.id).then(() => undefined);
        });
        return () => sub.subscription.unsubscribe();
    }, [refreshEnrollment]);

    const value = useMemo(
        () => ({
            session,
            user: session?.user ?? null,
            loading,
            enrolled,
            enrollThisApp,
        }),
        [session, loading, enrolled, enrollThisApp]
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, enrolled } = useSession();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [days, setDays] = useState<TripDay[]>([]);
    const [role, setRole] = useState<'owner' | 'member' | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user || !enrolled) {
            setTrips([]);
            setTrip(null);
            setDays([]);
            setRole(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const list = await SupabaseService.getMyTrips();
        setTrips(list);
        const active = list[0] || null;
        setTrip(active);
        if (active) {
            const tripDays = await SupabaseService.getTripDays(active.id);
            setDays(tripDays);
            const { data: member } = await supabase
                .from('thaiwomao_trip_members')
                .select('role')
                .eq('trip_id', active.id)
                .eq('user_id', user.id)
                .maybeSingle();
            setRole((member?.role as 'owner' | 'member') || 'member');
        } else {
            setDays([]);
            setRole(null);
        }
        setLoading(false);
    }, [user, enrolled]);

    useEffect(() => {
        refresh().catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }, [refresh]);

    const joinWithCode = async (code: string) => {
        await SupabaseService.joinTrip(code.trim());
        await refresh();
    };

    const value = useMemo(
        () => ({ trips, trip, days, role, loading, refresh, joinWithCode }),
        [trips, trip, days, role, loading, refresh]
    );

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};
