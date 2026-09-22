export function travelerPhotoSrc(url?: string | null) {
    if (!url) return '';
    if (/\/(travelers|guests)\//.test(url)) {
        return url.replace(/\.(png|jpe?g)$/i, '.webp');
    }
    return url;
}
