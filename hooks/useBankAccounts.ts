import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { BankAccount, User } from '../types';
import { useToast } from '../contexts/ToastContext';

export function useBankAccounts(user: User) {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const { success, error } = useToast();

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('name');

            if (fetchError) throw fetchError;

            // TODO: Calculate current balance based on transactions (future step)
            // For now, using initial_balance + rudimentary calc if needed, or just displaying what's in DB.
            // Real implementation would join with expenses/freights.
            setAccounts(data || []);
        } catch (err: any) {
            console.error('Error fetching bank accounts:', err);
            error('Erro ao carregar contas bancárias.');
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const addAccount = async (account: Omit<BankAccount, 'id' | 'user_id' | 'created_at'>) => {
        try {
            const { data, error: insertError } = await supabase
                .from('bank_accounts')
                .insert([{
                    ...account,
                    user_id: user.id
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            setAccounts(prev => [...prev, data]);
            success('Conta bancária adicionada!');
            return data;
        } catch (err: any) {
            console.error(err);
            error('Erro ao adicionar conta: ' + err.message);
            throw err;
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('bank_accounts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setAccounts(prev => prev.filter(a => a.id !== id));
            success('Conta removida com sucesso!');
        } catch (err: any) {
            console.error(err);
            error('Erro ao remover conta: ' + err.message);
        }
    };

    return {
        accounts,
        loading,
        addAccount,
        deleteAccount,
        refresh: fetchAccounts
    };
}
