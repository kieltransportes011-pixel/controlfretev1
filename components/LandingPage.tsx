
import React from 'react';
import {
    Truck,
    TrendingUp,
    Target,
    Calculator,
    Calendar,
    Shield,
    Smartphone,
    CheckCircle,
    ArrowRight,
    Menu,
    X,
    ChevronRight,
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

    const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-brand/10 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-4 text-brand dark:text-brand-300">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
    );

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
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <img
                                src="/logo-control-frete.png"
                                alt="Control Frete"
                                className="h-10 w-auto object-contain"
                            />
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand-300 transition-colors">Funcionalidades</button>
                            <button onClick={() => scrollToSection('benefits')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand-300 transition-colors">Benefícios</button>
                            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand-300 transition-colors">Planos</button>
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
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-slate-600 dark:text-slate-300 font-medium">Funcionalidades</button>
                            <button onClick={() => scrollToSection('benefits')} className="block w-full text-left py-2 text-slate-600 dark:text-slate-300 font-medium">Benefícios</button>
                            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-slate-600 dark:text-slate-300 font-medium">Planos</button>
                            <Button fullWidth onClick={onLogin} className="mt-4">
                                Acessar Sistema
                            </Button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-fadeIn">
                        <Star className="w-3 h-3" />
                        <span>Gestão Profissional de Verdade</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight animate-slideUp">
                        Controle total do seu transporte na palma da mão
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slideUp delay-100">
                        Abandone as anotações em papel. O Control Frete é a ferramenta definitiva para motoristas e transportadoras gerenciarem ganhos, despesas e metas com precisão.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp delay-200">
                        <button
                            onClick={onLogin}
                            className="w-full sm:w-auto px-8 py-4 bg-brand text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                        >
                            Começar Agora Grátis
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Saiba Mais
                        </button>
                    </div>
                </div>

                {/* Abstract Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 dark:bg-brand/10 rounded-full blur-3xl -z-10" />
            </section>

            {/* Social Proof */}
            <section className="px-4 pb-20 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        "Hoje consigo saber exatamente quanto lucro em cada frete.",
                        "Aplicativo simples, sem complicação.",
                        "Facilitou muito o controle dos meus gastos.",
                        "Agora tenho mais organização e menos prejuízo."
                    ].map((text, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                            <div className="flex gap-1 text-brand-secondary mb-3">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-4 leading-relaxed">"{text}"</p>
                            <div className="flex items-center gap-2 opacity-70">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {['A', 'R', 'C', 'M'][i]}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parceiro Verificado</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-white dark:bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-brand font-bold uppercase tracking-widest text-sm mb-3">Funcionalidades</h2>
                        <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Tudo o que você precisa</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={TrendingUp}
                            title="Gestão Financeira"
                            description="Acompanhe suas receitas, despesas e lucro real em tempo real com gráficos intuitivos."
                        />
                        <FeatureCard
                            icon={Truck}
                            title="Controle de Fretes"
                            description="Registre cada viagem, valores a receber e status de pagamento de forma simplificada."
                        />
                        <FeatureCard
                            icon={Target}
                            title="Metas Mensais"
                            description="Defina objetivos de faturamento e acompanhe seu progresso dia a dia para alcançar o sucesso."
                        />
                        <FeatureCard
                            icon={Calendar}
                            title="Agenda Inteligente"
                            description="Organize suas viagens e compromissos em um calendário integrado visualmente."
                        />
                        <FeatureCard
                            icon={Calculator}
                            title="Calculadora de Fretes"
                            description="Nunca mais tenha prejuízo. Calcule exatamente quanto cobrar baseando-se em seus custos."
                        />
                        <FeatureCard
                            icon={Smartphone}
                            title="100% Mobile"
                            description="Acesse de qualquer lugar, direto do seu celular, tablet ou computador."
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 sm:p-16 overflow-hidden relative text-white">
                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <h3 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">Chega de perder dinheiro por desorganização</h3>
                                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                                    O Control Frete foi desenvolvido pensando na realidade das estradas brasileiras. Simples, direto e funciona.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-secondary">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Rápido e Leve</h4>
                                            <p className="text-slate-400 text-sm">Funciona bem até em conexões lentas.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-secondary">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Seus dados protegidos</h4>
                                            <p className="text-slate-400 text-sm">Segurança de nível bancário para suas informações.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <h4 className="font-bold text-xl mb-6">Porque escolher o Control Frete?</h4>
                                <div className="space-y-4">
                                    <BenefitItem text="Elimine o caderno de anotações" />
                                    <BenefitItem text="Saiba para onde vai seu dinheiro" />
                                    <BenefitItem text="Previsibilidade de ganhos" />
                                    <BenefitItem text="Suporte dedicado" />
                                    <BenefitItem text="Atualizações constantes" />
                                </div>
                                <Button fullWidth onClick={onLogin} className="mt-8">
                                    Criar Conta Gratuita <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-20 text-center px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-6">
                        Pronto para profissionalizar sua gestão?
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-10">
                        Junte-se a milhares de motoristas que já estão no controle. Teste grátis por 7 dias, sem compromisso.
                    </p>
                    <button
                        onClick={onLogin}
                        className="px-10 py-5 bg-brand text-white rounded-2xl font-bold text-xl shadow-xl shadow-brand/30 hover:scale-105 transition-transform"
                    >
                        Acessar Sistema Agora
                    </button>
                    <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest font-bold">
                        Não é necessário cartão de crédito para começar
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <img
                            src="/logo-control-frete.png"
                            alt="Control Frete"
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Control Frete. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};
