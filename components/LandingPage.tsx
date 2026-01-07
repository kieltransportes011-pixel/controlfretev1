import React from 'react';
import {
    Truck,
    TrendingUp,
    Target,
    Calendar,
    Shield,
    Smartphone,
    CheckCircle,
    ArrowRight,
    Layout,
    Lock,
    FileText,
    BarChart,
    AlertCircle,
    Eye,
    Menu,
    X,
    Star,
    Zap
} from 'lucide-react';
import { Button } from './Button';

interface LandingPageProps {
    onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    const BenefitItem = ({ text }: { text: string }) => (
        <div className="flex items-start gap-3">
            <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-slate-600 dark:text-slate-300 font-medium">{text}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <img src="/logo-official.png" alt="Control Frete" className="h-10 w-auto object-contain" />
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand-300 transition-colors">Como Funciona</button>
                            <button onClick={() => scrollToSection('plans')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand-300 transition-colors">Planos</button>
                            <button
                                onClick={onLogin}
                                className="bg-brand text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
                            >
                                Acessar Sistema
                            </button>
                        </div>

                        <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-slideDown">
                        <div className="px-4 pt-2 pb-6 space-y-4">
                            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-slate-600 dark:text-slate-300 font-medium">Como Funciona</button>
                            <button onClick={() => scrollToSection('plans')} className="block w-full text-left py-2 text-slate-600 dark:text-slate-300 font-medium">Planos</button>
                            <Button fullWidth onClick={onLogin} className="mt-4">
                                Acessar Sistema
                            </Button>
                        </div>
                    </div>
                )}
            </nav>

