import { ExpenseItem, MustBuyItem, ChecklistStatus } from '../types';

const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;

export const GoogleSheetsService = {
    /**
     * Fetch data from a specific sheet
     */
    async fetchData<T>(sheet: 'Itinerary' | 'MustBuy' | 'BudgetRecords' | 'ChecklistStatus' | 'Budgets', ownerId?: string): Promise<T[]> {
        try {
            const url = new URL(API_URL);
            url.searchParams.append('sheet', sheet);
            if (ownerId) url.searchParams.append('owner_id', ownerId);

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }
            return data as T[];
        } catch (error) {
            console.error(`Error fetching ${sheet}:`, error);
            return [];
        }
    },

    /**
     * Add a new record
     */
    async addRecord(sheet: string, data: any): Promise<boolean> {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script POST requires no-cors or redirect handling
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add',
                    sheet: sheet,
                    data: data
                })
            });
            // Note: With no-cors, we can't see the response body, so we assume success if no error is thrown
            return true;
        } catch (error) {
            console.error('Error adding record:', error);
            return false;
        }
    },

    /**
     * Update an existing record
     */
    async updateRecord(sheet: string, data: any): Promise<boolean> {
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    sheet: sheet,
                    data: data
                })
            });
            return true;
        } catch (error) {
            console.error('Error updating record:', error);
            return false;
        }
    },

    /**
     * Delete a record by ID
     */
    async deleteRecord(sheet: string, id: string): Promise<boolean> {
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    sheet: sheet,
                    data: { id }
                })
            });
            return true;
        } catch (error) {
            console.error('Error deleting record:', error);
            return false;
        }
    },

    /**
     * Specifically for checklist status synchronization
     */
    async syncChecklist(itemId: string, ownerId: string, isChecked: boolean): Promise<boolean> {
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sync_check',
                    sheet: 'ChecklistStatus',
                    data: {
                        item_id: itemId,
                        owner_id: ownerId,
                        is_checked: isChecked
                    }
                })
            });
            return true;
        } catch (error) {
            console.error('Error syncing checklist:', error);
            return false;
        }
    },

    /**
     * Specifically for budget cap synchronization
     */
    async syncBudget(budgetType: 'public' | 'self', ownerId: string, amount: number): Promise<boolean> {
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sync_budget',
                    sheet: 'Budgets',
                    data: {
                        budget_type: budgetType,
                        owner_id: ownerId,
                        amount: amount
                    }
                })
            });
            return true;
        } catch (error) {
            console.error('Error syncing budget:', error);
            return false;
        }
    }
};
