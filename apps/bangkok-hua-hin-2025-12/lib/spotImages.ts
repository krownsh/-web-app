export const SPOT_IMAGES: Record<string, string> = {};

export function imageForItem(title?: string, imageUrl?: string | null) {
    if (imageUrl) return imageUrl;
    if (!title) return undefined;
    return SPOT_IMAGES[title.trim()];
}
