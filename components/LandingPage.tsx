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
    Zap,
    Users,
    ChevronDown,
    MapPin,
    Wallet,
    Sparkles
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

    const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>
    );

    const SectionImage = ({ src, alt, caption }: { src: string, alt: string, caption?: string }) => (
        <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand/20 to-brand-secondary/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 overflow-hidden shadow-2xl bg-white">
                <img src={src} alt={alt} className="w-full h-auto" />
            </div>
            {caption && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 whitespace-nowrap animate-bounce-slow">
                    <p className="text-xs font-black text-brand uppercase tracking-widest">{caption}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden font-sans selection:bg-brand selection:text-white">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-2">
                            <img src="/logo-official.png" alt="Control Frete" className="h-10 w-auto object-contain" />
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter hidden sm:block">CONTROL <span className="text-brand">FRETE</span></span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-slate-500 hover:text-brand transition-colors uppercase tracking-widest">Recursos</button>
                            <button onClick={() => scrollToSection('plans')} className="text-sm font-bold text-slate-500 hover:text-brand transition-colors uppercase tracking-widest">Planos</button>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                            <button
                                onClick={onLogin}
                                className="bg-slate-900 dark:bg-brand text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-xl shadow-brand/20"
                            >
                                Entrar no App
                            </button>
                        </div>

                        <button className="md:hidden p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 animate-slideDown p-6 space-y-4">
                        <button onClick={() => scrollToSection('features')} className="block w-full text-left py-4 text-slate-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-50">Recursos</button>
                        <button onClick={() => scrollToSection('plans')} className="block w-full text-left py-4 text-slate-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-50">Planos</button>
                        <Button fullWidth onClick={onLogin} className="py-5 text-sm uppercase font-black tracking-widest">
                            Acessar Minha Conta
                        </Button>
                    </div>
                )}
            </nav>

            {/* 1. Hero Section */}
            <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-brand/5 text-brand px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-8 animate-fadeIn border border-brand/10">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>O App Nº1 do Caminhoneiro</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-[1] animate-slideUp">
                            Tome o Controle do Seu <span className="text-brand">Caminhão.</span>
                        </h1>

                        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed animate-slideUp delay-100 max-w-xl mx-auto lg:mx-0">
                            Pare de perder dinheiro com anotações manuais. O Control Frete organiza seus lucros, gastos e metas em um app profissional e fácil de usar.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 animate-slideUp delay-200">
                            <button
                                onClick={onLogin}
                                className="w-full sm:w-auto px-10 py-5 bg-brand text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand/40 hover:scale-105 transition-all flex items-center justify-center gap-3"
                            >
                                Começar Agora Grátis
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => scrollToSection('plans')}
                                className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] font-black text-sm uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 hover:border-brand transition-colors"
                            >
                                Ver Planos
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 opacity-60">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800" />
                                ))}
                            </div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">+5.000 Motoristas no Controle</p>
                        </div>
                    </div>

                    {/* Hero Image - Dashboard */}
                    <div className="animate-slideUp delay-300">
                        <SectionImage
                            src="/assets/landing/dashboard.jpg"
                            alt="Dashboard do App"
                            caption="Gestão Completa em Tempo Real"
                        />
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 -left-64 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[120px] -z-10" />
            </section>

            {/* 2. Stats Section */}
            <section className="py-12 border-y border-slate-50 dark:border-slate-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between gap-8 md:gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-3 font-black text-xl text-slate-900 dark:text-white">
                        <Truck className="w-6 h-6 text-brand" />
                        TRANSPORTES
                    </div>
                    <div className="flex items-center gap-3 font-black text-xl text-slate-900 dark:text-white">
                        <Shield className="w-6 h-6 text-brand" />
                        SEGURANÇA
                    </div>
                    <div className="flex items-center gap-3 font-black text-xl text-slate-900 dark:text-white">
                        <TrendingUp className="w-6 h-6 text-brand" />
                        LUCRO REAL
                    </div>
                    <div className="flex items-center gap-3 font-black text-xl text-slate-900 dark:text-white">
                        <Users className="w-6 h-6 text-brand" />
                        COMUNIDADE
                    </div>
                </div>
            </section>

            {/* 3. Features Grid */}
            <section id="features" className="py-32 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">O que você ganha com o <span className="text-brand">Control Frete?</span></h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400">Desenvolvido especificamente para a realidade de quem vive na estrada, unindo profissionalismo e simplicidade.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Wallet}
                            title="Financeiro"
                            description="Controle de entradas, saídas e lucro líquido real sem mistério."
                            color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Rotas e Agenda"
                            description="Organize suas viagens futuras e não perca nenhum compromisso."
                            color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        />
                        <FeatureCard
                            icon={FileText}
                            title="Recibos Pro"
                            description="Emita recibos bonitos e envie direto pelo WhatsApp para seus clientes."
                            color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                        />
                    </div>
                </div>
            </section>

            {/* 4. Deep Dive Feature: Finances */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1">
                        <SectionImage
                            src="/assets/landing/financas.jpg"
                            alt="Gestão de Finanças"
                            caption="Controle de Contas a Pagar e Receber"
                        />
                    </div>
                    <div className="order-1 lg:order-2">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase leading-none">Suas Finanças no <span className="text-brand">Verde.</span></h2>
                        <div className="space-y-8">
                            {[
                                { title: "Contas Pendentes", desc: "Nunca mais esqueça de cobrar um cliente ou pagar um fornecedor." },
                                { title: "Visão Semanal e Mensal", desc: "Saiba quanto você faturou na semana e compare com suas metas." },
                                { title: "Saídas Detalhadas", desc: "Registre diesel, manutenção e alimentação de forma simples." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 bg-brand/10 p-1.5 h-fit rounded-lg text-brand">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1 tracking-wider">{item.title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Deep Dive Feature: History */}
            <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-8 tracking-tight uppercase leading-none">Todo seu <span className="text-brand-secondary">Histórico</span> Organizado.</h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                Esqueça as planilhas complicadas. No Control Frete, cada viagem fica salva com data, valor e divisão de lucros (Empresa, Motorista, Reserva).
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="text-3xl font-black text-brand-secondary mb-1 tabular-nums">100%</div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">De Acesso aos Dados</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="text-3xl font-black text-brand-secondary mb-1 tabular-nums">ZERO</div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Papelada Perdida</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <SectionImage src="/assets/landing/historico.jpg" alt="Histórico de Fretes" />
                        </div>
                    </div>
                </div>
                {/* Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-[100px]" />
            </section>

            {/* 6. Referral System Section */}
            <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <SectionImage src="/assets/landing/afiliados.jpg" alt="Sistema de Afiliados" caption="Ganhe com cada indicação" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 bg-accent-success/10 text-accent-success px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Bônus Exclusivo PRO</span>
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight leading-none">Indique Amigos e <span className="text-accent-success">Fature Mais.</span></h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Compartilhe seu link exclusivo com outros caminhoneiros. Quando eles virarem PRO, você ganha <span className="font-black text-slate-900 dark:text-white">20% de comissão</span> em todas as mensalidades deles.
                        </p>
                        <Button onClick={onLogin} className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
                            Quero Ser Afiliado
                        </Button>
                    </div>
                </div>
            </section>

            {/* 7. Security Section */}
            <section className="py-32 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase leading-none">Dados Protegidos por <span className="text-brand">Criptografia.</span></h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                                Utilizamos tecnologia de ponta para garantir que seu login seja 100% seguro e seus dados financeiros fiquem guardados a sete chaves.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-brand">
                                        <Lock size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest leading-none mb-1">Backup Automático</h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Nuvem Segura 24/7</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-brand">
                                        <Shield size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest leading-none mb-1">Privacidade Total</h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">LGPD Compliance</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-md mx-auto lg:ml-auto">
                            <SectionImage src="/assets/landing/login.jpg" alt="Login Seguro" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Pricing Section */}
            <section id="plans" className="py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">O Plano que Cabe no Seu <span className="text-brand">Caminhão.</span></h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Comece grátis, domine sua operação e faça o upgrade quando estiver pronto para escalar.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* FREE Plan */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col group hover:border-slate-200 transition-all">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Plano FREE</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">R$ 0</span>
                                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ para sempre</span>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12 flex-1">
                                {[
                                    "Até 5 registros de fretes/mês",
                                    "Relatórios dos últimos 7 dias",
                                    "Calculadora de Fretes",
                                    "Acesso via Mobile e Desktop",
                                    "Gestão de Clientes básica"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onLogin}
                                className="w-full py-5 text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Começar Agora
                            </button>
                        </div>

                        {/* PRO Plan */}
                        <div className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col text-white transform lg:-translate-y-6 scale-105 border-4 border-brand">
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-bl-3xl">
                                RECOMENDADO
                            </div>

                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Plano PRO</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white tracking-tighter">R$ 59,99</span>
                                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">/ anual</span>
                                </div>
                            </div>

                            <div className="space-y-6 mb-12 flex-1">
                                {[
                                    "Registros de Fretes ILIMITADOS",
                                    "Histórico COMPLETO sem limites",
                                    "Agenda Inteligente do Motorista",
                                    "Controle de Metas de Faturamento",
                                    "Emissão de Recibos Profissionais",
                                    "Sistema de Afiliados (Gere Renda)",
                                    "Suporte VIP via WhatsApp"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="bg-brand p-1 rounded-full text-white">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-slate-200 text-sm font-bold">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onLogin}
                                className="w-full py-6 bg-brand text-white font-black text-sm uppercase tracking-[0.25em] rounded-[1.5rem] hover:scale-105 transition-all shadow-xl shadow-brand/40"
                            >
                                Ativar Plano PRO
                            </button>
                            <p className="mt-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancele quando quiser · Sem fidelidade</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Final CTA */}
            <section className="py-40 bg-brand relative overflow-hidden text-center text-white px-4">
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="text-5xl sm:text-6xl font-black mb-8 uppercase tracking-tighter leading-none">
                        Diga adeus à bagunça financeira.
                    </h2>
                    <p className="text-lg text-white/80 mb-12 font-medium max-w-xl mx-auto leading-relaxed">
                        Faça como milhares de motoristas que já profissionalizaram seu trabalho com o Control Frete.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={onLogin}
                            className="bg-white text-brand px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                        >
                            Criar Minha Conta Grátis
                        </button>
                    </div>
                </div>

                {/* Decor */}
                <Truck className="absolute -bottom-20 -left-20 w-80 h-80 text-white/5 -rotate-12" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-950 py-20 border-t border-slate-50 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex flex-col items-center gap-8">
                        <img src="/logo-official.png" alt="Control Frete" className="h-12 w-auto" />

                        <div className="flex gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-[10px] font-black uppercase text-slate-400 hover:text-brand tracking-widest">Recursos</button>
                            <button onClick={() => scrollToSection('plans')} className="text-[10px] font-black uppercase text-slate-400 hover:text-brand tracking-widest">Planos</button>
                            <button onClick={() => onLogin()} className="text-[10px] font-black uppercase text-slate-400 hover:text-brand tracking-widest">Login</button>
                        </div>

                        <div className="h-px w-20 bg-slate-100 dark:bg-slate-900" />

                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            © {new Date().getFullYear()} Control Frete · Feito com <Star className="inline w-3 h-3 text-brand fill-brand" /> para a Estrada
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
