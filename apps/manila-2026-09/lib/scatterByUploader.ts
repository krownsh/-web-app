/** Stable scatter so the same uploader is not shown back-to-back when others exist. */
export function scatterByUploader<T extends { id: string; uploader_id: string }>(items: T[]): T[] {
    if (items.length < 2) return items.slice();

    const groups = new Map<string, T[]>();
    for (const item of items) {
        const list = groups.get(item.uploader_id) ?? [];
        list.push(item);
        groups.set(item.uploader_id, list);
    }
    for (const list of groups.values()) {
        list.sort((a, b) => a.id.localeCompare(b.id));
    }

    const result: T[] = [];
    let last = '';
    const remaining = () => [...groups.entries()].filter(([, q]) => q.length > 0);

    while (remaining().length) {
        const options = remaining().filter(([id]) => id !== last);
        const pool = options.length ? options : remaining();
        pool.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
        const [id, queue] = pool[0];
        result.push(queue.shift()!);
        last = id;
    }

    return result;
}