            {/* 1. Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden text-center lg:text-left">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-fadeIn">
                            <Shield className="w-3 h-3" />
                            <span>Controle Profissional</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-[1.1] animate-slideUp">
                            Controle seus fretes, organize sua operação e <span className="text-brand">cresça sem limitações.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed animate-slideUp delay-100 max-w-2xl mx-auto lg:mx-0">
                            O Control Frete ajuda você a registrar fretes, acompanhar seu histórico e profissionalizar sua gestão — do FREE ao PRO, no seu ritmo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slideUp delay-200">
                            <button
                                onClick={onLogin}
                                className="w-full sm:w-auto px-8 py-4 bg-brand text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            >
                                Começar Grátis
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onLogin}
                                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold text-lg border-2 border-slate-200 dark:border-slate-700 hover:border-brand dark:hover:border-brand hover:text-brand dark:hover:text-brand transition-colors"
                            >
                                Testar o PRO
                            </button>
                        </div>
                    </div>

                    {/* Hero Image/Mockup */}
                    <div className="relative z-10 flex justify-center lg:justify-end animate-slideUp delay-300 mt-8 lg:mt-0">
                        <div className="relative rounded-[2.5rem] border-[8px] border-slate-900 overflow-hidden shadow-2xl max-w-[320px]">
                            <img src="/assets/landing/print-2.jpg" alt="Dashboard Control Frete" className="w-full h-auto" />
                        </div>
                        {/* Floating Badges */}
                        <div className="absolute top-10 -left-4 sm:-left-12 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-bounce-slow">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Lucro Real</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Sem mistério</p>
                            </div>
                        </div>
                        <div className="absolute bottom-10 -right-4 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Histórico</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">100% Organizado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Prova de Valor Imediato (Dores) */}
            <section className="py-20 bg-white dark:bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6">
                            Cansado de perder o controle?
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                            Chega de anotações perdidas e contas que não batem no final do mês.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Histórico Bagunçado</h3>
                            <p className="text-slate-600 dark:text-slate-400">Nunca saber exatamente onde foi feita aquela viagem ou quanto foi gasto.</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center text-yellow-600 mb-6">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Meta às Escuras</h3>
                            <p className="text-slate-600 dark:text-slate-400">Trabalhar sem saber quanto falta para bater a meta do mês.</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Falta de Organização</h3>
                            <p className="text-slate-600 dark:text-slate-400">Misturar contas pessoais com as do caminhão e perder a noção do lucro.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3 & 4. Planos FREE vs PRO */}
            <section id="plans" className="py-20 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-8 items-stretch">

                        {/* FREE Plan */}
                        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Plano FREE</h3>
                                <p className="text-slate-500 font-medium">Ideal para testar e começar.</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex items-center gap-3">
                                    <Layout className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300 font-bold">Até 5 registros de fretes por mês</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300">Histórico dos últimos 7 dias</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300">Calculadora de Fretes</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300">Uso básico sem cartão</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <p className="text-xs text-slate-500 mb-4 font-medium text-center">
                                    Ideal para testar o sistema e entender seu fluxo de trabalho.
                                </p>
                                <button
                                    onClick={onLogin}
                                    className="w-full py-4 text-slate-700 dark:text-white font-bold border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Começar Grátis
                                </button>
                            </div>
                        </div>

                        {/* PRO Plan */}
                        <div className="bg-slate-900 dark:bg-black p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col text-white transform lg:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-brand text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-bl-2xl">
                                Recomendado
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-3xl font-black text-white">Plano PRO</h3>
                                    <Star className="w-6 h-6 text-brand fill-brand" />
                                </div>
                                <p className="text-slate-400 font-medium">Para quem quer crescer de verdade.</p>
                            </div>

                            <div className="space-y-5 mb-8 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-brand rounded-full">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white font-bold text-lg">Registros de fretes ILIMITADOS</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-brand-secondary" />
                                    <span className="text-slate-200">Histórico completo desde o início</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-brand-secondary" />
                                    <span className="text-slate-200">Agenda Inteligente</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-brand-secondary" />
                                    <span className="text-slate-200">Controle de Metas Mensais</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-brand-secondary" />
                                    <span className="text-slate-200">Emissão de Recibos e Relatórios</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-brand-secondary" />
                                    <span className="text-slate-200">Suporte Prioritário</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <p className="text-sm text-slate-400 mb-4 font-bold text-center uppercase tracking-wide">
                                    Sem travas, sem limites, sem perda de dados.
                                </p>
                                <button
                                    onClick={onLogin}
                                    className="w-full py-4 bg-brand text-white font-black text-lg rounded-xl hover:bg-brand-hover shadow-lg shadow-brand/25 transition-all hover:scale-[1.02]"
                                >
                                    ATIVAR PRO AGORA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Gatilhos Internos */}
            <section className="py-20 bg-white dark:bg-slate-950/50">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-12">
                        O sistema cresce com você
                    </h2>

                    <div className="grid sm:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <Lock className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Chegou ao limite mensal?</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">O plano PRO libera registros ilimitados.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <BarChart className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Quer ver seu histórico?</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">O PRO destrava todo o seu passado.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <Target className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Quer bater metas?</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Planejamento é para quem pensa no próximo nível.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Transparência e Confiança */}
            <section className="py-20 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                        Seus dados são seus.
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        O Control Frete não monitora seus ganhos, despesas ou relatórios financeiros individuais para venda de dados.
                        <br />
                        <span className="font-bold text-slate-800 dark:text-slate-200">O upgrade desbloqueia funcionalidades, não o acesso aos seus dados.</span>
                    </p>
                </div>
            </section>

            {/* 7. CTA Final */}
            <section className="py-20 bg-white dark:bg-slate-950 text-center px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6">
                        Pronto para organizar sua vida na estrada?
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-10">
                        Comece grátis hoje mesmo. Faça upgrade só quando fizer sentido para você.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onLogin}
                            className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Criar Conta Grátis
                        </button>
                        <button
                            onClick={onLogin}
                            className="px-8 py-4 bg-brand text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 hover:scale-105 transition-transform"
                        >
                            Ativar PRO
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
                        <img src="/logo-official.png" alt="Control Frete" className="h-6 w-auto grayscale" />
                    </div>
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Control Frete. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};
