import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Shield,
    Users,
    ArrowRight,
    CheckCircle,
    Lock,
    Menu,
    X,
    Clock,
    Crosshair,
    Cpu,
    Database,
    Activity,
    DollarSign,
    Zap
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
}

// ---- DESIGN UTILS ----

const CornerMarker = ({ className = "" }) => (
    <div className={`absolute w-3 h-3 border-2 border-[var(--precision-accent)] ${className}`} />
);

const PhoneMockup = ({ src, alt, className = "" }: { src: string, alt: string, className?: string }) => (
    <div className={`relative mx-auto w-[280px] sm:w-[320px] bg-[#050505] rounded-[2.5rem] border-[8px] border-[#1a1a1a] shadow-2xl overflow-hidden ring-1 ring-white/10 ${className}`}>
        <img src={src} alt={alt} className="w-full h-auto object-cover block" />
        {/* Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-[2rem]" />
    </div>
);

// ---- COMPONENTS ----

const Navbar = ({ onLogin, isMenuOpen, setIsMenuOpen, scrollToSection }: any) => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-[var(--industrial-border)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--precision-accent)] flex items-center justify-center">
                    <Truck className="text-white w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-black leading-none tracking-tighter text-lg">CONTROL</span>
                    <span className="text-[var(--precision-accent)] text-[10px] uppercase tracking-[0.3em] font-bold leading-none">System V1</span>
                </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
                {['Recursos', 'Planos', 'Tecnologia'].map((item) => (
                    <button
                        key={item}
                        onClick={() => scrollToSection(item.toLowerCase())}
                        className="text-gray-400 hover:text-white uppercase text-[10px] font-bold tracking-[0.2em] transition-colors"
                    >
                        {item}
                    </button>
                ))}

                <div className="h-4 w-px bg-[var(--industrial-border)]"></div>

                <button
                    onClick={onLogin}
                    className="bg-white text-black hover:bg-[var(--precision-accent)] hover:text-white px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                    Acessar Console
                </button>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
            </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden bg-[#050505] border-b border-[var(--industrial-border)]"
                >
                    <div className="p-6 flex flex-col gap-4">
                        <button onClick={onLogin} className="w-full bg-[var(--precision-accent)] text-white py-4 text-xs font-black uppercase tracking-widest">
                            Inicializar Sistema
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </nav>
);

const Hero = ({ onLogin, onScrollToPlans }: any) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] pt-28 pb-20">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 w-full grid lg:grid-cols-2 gap-12 items-center">

                <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
                    {/* Tech Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 flex items-center gap-3 border border-[var(--industrial-border)] bg-[#0a0a0a] px-4 py-2"
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-mono">
                            System Operational • V1.1
                        </span>
                    </motion.div>

                    {/* Massive Typography */}
                    <div className="relative">
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter"
                        >
                            CONTROL
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800">
                                FRETE
                            </span>
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-gray-400 md:text-xl max-w-xl font-light leading-relaxed"
                    >
                        Ferramenta de precisão para gestão logística. <br className="hidden md:block" />
                        Elimine a ineficiência. Maximize o lucro.
                    </motion.p>

                    {/* PROMO BANNER (FEB ONLY) */}
                    {new Date().getMonth() === 1 && new Date().getFullYear() === 2026 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 p-4 border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm max-w-lg relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="flex items-center gap-3 relative z-10">
                                <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">Oferta de Fevereiro</div>
                                    <div className="text-sm font-bold text-white">
                                        Novos cadastros ganham <span className="text-orange-500">PRO GRÁTIS</span> até 28/02/2026!
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Industrial Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mt-10 flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
                    >
                        <button
                            onClick={onLogin}
                            className="group relative px-8 py-4 bg-[var(--precision-accent)] text-white overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                            <div className="flex items-center gap-4 relative z-10">
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Iniciar Sistema</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>

                        <button
                            onClick={onScrollToPlans}
                            className="px-8 py-4 bg-transparent border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
                        >
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Ver Planos</span>
                        </button>
                    </motion.div>
                </div>

                {/* Hero Image - Phone Mockup */}
                <div className="order-1 lg:order-2 flex justify-center perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, rotateY: 15, x: 50 }}
                        animate={{ opacity: 1, rotateY: -5, x: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="relative"
                    >
                        <PhoneMockup src="/assets/landing/dashboard.jpg" alt="Dashboard Principal" className="shadow-[0_0_80px_-20px_var(--precision-accent)]" />

                        {/* Floating elements */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute -bottom-10 -left-12 bg-[#0a0a0a] border border-[var(--industrial-border)] p-4 pr-8 hidden md:block"
                        >
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Resultado Mensal</div>
                            <div className="text-2xl font-black text-white">+ R$ 10.7k</div>
                            <CornerMarker className="bottom-0 left-0 border-b-2 border-l-2" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
            >
                <span className="text-[9px] uppercase tracking-[0.3em] text-white rotate-90 origin-left translate-x-3 mb-4">
                    Scroll
                </span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent" />
            </motion.div>
        </section>
    );
};

const StatBlock = ({ value, label, icon: Icon }: any) => (
    <div className="relative group p-8 bg-[#0a0a0a] border border-[var(--industrial-border)] hover:border-gray-600 transition-colors">
        <CornerMarker className="top-0 left-0 border-t-2 border-l-2 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CornerMarker className="bottom-0 right-0 border-b-2 border-r-2 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between mb-4">
            <Icon className="w-6 h-6 text-gray-600 group-hover:text-[var(--precision-accent)] transition-colors" />
            <Activity className="w-4 h-4 text-green-900 group-hover:text-green-500 animate-pulse" />
        </div>

        <div className="text-3xl font-black text-white mb-2 tracking-tighter">{value}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{label}</div>
    </div>
);

const FeatureRow = ({ title, desc, icon: Icon, imageSrc, reversed = false }: any) => (
    <div className={`flex flex-col md:flex-row gap-16 items-center py-20 ${reversed ? 'md:flex-row-reverse' : ''}`}>
        <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-[var(--precision-accent)]/20 blur-[60px] rounded-full" />
                {imageSrc ? (
                    <PhoneMockup src={imageSrc} alt={title} className="rotate-3 md:rotate-6 hover:rotate-0 transition-all duration-500" />
                ) : (
                    <div className="relative aspect-video bg-[#0a0a0a] border border-[var(--industrial-border)] p-2 w-[320px]">
                        <div className="w-full h-full bg-[#111] flex items-center justify-center text-gray-700">No Image</div>
                    </div>
                )}
            </div>
        </div>
        <div className="w-full md:w-1/2 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border border-gray-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--precision-accent)]" />
                </div>
                <div className="h-px w-12 bg-gray-800" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed text-lg">{desc}</p>
        </div>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [spotsRemaining, setSpotsRemaining] = useState(13);

    useEffect(() => {
        const timer = setTimeout(() => setSpotsRemaining(prev => prev > 7 ? prev - 1 : prev), 30000);
        return () => clearTimeout(timer);
    }, []);

    const scrollToPlans = () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="bg-[#050505] min-h-screen text-gray-300 font-sans selection:bg-[var(--precision-accent)] selection:text-white">

            <Navbar
                onLogin={onLogin}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                scrollToSection={(id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            />

            <Hero onLogin={onLogin} onScrollToPlans={scrollToPlans} />

            {/* Stats Band */}
            <div className="border-y border-[var(--industrial-border)] bg-[#080808]">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--industrial-border)]">
                    <StatBlock value="+5k" label="Motoristas" icon={Users} />
                    <StatBlock value="99.9%" label="Uptime" icon={Cpu} />
                    <StatBlock value="+15k" label="Viagens" icon={CheckCircle} />
                    <StatBlock value="24/7" label="Segurança" icon={Shield} />
                </div>
            </div>

            {/* Features (Broken Grid) */}
            <section id="recursos" className="py-32 px-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20 text-center md:text-left">
                        <span className="text-[var(--precision-accent)] font-mono text-xs uppercase tracking-widest block mb-4">// System Modules</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Tecnologia de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">Ponta a Ponta</span>
                        </h2>
                    </div>

                    <FeatureRow
                        title="Gestão Financeira de Precisão"
                        desc="Controle total sobre entradas e saídas. Visualize suas pendências de fretes e contas a pagar em um painel unificado e intuitivo."
                        icon={DollarSign}
                        imageSrc="/assets/landing/finances.jpg"
                    />

                    <FeatureRow
                        reversed
                        title="Extrato Detalhado"
                        desc="Mantenha um histórico completo de todas as suas viagens. Saiba exatamente qual foi o lucro líquido de cada frete descontando despesas e comissões."
                        icon={Clock}
                        imageSrc="/assets/landing/history.jpg"
                    />

                    <FeatureRow
                        title="Sistema de Indicação"
                        desc="Transforme sua rede de contatos em renda extra. Compartilhe seu link exclusivo e ganhe comissão recorrente por cada motorista indicado."
                        icon={Zap}
                        imageSrc="/assets/landing/referrals.jpg"
                    />

                    <FeatureRow
                        reversed
                        title="Login Seguro"
                        desc="Seus dados são criptografados com padrões militares. Acesso rápido, seguro e disponível 24 horas por dia em qualquer dispositivo."
                        icon={Lock}
                        imageSrc="/assets/landing/login.jpg"
                    />
                </div>
            </section>

            {/* Plans Section (Industrial Tables) */}
            <section id="planos" className="py-32 bg-[#080808] border-t border-[var(--industrial-border)]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Acesso ao Sistema</h2>
                        <p className="text-gray-500 max-w-xl mx-auto font-light">Selecione o nível de acesso adequado para sua operação.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 border border-[var(--industrial-border)] hover:border-white transition-colors flex flex-col bg-[#050505]">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Nível Básico</div>
                            <div className="text-4xl font-black text-white mb-2">R$ 9<span className="text-xl">,90</span></div>
                            <div className="text-gray-500 text-sm mb-8">Cobrado mensalmente</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Fretes Ilimitados', 'Relatórios básicos', 'Calculadora'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-1 h-1 bg-gray-500" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 border border-gray-700 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-colors">
                                Assinar Mensal
                            </button>
                        </div>

                        <div className="p-8 border-2 border-[var(--precision-accent)] bg-[#050505] relative transform md:-translate-y-4 shadow-[0_0_50px_-20px_var(--precision-accent)]">
                            <div className="absolute top-0 right-0 bg-[var(--precision-accent)] text-white text-[10px] font-bold uppercase px-3 py-1">
                                Oferta Limitada
                            </div>
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--precision-accent)] mb-6">Anual Pro</div>
                            <div className="text-5xl font-black text-white mb-2">R$ 34<span className="text-2xl">,99</span></div>
                            <div className="text-gray-500 text-sm mb-8">Valor promocional (R$ 2,90/mês)</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Economia de 70%', 'Prioridade no Suporte', 'Módulo Financeiro', 'Sem anúncios', 'Mentoria em Grupo'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                                        <CheckCircle className="w-4 h-4 text-[var(--precision-accent)]" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 bg-[var(--precision-accent)] text-white font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-colors">
                                Garantir Oferta
                            </button>
                            <p className="mt-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">Restam {spotsRemaining} vagas</p>
                        </div>

                        <div className="p-8 border border-[var(--industrial-border)] hover:border-white transition-colors flex flex-col bg-[#050505]">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Nível Enterprise</div>
                            <div className="text-4xl font-black text-white mb-2">R$ 249</div>
                            <div className="text-gray-500 text-sm mb-8">Pagamento único (Vitalício)</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Acesso para sempre', 'Mentorias Individuais', 'Selo Fundador', 'Funcionalidades Alpha'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-1 h-1 bg-gray-500" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 border border-gray-700 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-colors">
                                Comprar Vitalício
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--industrial-border)] py-12 bg-[#050505] text-center">
                <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-black tracking-[0.2em] uppercase">Control Frete Systems</span>
                </div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                    © {new Date().getFullYear()} Todos os direitos reservados.
                </p>
            </footer>

        </div>
    );
};
