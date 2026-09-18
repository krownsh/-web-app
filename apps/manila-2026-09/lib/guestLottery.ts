export function guestLotteryKey(tripId: string, userId: string) {
    return `zentravel-guest-lottery:${tripId}:${userId}`;
}

export function hasGuestLottery(tripId: string, userId: string) {
    try {
        return sessionStorage.getItem(guestLotteryKey(tripId, userId)) === '1';
    } catch {
        return false;
    }
}

export function markGuestLottery(tripId: string, userId: string) {
    try {
        sessionStorage.setItem(guestLotteryKey(tripId, userId), '1');
    } catch {
        /* ignore */
    }
}
