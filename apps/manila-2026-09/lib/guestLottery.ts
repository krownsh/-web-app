export function guestLotteryKey(tripId: string, userId: string) {
    return `zentravel-guest-lottery:${tripId}:${userId}`;
}

export function lotteryPlayedKey(tripId: string, userId: string) {
    return `zentravel-lottery:${tripId}:${userId}`;
}

export function hasPlayedLottery(tripId: string, userId: string) {
    if (!tripId || !userId) return false;
    try {
        return (
            sessionStorage.getItem(lotteryPlayedKey(tripId, userId)) === '1' ||
            sessionStorage.getItem(guestLotteryKey(tripId, userId)) === '1'
        );
    } catch {
        return false;
    }
}

export function markPlayedLottery(tripId: string, userId: string) {
    if (!tripId || !userId) return;
    try {
        sessionStorage.setItem(lotteryPlayedKey(tripId, userId), '1');
        sessionStorage.setItem(guestLotteryKey(tripId, userId), '1');
    } catch {
        /* ignore */
    }
}

export function hasGuestLottery(tripId: string, userId: string) {
    return hasPlayedLottery(tripId, userId);
}

export function markGuestLottery(tripId: string, userId: string) {
    markPlayedLottery(tripId, userId);
}
