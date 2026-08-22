import React, { useState } from 'react';
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
    Cpu,
    Activity,
    DollarSign
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] pt-28 pb-20 border-b border-[var(--industrial-border)]">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Brutalist Corner Markers */}
            <CornerMarker className="top-24 left-6 border-t-2 border-l-2" />
            <CornerMarker className="top-24 right-6 border-t-2 border-r-2" />
            <CornerMarker className="bottom-6 left-6 border-b-2 border-l-2" />
            <CornerMarker className="bottom-6 right-6 border-b-2 border-r-2" />

            {/* Massive Background Title */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden opacity-5 z-0 hidden xl:block">
                <span className="text-[20rem] font-black tracking-tighter text-white font-mono leading-none">
                    FRETE
                </span>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1 relative z-20">
                    {/* Tech Badge */}
                    <motion.div
                        initial={{ opacity: 0, x: -25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 flex items-center gap-3 border border-[var(--industrial-border)] bg-[#0a0a0a] px-4 py-2"
                    >
                        <div className="w-2 h-2 bg-[var(--precision-accent)] rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-mono">
                            System Operational • V1.2
                        </span>
                    </motion.div>

                    {/* Massive Typography */}
                    <div className="relative mb-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-6xl sm:text-7xl md:text-8xl xl:text-[7.5rem] font-black text-white leading-[0.85] tracking-tighter uppercase"
                        >
                            CONTROL
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--precision-accent)] via-blue-200 to-white">
                                FRETE
                            </span>
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-400 text-base md:text-lg max-w-lg font-mono tracking-tight leading-relaxed mb-8 border-l-2 border-[var(--precision-accent)] pl-4"
                    >
                        // SISTEMA LOGÍSTICO INTEGRADO.<br />
                        Elimine a ineficiência. Maximize o lucro e controle todas as despesas da sua operação.
                    </motion.p>

                    {/* Industrial Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
                    >
                        <button
                            onClick={onLogin}
                            className="group relative px-8 py-4 bg-[var(--precision-accent)] text-white overflow-hidden shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
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

                {/* Hero Image - Phone Mockup (Layered Over Title) */}
                <div className="order-1 lg:order-2 flex justify-center perspective-1000 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, rotateY: 15, x: 50 }}
                        animate={{ opacity: 1, rotateY: -8, x: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="relative"
                    >
                        <PhoneMockup src="/assets/landing/dashboard.jpg" alt="Dashboard Principal" className="shadow-[0_0_80px_-20px_var(--precision-accent)] border-[8px] border-[#161616]" />

                        {/* Floating element */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute -bottom-6 -left-12 bg-[#0a0a0a] border border-[var(--industrial-border)] p-4 pr-8 hidden md:block z-30"
                        >
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">// Resultado Mensal</div>
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
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35"
            >
                <span className="text-[9px] uppercase tracking-[0.3em] text-white rotate-90 origin-left translate-x-3 mb-4">
                    Scroll
                </span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent" />
            </motion.div>
        </section>
    );
};

const StatBlock = ({ value, label, icon: Icon, index = 0 }: { value: string; label: string; icon: any; index?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="relative group p-8 bg-[#0a0a0a] border border-[var(--industrial-border)] hover:border-gray-600 transition-colors"
    >
        <CornerMarker className="top-0 left-0 border-t-2 border-l-2 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CornerMarker className="bottom-0 right-0 border-b-2 border-r-2 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between mb-4">
            <Icon className="w-6 h-6 text-gray-600 group-hover:text-[var(--precision-accent)] transition-colors" />
            <Activity className="w-4 h-4 text-green-900 group-hover:text-green-500 animate-pulse" />
        </div>

        <div className="text-3xl font-black text-white mb-2 tracking-tighter">{value}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">{label}</div>
    </motion.div>
);

// Features data structure for the interactive showcase
const featuresData = [
    {
        title: "Gestão Financeira de Precisão",
        desc: "Controle total sobre entradas e saídas. Visualize suas pendências de fretes e contas a pagar em um painel unificado e intuitivo.",
        icon: DollarSign,
        imageSrc: "/assets/landing/finances.jpg"
    },
    {
        title: "Extrato Detalhado",
        desc: "Mantenha um histórico completo de todas as suas viagens. Saiba exatamente qual foi o lucro líquido de cada frete descontando despesas e comissões.",
        icon: Clock,
        imageSrc: "/assets/landing/history.jpg"
    },
    {
        title: "Gestão de Frota Completa",
        desc: "Cadastre seus veículos e acompanhe quilometragem e histórico de manutenções — tudo em um só lugar, sem depender de planilhas soltas.",
        icon: Truck,
        imageSrc: "/assets/landing/frota.jpg"
    }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    const scrollToPlans = () => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });

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
                    <StatBlock value="Ilimitado" label="Fretes Registrados" icon={Users} index={0} />
                    <StatBlock value="99.9%" label="Uptime" icon={Cpu} index={1} />
                    <StatBlock value="Simples" label="Fácil de Usar" icon={CheckCircle} index={2} />
                    <StatBlock value="24/7" label="Segurança" icon={Shield} index={3} />
                </div>
            </div>

            {/* Features (Interactive Showcase) */}
            <section id="recursos" className="py-32 px-6 relative overflow-hidden bg-[#050505]">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6 }}
                        className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div>
                            <span className="text-[var(--precision-accent)] font-mono text-xs uppercase tracking-widest block mb-4">// System Modules</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                                Tecnologia de <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">Ponta a Ponta</span>
                            </h2>
                        </div>
                        <p className="text-gray-500 max-w-md font-mono text-xs tracking-tight leading-relaxed">
                            // Clique nos recursos ao lado para visualizar a interface em tempo real no dispositivo móvel.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
                        {/* Left Side: interactive selection buttons */}
                        <div className="space-y-4 relative z-10">
                            {featuresData.map((feat, index) => {
                                const Icon = feat.icon;
                                const isActive = activeFeature === index;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setActiveFeature(index)}
                                        className={`w-full text-left p-6 border transition-all duration-300 flex items-start gap-4 rounded-none ${
                                            isActive 
                                                ? 'border-[var(--precision-accent)] bg-blue-950/20 shadow-[0_0_30px_-15px_rgba(59,130,246,0.4)]' 
                                                : 'border-[var(--industrial-border)] bg-transparent hover:border-gray-700'
                                        }`}
                                    >
                                        <div className={`p-3 border transition-colors rounded-none ${
                                            isActive ? 'border-[var(--precision-accent)] text-[var(--precision-accent)]' : 'border-gray-800 text-gray-500'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-black uppercase tracking-tight text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                                    {feat.title}
                                                </h3>
                                                {isActive && (
                                                    <span className="text-[10px] font-mono text-[var(--precision-accent)] animate-pulse">// ATIVO</span>
                                                )}
                                            </div>
                                            <p className={`mt-2 text-xs leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {feat.desc}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Side: Showcase Device Mockup */}
                        <div className="flex justify-center relative min-h-[460px] items-center">
                            {/* Glow behind device */}
                            <div className="absolute w-[350px] h-[350px] bg-[var(--precision-accent)]/10 blur-[90px] rounded-full pointer-events-none" />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeFeature}
                                    initial={{ opacity: 0, scale: 0.95, y: 15, rotateY: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, rotateY: -3 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -15, rotateY: -8 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative z-10"
                                >
                                    <PhoneMockup 
                                        src={featuresData[activeFeature].imageSrc} 
                                        alt={featuresData[activeFeature].title} 
                                        className="shadow-[0_0_80px_-20px_var(--precision-accent)] border-[8px] border-[#161616]" 
                                    />
                                    <div className="absolute -bottom-4 -right-4 bg-[#0a0a0a] border border-[var(--industrial-border)] px-4 py-2 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                                        Módula: {featuresData[activeFeature].title.split(' ')[0]}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* Plans Section (Industrial Tables) */}
            <section id="planos" className="py-32 bg-[#080808] border-t border-[var(--industrial-border)] relative">
                {/* Visual grid details */}
                <CornerMarker className="top-6 left-6 border-t-2 border-l-2" />
                <CornerMarker className="bottom-6 right-6 border-b-2 border-r-2" />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Acesso ao Sistema</h2>
                        <p className="text-gray-500 max-w-xl mx-auto font-light">Selecione o nível de acesso adequado para sua operação.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch">
                        {/* Mensal */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5 }}
                            className="p-8 border border-[var(--industrial-border)] hover:border-gray-500 transition-all flex flex-col bg-[#050505] duration-300"
                        >
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 font-mono">// Nível Básico</div>
                            <div className="text-4xl font-black text-white mb-2">R$ 9<span className="text-xl">,90</span></div>
                            <div className="text-gray-500 text-sm mb-8">Cobrado mensalmente</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Fretes Ilimitados', 'Relatórios básicos', 'Calculadora'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-1 h-1 bg-gray-500" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 border border-gray-700 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-colors rounded-none">
                                Assinar Mensal
                            </button>
                        </motion.div>

                        {/* Anual Pro */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="p-8 border-2 border-[var(--precision-accent)] bg-[#050505] relative transform md:-translate-y-4 shadow-[0_0_50px_-25px_var(--precision-accent)] hover:shadow-[0_0_50px_-10px_var(--precision-accent)] hover:scale-[1.02] transition-all duration-500 group flex flex-col"
                        >
                            <div className="absolute top-0 right-0 bg-[var(--precision-accent)] text-white text-[10px] font-black uppercase px-3 py-1 tracking-widest">
                                Oferta Limitada
                            </div>
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--precision-accent)] mb-6 group-hover:tracking-[0.3em] transition-all duration-300 font-mono">// Anual Pro</div>
                            <div className="text-5xl font-black text-white mb-2">R$ 39<span className="text-2xl">,99</span></div>
                            <div className="text-gray-500 text-sm mb-8 font-mono">Valor promocional (R$ 3,33/mês)</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Economia de 70%', 'Prioridade no Suporte', 'Módulo Financeiro', 'Sem anúncios', 'Mentoria em Grupo'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                                        <CheckCircle className="w-4 h-4 text-[var(--precision-accent)]" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 bg-[var(--precision-accent)] text-white font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-none">
                                Garantir Oferta
                            </button>
                        </motion.div>

                        {/* Enterprise / Vitalicio */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="p-8 border border-[var(--industrial-border)] hover:border-gray-500 transition-all flex flex-col bg-[#050505] duration-300"
                        >
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 font-mono">// Nível Enterprise</div>
                            <div className="text-4xl font-black text-white mb-2">R$ 249</div>
                            <div className="text-gray-500 text-sm mb-8">Pagamento único (Vitalício)</div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Acesso para sempre', 'Mentorias Individuais', 'Selo Fundador', 'Funcionalidades Alpha'].map(i => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="w-1 h-1 bg-gray-500" /> {i}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onLogin} className="w-full py-4 border border-gray-700 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-colors rounded-none">
                                Comprar Vitalício
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--industrial-border)] py-12 bg-[#050505] text-center">
                <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-black tracking-[0.2em] uppercase">Control Frete Systems</span>
                </div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                    © {new Date().getFullYear()} Todos os direitos reservados.
                </p>
            </footer>

        </div>
    );
};
