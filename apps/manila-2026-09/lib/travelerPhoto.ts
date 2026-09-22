export function travelerPhotoSrc(url?: string | null) {
    if (!url) return '';
    return url.replace(/\.jpg$/i, '.png');
}
