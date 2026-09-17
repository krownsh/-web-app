async function bitmapFromFile(file: File): Promise<ImageBitmap> {
    try {
        return await createImageBitmap(file);
    } catch {
        const url = URL.createObjectURL(file);
        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error('無法讀取圖片'));
                el.src = url;
            });
            return await createImageBitmap(img);
        } finally {
            URL.revokeObjectURL(url);
        }
    }
}

export async function compressImageFile(file: File): Promise<Blob> {
    const bitmap = await bitmapFromFile(file);
    const maxSide = 960;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('無法壓縮圖片');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.5);
    });
    if (!blob) throw new Error('壓縮失敗');
    if (blob.size > 280000) {
        const tighter = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.35);
        });
        if (tighter && tighter.size < blob.size) return tighter;
    }
    return blob;
}
