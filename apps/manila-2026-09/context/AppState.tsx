import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, SupabaseService } from '../services/SupabaseService';
import { hasGuestLottery } from '../lib/guestLottery';
import { Trip, TripDay } from '../types';

interface SessionState {
    session: Session | null;
    user: User | null;
    loading: boolean;
    enrolled: boolean;
    enrollThisApp: () => Promise<void>;
}

export type GameClaim = {
    kind: 'guest' | 'traveler';
    traveler_id: string;
    display_name: string;
    photo_url: string | null;
    lottery_played_at: string | null;
};

interface TripState {
    trips: Trip[];
    trip: Trip | null;
    days: TripDay[];
    role: 'owner' | 'member' | 'guest' | null;
    isGuest: boolean;
    loading: boolean;
    gameClaim: GameClaim | null;
    claimReady: boolean;
    refresh: () => Promise<void>;
    refreshClaim: () => Promise<void>;
    markLotteryPlayed: () => void;
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
            .from('zentravel_users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
        setEnrolled(!!data);
        if (data) {
            await supabase
                .from('zentravel_users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', userId);
        }
    }, []);

    const enrollThisApp = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('尚未登入');
        const { error } = await supabase.from('zentravel_users').upsert({
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
    const userId = user?.id;
    const [trips, setTrips] = useState<Trip[]>([]);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [days, setDays] = useState<TripDay[]>([]);
    const [role, setRole] = useState<'owner' | 'member' | 'guest' | null>(null);
    const [loading, setLoading] = useState(true);
    const [gameClaim, setGameClaim] = useState<GameClaim | null>(null);
    const [claimReady, setClaimReady] = useState(false);

    const bootstrapped = useRef(false);

    const applyClaim = useCallback((claim: GameClaim | null, tripId?: string) => {
        if (claim?.kind === 'guest' && tripId && userId && hasGuestLottery(tripId, userId)) {
            setGameClaim({ ...claim, lottery_played_at: claim.lottery_played_at || new Date().toISOString() });
        } else {
            setGameClaim(claim);
        }
    }, [userId]);

    const refreshClaim = useCallback(async () => {
        if (!userId || !enrolled) {
            setGameClaim(null);
            setClaimReady(true);
            return;
        }
        if (!trip?.id) {
            // 行程還在載入時不要把 claimReady 打成 false，否則首頁會卡在「載入中」
            return;
        }
        try {
            const claim = await SupabaseService.getMyGameClaim(trip.id);
            applyClaim(claim, trip.id);
        } catch (err) {
            console.error(err);
            setGameClaim(null);
        } finally {
            setClaimReady(true);
        }
    }, [userId, enrolled, trip?.id, applyClaim]);

    const markLotteryPlayed = useCallback(() => {
        const now = new Date().toISOString();
        setGameClaim((prev) => (prev ? { ...prev, lottery_played_at: prev.lottery_played_at || now } : prev));
    }, []);

    const refresh = useCallback(async () => {
        if (!userId || !enrolled) {
            bootstrapped.current = false;
            setTrips([]);
            setTrip(null);
            setDays([]);
            setRole(null);
            setGameClaim(null);
            setClaimReady(true);
            setLoading(false);
            return;
        }
        if (!bootstrapped.current) setLoading(true);
        try {
            let list = await SupabaseService.getMyTrips();
            if (list.length === 0) {
                try {
                    await SupabaseService.joinThisAppTrip();
                } catch (err) {
                    console.error(err);
                }
                list = await SupabaseService.getMyTrips();
            }
            setTrips(list);
            const active = list[0] || null;
            setTrip(active);
            if (active) {
                const [tripDays, memberRes, claim] = await Promise.all([
                    SupabaseService.getTripDays(active.id),
                    supabase
                        .from('zentravel_trip_members')
                        .select('role')
                        .eq('trip_id', active.id)
                        .eq('user_id', userId)
                        .maybeSingle(),
                    SupabaseService.getMyGameClaim(active.id).catch((err) => {
                        console.error(err);
                        return null;
                    }),
                ]);
                setDays(tripDays);
                const nextRole = (memberRes.data?.role as 'owner' | 'member' | 'guest') || 'member';
                setRole(nextRole);
                applyClaim(claim, active.id);
                setClaimReady(true);
            } else {
                setDays([]);
                setRole(null);
                setGameClaim(null);
                setClaimReady(true);
            }
            bootstrapped.current = true;
        } finally {
            setLoading(false);
        }
    }, [userId, enrolled, applyClaim]);

    useEffect(() => {
        refresh().catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }, [refresh]);

    useEffect(() => {
        refreshClaim().catch(() => undefined);
    }, [refreshClaim]);

    const isGuest = role === 'guest' || gameClaim?.kind === 'guest';

    const value = useMemo(
        () => ({
            trips,
            trip,
            days,
            role,
            isGuest,
            loading,
            gameClaim,
            claimReady,
            refresh,
            refreshClaim,
            markLotteryPlayed,
        }),
        [trips, trip, days, role, isGuest, loading, gameClaim, claimReady, refresh, refreshClaim, markLotteryPlayed]
    );

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};
