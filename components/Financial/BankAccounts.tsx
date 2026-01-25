import React, { useState } from 'react';
import { User, BankAccount } from '../../types';
import { Card } from '../Card';
import { Button } from '../Button';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { Plus, Trash2, Landmark, Wallet, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { Loader2 } from 'lucide-react';

interface BankAccountsProps {
    user: User;
}

export const BankAccounts: React.FC<BankAccountsProps> = ({ user }) => {
    const { accounts, loading, addAccount, deleteAccount } = useBankAccounts(user);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [color, setColor] = useState('#000000');
    const [submitting, setSubmitting] = useState(false);

    const totalBalance = accounts.reduce((acc, curr) => acc + (Number(curr.initial_balance) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setSubmitting(true);
        try {
            await addAccount({
                name,
                initial_balance: Number(balance) || 0,
                bank_code: bankCode,
                color
            });
            setShowModal(false);
            resetForm();
        } catch (error) {
            // Handled by hook
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setBalance('');
        setBankCode('');
        setColor('#000000');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão Financeira</h1>
                    <p className="text-slate-500 text-sm font-bold">Contas Bancárias e Saldos</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conta
                </Button>
            </header>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Wallet className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saldo Total (Inicial)</span>
                        </div>
                        <p className="text-2xl font-black">{formatCurrency(totalBalance)}</p>
                    </div>
                </Card>
            </div>

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-8">
                <Landmark className="w-4 h-4" />
                Minhas Contas
            </h2>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map(account => (
                        <Card key={account.id} className="group hover:border-brand/40 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: account.color || '#333' }}>
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{account.name}</h3>
                                        <p className="text-xs text-slate-500">{account.bank_code || 'Banco'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteAccount(account.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Saldo Inicial</p>
                                <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                                    {formatCurrency(account.initial_balance)}
                                </p>
                            </div>
                        </Card>
                    ))}

                    {accounts.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                            <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Nenhuma conta cadastrada.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setShowModal(true)}>
                                Adicionar Primeira Conta
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Add Account Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <Card className="w-full max-w-sm animate-slideUp">
                        <h2 className="text-lg font-black uppercase mb-4">Adicionar Conta</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nome da Conta</label>
                                <input
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 ring-brand/20"
                                    placeholder="Ex: Nubank Principal"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Banco (Opcional)</label>
                                <input
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 ring-brand/20"
                                    placeholder="Ex: Nu Pagamentos"
                                    value={bankCode}
                                    onChange={e => setBankCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Saldo Inicial</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 ring-brand/20"
                                    placeholder="0,00"
                                    value={balance}
                                    onChange={e => setBalance(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cor de Identificação</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#820AD1', '#0056b3', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#111827'].map(c => (
                                        <button
                                            type="button"
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit" fullWidth disabled={submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
