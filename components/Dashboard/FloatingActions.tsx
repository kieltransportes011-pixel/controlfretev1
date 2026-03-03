import React from 'react';
import { Plus, TrendingUp, Minus, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionsProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    onAddFreight: () => void;
    onAddExpense: () => void;
    onAddExtraIncome: () => void;
    onOpenCalculator: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
    isMenuOpen,
    setIsMenuOpen,
    onAddFreight,
    onAddExpense,
    onAddExtraIncome,
    onOpenCalculator
}) => {
    return (
        <>
            <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3">
                <AnimatePresence>
                    {isMenuOpen && (
                        <div className="flex flex-col items-end gap-3 mb-2">
                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                onClick={() => { onAddFreight(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
                            >
                                Novo Frete <TrendingUp className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                onClick={() => { onAddExpense(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
                            >
                                Lançar Despesa <Minus className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                onClick={() => { onAddExtraIncome(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-800/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
                            >
                                Entrada Extra <Plus className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                onClick={() => { onOpenCalculator(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-black text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden"
                            >
                                Simular Lucro <Calculator className="w-4 h-4" />
                            </motion.button>
                        </div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-brand/30 transition-all duration-300 ${isMenuOpen ? 'bg-slate-800 rotate-45 scale-90' : 'bg-brand rotate-0 hover:scale-110'}`}
                >
                    <Plus size={28} color="white" strokeWidth={3} />
                </button>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50]"
                    />
                )}
            </AnimatePresence>
        </>
    );
};
