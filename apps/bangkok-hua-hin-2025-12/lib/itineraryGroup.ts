import { ItineraryItem, TripDay } from '../types';

export function groupItineraryByDay(days: TripDay[], items: ItineraryItem[]) {
    const grouped: Record<string, any> = {};
    const dayList = days.length
        ? days
        : Array.from(new Set(items.map((i) => i.day))).map((day_key, i) => ({
              day_key,
              day_index: i + 1,
          }));

    dayList.forEach((d: any) => {
        const key = d.day_key;
        grouped[key] = {
            date: d.date_num || '',
            month: d.month_label || '',
            weekday: d.weekday_label || '',
            weather: d.weather_note || '',
            reminder: d.reminder || '',
            items: items
                .filter((i) => i.day === key)
                .map((item) => ({
                    ...item,
                    desc: item.description,
                })),
        };
    });
    return grouped;
}
