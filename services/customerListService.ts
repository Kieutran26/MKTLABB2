import { supabase } from '../lib/supabase';

// Types
export interface CustomerList {
    id: string;
    name: string;
    description?: string;
    subscriber_count: number;
    created_at: string;
    updated_at: string;
}

export interface Subscriber {
    id: string;
    list_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    status: 'active' | 'unsubscribed' | 'bounced';
    custom_fields: Record<string, any>;
    subscribed_at: string;
    created_at: string;
}

export interface CustomFieldDefinition {
    id: string;
    name: string;
    field_key: string;
    data_type: 'text' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'image';
    is_required: boolean;
    created_at: string;
}

export const customerListService = {
    // ================== LISTS ==================

    async getAllLists(): Promise<CustomerList[]> {
        const { data, error } = await supabase
            .from('customer_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lists:', error);
            return [];
        }
        return data || [];
    },

    async createList(name: string, description?: string): Promise<CustomerList | null> {
        const { data, error } = await supabase
            .from('customer_lists')
            .insert({ name, description })
            .select()
            .single();

        if (error) {
            console.error('Error creating list:', error);
            return null;
        }
        return data;
    },

    async updateList(id: string, updates: Partial<CustomerList>): Promise<boolean> {
        const { error } = await supabase
            .from('customer_lists')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating list:', error);
            return false;
        }
        return true;
    },

    async deleteList(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('customer_lists')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting list:', error);
            return false;
        }
        return true;
    },

    // ================== SUBSCRIBERS ==================

    async getSubscribers(listId: string): Promise<Subscriber[]> {
        const { data, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('list_id', listId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscribers:', error);
            return [];
        }
        return data || [];
    },

    async addSubscriber(listId: string, subscriber: Partial<Subscriber>): Promise<Subscriber | null> {
        const { data, error } = await supabase
            .from('subscribers')
            .insert({
                list_id: listId,
                email: subscriber.email,
                first_name: subscriber.first_name,
                last_name: subscriber.last_name,
                phone: subscriber.phone,
                custom_fields: subscriber.custom_fields || {}
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding subscriber:', error);
            return null;
        }

        // Update subscriber count
        await this.updateSubscriberCount(listId);
        return data;
    },

    async bulkAddSubscribers(listId: string, subscribers: Partial<Subscriber>[]): Promise<number> {
        const records = subscribers.map(s => ({
            list_id: listId,
            email: s.email,
            first_name: s.first_name,
            last_name: s.last_name,
            phone: s.phone,
            custom_fields: s.custom_fields || {}
        }));

        const { data, error } = await supabase
            .from('subscribers')
            .insert(records)
            .select();

        if (error) {
            console.error('Error bulk adding subscribers:', error);
            return 0;
        }

        // Update subscriber count
        await this.updateSubscriberCount(listId);
        return data?.length || 0;
    },

    async updateSubscriber(id: string, updates: Partial<Subscriber>): Promise<boolean> {
        const { error } = await supabase
            .from('subscribers')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating subscriber:', error);
            return false;
        }
        return true;
    },

    async deleteSubscriber(id: string, listId: string): Promise<boolean> {
        const { error } = await supabase
            .from('subscribers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting subscriber:', error);
            return false;
        }

        // Update subscriber count
        await this.updateSubscriberCount(listId);
        return true;
    },

    async updateSubscriberCount(listId: string): Promise<void> {
        const { count } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            .eq('status', 'active');

        await supabase
            .from('customer_lists')
            .update({ subscriber_count: count || 0, updated_at: new Date().toISOString() })
            .eq('id', listId);
    },

    // ================== CUSTOM FIELDS ==================

    async getCustomFields(): Promise<CustomFieldDefinition[]> {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching custom fields:', error);
            return [];
        }
        return data || [];
    },

    async createCustomField(field: Omit<CustomFieldDefinition, 'id' | 'created_at'>): Promise<CustomFieldDefinition | null> {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .insert(field)
            .select()
            .single();

        if (error) {
            console.error('Error creating custom field:', error);
            return null;
        }
        return data;
    },

    async deleteCustomField(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('custom_field_definitions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting custom field:', error);
            return false;
        }
        return true;
    },

    // ================== IMPORT HELPERS ==================

    parseExcelData(data: any[]): Partial<Subscriber>[] {
        return data.map(row => ({
            email: row.email || row.Email || row.EMAIL || '',
            first_name: row.first_name || row.firstName || row['First Name'] || row.name || '',
            last_name: row.last_name || row.lastName || row['Last Name'] || '',
            phone: row.phone || row.Phone || row.PHONE || '',
        })).filter(s => s.email);
    },

    parseCsvData(csvText: string): Partial<Subscriber>[] {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const firstNameIdx = headers.findIndex(h => h.includes('first') || h === 'name');
        const lastNameIdx = headers.findIndex(h => h.includes('last'));
        const phoneIdx = headers.findIndex(h => h.includes('phone'));

        if (emailIdx === -1) return [];

        return lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim());
            return {
                email: cols[emailIdx] || '',
                first_name: firstNameIdx >= 0 ? cols[firstNameIdx] : '',
                last_name: lastNameIdx >= 0 ? cols[lastNameIdx] : '',
                phone: phoneIdx >= 0 ? cols[phoneIdx] : '',
            };
        }).filter(s => s.email);
    }
};
