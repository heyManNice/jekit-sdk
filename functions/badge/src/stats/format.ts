const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function sumDailyValues(values: readonly number[]): string {
    return values.reduce((total, value) => total + value, 0).toString();
}

export function formatRegistrationAge(
    registeredAt: bigint,
    now = Date.now(),
): string | null {
    const timestamp = Number(registeredAt);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;

    const elapsedDays = Math.floor((now - timestamp) / DAY_IN_MS);
    return Math.max(1, elapsedDays + 1).toString();
}
