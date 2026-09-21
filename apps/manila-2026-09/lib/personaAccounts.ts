export const PERSONA_PASSWORD = 'a123123';

export const PERSONA_EMAIL: Record<string, string> = {
    美慧: 'test01@gmail.com',
    智濠: 'test02@gmail.com',
    法蓉: 'test03@gmail.com',
    子晨: 'test04@gmail.com',
    峻軒: 'bgkong1205@gmail.com',
    韋劭: 'test06@gmail.com',
    郁欣: 'test07@gmail.com',
    承宏: 'test08@gmail.com',
    彥文: 'test09@gmail.com',
    靜瑩: 'test10@gmail.com',
    宇庭: 'test11@gmail.com',
    庭宇: 'test12@gmail.com',
    共用訪客: 'test13@gmail.com',
};

export function emailForPersona(displayName: string) {
    return PERSONA_EMAIL[displayName] || '';
}
