export function travelerPhotoSrc(url?: string | null) {
    if (!url) return '';
    if (/\/travelers\/.*\.png$/i.test(url)) return url.replace(/\.png$/i, '.jpg');
    return url;
}
