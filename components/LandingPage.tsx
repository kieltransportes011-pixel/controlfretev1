import React, { useEffect, useRef, useState } from 'react';
import {
    motion,
    AnimatePresence,
    MotionConfig,
    animate,
    useInView,
    useScroll,
    useSpring,
    useTransform,
} from 'framer-motion';
import {
    Truck,
    ArrowRight,
    CheckCircle,
    Menu,
    X,
    Clock,
    DollarSign,
    Download,
    LayoutDashboard,
    Gift,
    ChevronDown,
    UserPlus,
    ClipboardList,
    TrendingUp,
    Wrench,
    Smartphone,
    Sparkles,
    Tag,
    XCircle,
} from 'lucide-react';
import { BLACK_FRIDAY_END } from '../utils/blackFriday';
import { FREE_MONTHLY_FREIGHTS, FREE_HISTORY_DAYS } from '../utils/freePlan';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.controlfrete.app&hl=pt_BR';

// ---- BLACK FRIDAY ----
// Tudo que é da Black Friday some sozinho quando chegar 01/12/2026 00:00 (horário de Brasília).
// A data fica em utils/blackFriday.ts. Depois dela, pode apagar este bloco e os trechos marcados com "Black Friday".

const useBlackFridayActive = () => {
    const [active, setActive] = useState(() => Date.now() < BLACK_FRIDAY_END);
    useEffect(() => {
        if (!active) return;
        const t = setInterval(() => setActive(Date.now() < BLACK_FRIDAY_END), 1000);
        return () => clearInterval(t);
    }, [active]);
    return active;
};

const pad = (n: number) => String(n).padStart(2, '0');

// Contagem regressiva até o fim da Black Friday
const Countdown = ({ className = '', boxed = false }: { className?: string; boxed?: boolean }) => {
    const [left, setLeft] = useState(() => Math.max(0, BLACK_FRIDAY_END - Date.now()));
    useEffect(() => {
        const t = setInterval(() => setLeft(Math.max(0, BLACK_FRIDAY_END - Date.now())), 1000);
        return () => clearInterval(t);
    }, []);
    const s = Math.floor(left / 1000);
    const parts = [
        { v: Math.floor(s / 86400), l: 'dias' },
        { v: Math.floor((s % 86400) / 3600), l: 'horas' },
        { v: Math.floor((s % 3600) / 60), l: 'min' },
        { v: s % 60, l: 'seg' },
    ];
    if (boxed) {
        return (
            <div className={`flex gap-2 sm:gap-3 ${className}`}>
                {parts.map((p) => (
                    <div key={p.l} className="w-16 sm:w-20 rounded-2xl bg-black/40 border border-amber-400/30 py-2.5 text-center">
                        <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{pad(p.v)}</div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-200/80">{p.l}</div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <span className={`tabular-nums ${className}`}>
            {parts[0].v}d {pad(parts[1].v)}:{pad(parts[2].v)}:{pad(parts[3].v)}
        </span>
    );
};

const BlackFridayBar = () => (
    <button
        onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
        className="relative w-full overflow-hidden bg-black border-b border-amber-400/30"
    >
        <motion.div
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(251,191,36,0.18)_50%,transparent_70%)]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        />
        <div className="relative max-w-7xl mx-auto px-3 h-10 flex items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-sm whitespace-nowrap">
            <span className="font-black tracking-wider bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">BLACK FRIDAY</span>
            <span className="text-white font-semibold">
                <span className="hidden sm:inline">Plano PRO pela </span>
                <span className="sm:hidden">PRO <span className="text-amber-300">50% OFF</span></span>
                <span className="hidden sm:inline text-amber-300">metade do preço</span>
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline text-slate-400">termina em</span>
            <Countdown className="font-bold text-white" />
        </div>
    </button>
);

interface LandingPageProps {
    onLogin: () => void;
}

// ---- DADOS ----

// Telas que giram no celular do topo
const heroScreens = [
    '/assets/landing/dashboard.jpg',
    '/assets/landing/finances.jpg',
    '/assets/landing/history.jpg',
    '/assets/landing/frota.jpg',
];

// Recursos mostrados na seção que acompanha a rolagem
const featuresData = [
    {
        tag: 'Painel',
        title: 'Tudo o que entrou e saiu, numa tela só',
        desc: 'Faturamento da semana, do mês e saldo líquido assim que você abre o app. Sem planilha, sem caderninho.',
        icon: LayoutDashboard,
        imageSrc: '/assets/landing/dashboard.jpg',
    },
    {
        tag: 'Contas',
        title: 'Nunca mais esqueça uma conta',
        desc: 'Veja o que tem a pagar e a receber, o que está vencido, e marque como pago com um toque.',
        icon: DollarSign,
        imageSrc: '/assets/landing/finances.jpg',
    },
    {
        tag: 'Histórico',
        title: 'O lucro real de cada frete',
        desc: 'Cada viagem com a parte da empresa, do motorista e da reserva. Gere o relatório em PDF quando precisar.',
        icon: Clock,
        imageSrc: '/assets/landing/history.jpg',
    },
    {
        tag: 'Frota',
        title: 'Seus caminhões sob controle',
        desc: 'KM atualizado sozinho, alerta de revisão, checklist de inspeção, documentos e lucro por caminhão.',
        icon: Truck,
        imageSrc: '/assets/landing/frota.jpg',
    },
    {
        tag: 'Indique e Ganhe',
        title: 'Indique e ganhe comissão',
        desc: 'Compartilhe seu link com outros caminhoneiros e receba a cada assinatura PRO feita por ele.',
        icon: Gift,
        imageSrc: '/assets/landing/indique.jpg',
    },
];

const brands = ['scania', 'volvo', 'mercedes-benz', 'volkswagen', 'daf', 'iveco', 'man', 'ford', 'renault', 'fiat', 'hyundai', 'kia'];

const steps = [
    { icon: UserPlus, title: 'Crie sua conta grátis', desc: 'Leva menos de um minuto. Não precisa de cartão.' },
    { icon: ClipboardList, title: 'Lance fretes e despesas', desc: 'Origem, destino, valor e gastos. A calculadora acha a distância sozinha.' },
    { icon: TrendingUp, title: 'Veja quanto sobrou', desc: 'O app separa o que é da empresa, do motorista e da reserva, e mostra seu lucro.' },
];

// Lista curta de novidades — atualizar aqui a cada versão nova do app.
// Mais recente primeiro.
const novidadesData = [
    {
        date: 'Nov 2026',
        title: 'Gestão de Frota completa',
        desc: 'Alertas automáticos de revisão, histórico por veículo, KM atualizado sozinho e painel de lucro por caminhão.',
    },
    {
        date: 'Nov 2026',
        title: 'Calculadora com endereço automático',
        desc: 'Digite o endereço de coleta e destino — o app sugere e já calcula a distância sozinho.',
    },
    {
        date: 'Out 2026',
        title: 'Control Frete chegou à Play Store',
        desc: 'App oficial disponível pra instalação, com atualizações automáticas a partir de agora.',
    },
];

const faqData = [
    {
        q: 'O Control Frete é gratuito?',
        a: `Sim. O plano gratuito é para sempre e não pede cartão, mas é básico: até ${FREE_MONTHLY_FREIGHTS} fretes por mês e histórico dos últimos ${FREE_HISTORY_DAYS} dias. Para fretes ilimitados, histórico completo, Gestão de Frota, Agenda, Metas e recibos em PDF, assine o PRO. Toda conta nova ganha 7 dias de PRO grátis para testar.`,
    },
    {
        q: 'Funciona no iPhone?',
        a: 'Sim. No Android você baixa pela Play Store. No iPhone ou no computador, é só acessar pelo navegador e entrar com a mesma conta.',
    },
    {
        q: 'Se eu trocar de celular, perco meus dados?',
        a: 'Não. Tudo fica salvo na sua conta. Entrou com seu e-mail em outro aparelho, está tudo lá.',
    },
    {
        q: 'Serve para quem tem mais de um caminhão?',
        a: 'Serve. Na Gestão de Frota você cadastra os veículos e os motoristas e acompanha KM, revisões, documentos e lucro de cada caminhão.',
    },
];

// ---- UTILITÁRIOS ----

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
} as const;

// Número que sobe quando aparece na tela
const CountUp = ({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const controls = animate(0, to, { duration: 1.8, ease: 'easeOut', onUpdate: setVal });
        return () => controls.stop();
    }, [inView, to]);

    return (
        <span ref={ref}>
            {prefix}
            {val.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
            {suffix}
        </span>
    );
};

const PhoneMockup = ({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) => (
    <div className={`relative w-[250px] sm:w-[290px] rounded-[2.6rem] bg-[#0b0f19] p-[10px] shadow-2xl ring-1 ring-white/10 ${className}`}>
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0b0f19] rounded-full z-20" />
        <div className="relative overflow-hidden rounded-[2rem] bg-white aspect-[788/1600]">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                    key={src}
                    src={src}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 pointer-events-none" />
        </div>
    </div>
);

const PlayStoreButton = ({ className = '' }: { className?: string }) => (
    <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group inline-flex items-center justify-center gap-3 rounded-2xl bg-white text-[#05070d] px-6 py-4 font-bold shadow-lg shadow-white/10 hover:-translate-y-0.5 hover:shadow-white/20 transition-all ${className}`}
    >
        <Download className="w-5 h-5 group-hover:animate-bounce" strokeWidth={2.5} />
        <span className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Disponível na</span>
            <span className="text-base">Google Play</span>
        </span>
    </a>
);

// Estrada com faixas andando e caminhão
const Road = () => (
    <div className="relative h-16 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-white/[0.03] border-y border-white/5" />
        <motion.div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 40px, transparent 40px 80px)', backgroundSize: '80px 3px' }}
            animate={{ backgroundPositionX: ['0px', '-80px'] }}
            transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
        />
        <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: '-10%' }}
            animate={{ left: '110%' }}
            transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
        >
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} className="flex items-center gap-1">
                <div className="w-10 h-[2px] bg-gradient-to-r from-transparent to-blue-400/60 rounded-full" />
                <div className="bg-blue-500 rounded-lg p-1.5 shadow-[0_0_20px_rgba(59,130,246,0.8)]">
                    <Truck className="w-5 h-5 text-white" />
                </div>
            </motion.div>
        </motion.div>
    </div>
);

// ---- SEÇÕES ----

const navLinks = [
    { id: 'recursos', label: 'Recursos' },
    { id: 'como-funciona', label: 'Como funciona' },
    { id: 'planos', label: 'Planos' },
    { id: 'duvidas', label: 'Dúvidas' },
];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const Navbar = ({ onLogin, blackFriday }: { onLogin: () => void; blackFriday: boolean }) => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const go = (id: string) => {
        setOpen(false);
        scrollTo(id);
    };

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled || open ? 'bg-[#05070d]/85 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
            {blackFriday && <BlackFridayBar />}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
                    <img src="/logo-official.png" alt="Control Frete" className="w-10 h-10 object-contain" />
                    <span className="text-white font-extrabold tracking-tight text-lg">
                        Control <span className="text-blue-400">Frete</span>
                    </span>
                </button>

                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((l) => (
                        <button key={l.id} onClick={() => go(l.id)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            {l.label}
                        </button>
                    ))}
                    <button
                        onClick={onLogin}
                        className="rounded-full bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/30 transition-colors"
                    >
                        Entrar
                    </button>
                </div>

                <button className="md:hidden text-white p-2 -mr-2" onClick={() => setOpen(!open)} aria-label="Menu">
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden"
                    >
                        <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
                            {navLinks.map((l) => (
                                <button key={l.id} onClick={() => go(l.id)} className="text-left py-3 text-slate-300 font-medium border-b border-white/5">
                                    {l.label}
                                </button>
                            ))}
                            <button onClick={onLogin} className="mt-4 w-full rounded-2xl bg-blue-600 text-white py-4 font-bold">
                                Entrar no app
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

const Hero = ({ onLogin, blackFriday }: { onLogin: () => void; blackFriday: boolean }) => {
    const [screen, setScreen] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setScreen((s) => (s + 1) % heroScreens.length), 3200);
        return () => clearInterval(t);
    }, []);

    return (
        <section className={`relative overflow-hidden ${blackFriday ? 'pt-36 sm:pt-44' : 'pt-28 sm:pt-36'}`}>
            {/* Fundo animado */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <motion.div
                    className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-600/25 blur-[120px]"
                    animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
                    transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-20 -right-40 w-[480px] h-[480px] rounded-full bg-emerald-500/15 blur-[120px]"
                    animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
                    transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000_40%,transparent_100%)]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-8 items-center">
                <div className="text-center lg:text-left">
                    {blackFriday ? (
                        <motion.button
                            onClick={() => scrollTo('planos')}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0, scale: [1, 1.04, 1] }}
                            transition={{ opacity: { delay: 0.1 }, y: { delay: 0.1 }, scale: { repeat: Infinity, duration: 2.2, delay: 1 } }}
                            className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-4 py-1.5 mb-7 shadow-[0_0_30px_-8px_rgba(251,191,36,0.6)]"
                        >
                            <Tag className="w-4 h-4 text-amber-300" />
                            <span className="text-xs sm:text-sm font-bold text-amber-100">Black Friday: PRO com 50% off até 30/11</span>
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-7"
                        >
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs sm:text-sm font-semibold text-blue-200">Novo: Gestão de Frota completa</span>
                        </motion.div>
                    )}

                    <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl xl:text-7xl font-extrabold text-white tracking-tight mb-6">
                        {['Saiba quanto', 'sobra de cada'].map((line, i) => (
                            <motion.span
                                key={line}
                                className="block"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {line}
                            </motion.span>
                        ))}
                        <motion.span
                            className="block bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent bg-[length:200%_auto]"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                            transition={{
                                opacity: { duration: 0.8, delay: 0.39 },
                                y: { duration: 0.8, delay: 0.39, ease: [0.16, 1, 0.3, 1] },
                                backgroundPosition: { repeat: Infinity, duration: 6, ease: 'linear' },
                            }}
                        >
                            frete.
                        </motion.span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed mb-9"
                    >
                        O app de controle financeiro feito para caminhoneiros e transportadoras. Fretes, despesas, contas e frota na palma da mão.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                    >
                        <button
                            onClick={onLogin}
                            className="group relative overflow-hidden rounded-2xl bg-blue-600 px-7 py-4 text-white font-bold text-base shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-colors"
                        >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700" />
                            <span className="relative flex items-center justify-center gap-3">
                                Começar grátis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        <PlayStoreButton />
                    </motion.div>

                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.95 }}
                        className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-slate-400"
                    >
                        {['Sem cartão de crédito', '7 dias de PRO grátis', 'Android, iPhone e PC'].map((t) => (
                            <li key={t} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" /> {t}
                            </li>
                        ))}
                    </motion.ul>
                </div>

                {/* Celular com telas girando + cartões flutuantes */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotate: 4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex justify-center pb-6"
                >
                    <div className="absolute inset-0 m-auto w-72 h-72 rounded-full bg-blue-500/30 blur-[90px]" />
                    <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                        <PhoneMockup src={heroScreens[screen]} alt="Telas do app Control Frete" priority className="shadow-[0_40px_120px_-30px_rgba(59,130,246,0.7)]" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                        transition={{ opacity: { delay: 1.1 }, x: { delay: 1.1, type: 'spring' }, y: { repeat: Infinity, duration: 5, delay: 1.5 } }}
                        className="absolute left-0 sm:left-4 lg:-left-6 top-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-3.5 sm:p-4 shadow-2xl"
                    >
                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium mb-1">Faturamento do mês</div>
                        <div className="text-lg sm:text-2xl font-extrabold text-white tabular-nums">
                            <CountUp to={10680} prefix="R$ " decimals={2} />
                        </div>
                        <div className="mt-1 text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> lucro no azul
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
                        transition={{ opacity: { delay: 1.35 }, x: { delay: 1.35, type: 'spring' }, y: { repeat: Infinity, duration: 6, delay: 1.8 } }}
                        className="absolute right-0 sm:right-4 lg:-right-4 bottom-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-3.5 sm:p-4 shadow-2xl w-36 sm:w-44"
                    >
                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium mb-2">Meta mensal</div>
                        <div className="text-lg sm:text-2xl font-extrabold text-white mb-2 tabular-nums">
                            <CountUp to={43} suffix="%" />
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: '43%' }}
                                transition={{ delay: 1.6, duration: 1.6, ease: 'easeOut' }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            <div className="relative mt-10 sm:mt-16">
                <Road />
            </div>
        </section>
    );
};

const BrandsMarquee = () => (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <p className="text-center text-sm text-slate-500 font-medium mb-6 px-4">Cadastre caminhões e utilitários de todas as marcas</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
            <motion.div
                className="flex gap-4 w-max"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 35, ease: 'linear' }}
            >
                {[...brands, ...brands].map((b, i) => (
                    <div key={`${b}-${i}`} className="flex items-center justify-center w-32 h-16 rounded-xl bg-white/90 px-4">
                        <img src={`/assets/brand-icons/${b}.webp`} alt={b} loading="lazy" className="max-h-9 max-w-full object-contain" />
                    </div>
                ))}
            </motion.div>
        </div>
    </section>
);

const Highlights = () => (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
            { value: 'R$ 0', label: 'para começar a usar' },
            { value: <CountUp to={7} suffix=" dias" />, label: 'de PRO grátis para testar' },
            { value: 'Ilimitados', label: 'fretes no PRO, com histórico completo' },
            { value: 'Celular e PC', label: 'a mesma conta em qualquer aparelho' },
        ].map((s, i) => (
            <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5 sm:p-7 hover:border-blue-500/40 hover:-translate-y-1 transition-all"
            >
                <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 tabular-nums">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 leading-snug">{s.label}</div>
            </motion.div>
        ))}
    </section>
);

// Bloco de texto que avisa quando está no meio da tela
const FeatureStep = ({ index, onActive, children }: { index: number; onActive: (i: number) => void; children: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
    useEffect(() => {
        if (inView) onActive(index);
    }, [inView, index, onActive]);
    return <div ref={ref}>{children}</div>;
};

const Features = () => {
    const [active, setActive] = useState(0);

    return (
        <section id="recursos" className="relative py-20 sm:py-28 px-4 sm:px-6 scroll-mt-28">
            <div className="max-w-7xl mx-auto">
                <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14 lg:mb-6">
                    <span className="inline-block text-sm font-bold text-blue-400 mb-3">Recursos</span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Feito para a vida na estrada</h2>
                    <p className="text-slate-400 text-lg">Tudo o que você precisa para parar de perder dinheiro sem perceber.</p>
                </motion.div>

                {/* Computador: celular fixo e tela muda conforme a rolagem */}
                <div className="hidden lg:grid grid-cols-2 gap-16">
                    <div>
                        {featuresData.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <FeatureStep key={f.tag} index={i} onActive={setActive}>
                                    <div className="min-h-[70vh] flex items-center">
                                        <motion.div
                                            animate={{ opacity: active === i ? 1 : 0.3, x: active === i ? 0 : -10 }}
                                            transition={{ duration: 0.4 }}
                                            className="max-w-md"
                                        >
                                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 mb-5">
                                                <Icon className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm font-semibold text-blue-200">{f.tag}</span>
                                            </div>
                                            <h3 className="text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">{f.title}</h3>
                                            <p className="text-lg text-slate-400 leading-relaxed">{f.desc}</p>
                                        </motion.div>
                                    </div>
                                </FeatureStep>
                            );
                        })}
                    </div>
                    <div className="relative">
                        <div className="sticky top-0 h-screen flex items-center justify-center">
                            <div className="absolute w-80 h-80 rounded-full bg-blue-500/25 blur-[100px]" />
                            <div className="relative">
                                <PhoneMockup src={featuresData[active].imageSrc} alt={featuresData[active].title} className="shadow-[0_40px_120px_-30px_rgba(59,130,246,0.7)]" />
                                <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
                                    {featuresData.map((f, i) => (
                                        <div key={f.tag} className={`w-2 rounded-full transition-all duration-300 ${active === i ? 'h-8 bg-blue-400' : 'h-2 bg-white/20'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Celular: um cartão por recurso */}
                <div className="lg:hidden flex flex-col gap-16">
                    {featuresData.map((f) => {
                        const Icon = f.icon;
                        return (
                            <motion.div key={f.tag} {...fadeUp} className="text-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 mb-4">
                                    <Icon className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-200">{f.tag}</span>
                                </div>
                                <h3 className="text-2xl font-extrabold text-white tracking-tight mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed mb-8 max-w-md mx-auto">{f.desc}</p>
                                <div className="relative flex justify-center">
                                    <div className="absolute inset-0 m-auto w-56 h-56 rounded-full bg-blue-500/25 blur-[80px]" />
                                    <PhoneMockup src={f.imageSrc} alt={f.title} className="w-[230px] sm:w-[260px]" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const HowItWorks = () => (
    <section id="como-funciona" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/5 scroll-mt-28">
        <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
                <span className="inline-block text-sm font-bold text-blue-400 mb-3">Como funciona</span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Em 3 passos você já está no controle</h2>
            </motion.div>

            <div className="relative grid md:grid-cols-3 gap-10 md:gap-6">
                <motion.div
                    className="hidden md:block absolute top-10 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                />
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 + i * 0.3 }} className="relative text-center px-4">
                            <motion.div
                                whileHover={{ rotate: -6, scale: 1.08 }}
                                className="relative mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-600/30"
                            >
                                <Icon className="w-9 h-9 text-white" />
                                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-[#05070d] text-sm font-extrabold flex items-center justify-center">{i + 1}</span>
                            </motion.div>
                            <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{s.desc}</p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    </section>
);

const Novidades = () => (
    <section id="novidades" className="py-20 sm:py-24 px-4 sm:px-6 border-t border-white/5 scroll-mt-28">
        <div className="max-w-5xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-5">
                    <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-sm font-semibold text-emerald-200">Sempre melhorando</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Novidades</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
                {novidadesData.map((n, i) => (
                    <motion.div
                        key={n.title}
                        {...fadeUp}
                        transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                        whileHover={{ y: -6 }}
                        className="rounded-3xl p-6 border border-white/10 bg-white/[0.03] hover:border-blue-500/40 hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="text-xs font-bold text-blue-400 mb-3">{n.date}</div>
                        <h3 className="text-white font-bold text-lg mb-2">{n.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{n.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const PlanList = ({ items, excluded = [], highlight = false }: { items: string[]; excluded?: string[]; highlight?: boolean }) => (
    <ul className="space-y-3.5 mb-8 flex-1">
        {items.map((i) => (
            <li key={i} className={`flex items-start gap-3 text-sm ${highlight ? 'text-white' : 'text-slate-300'}`}>
                <CheckCircle className={`w-5 h-5 shrink-0 ${highlight ? 'text-emerald-400' : 'text-slate-500'}`} /> {i}
            </li>
        ))}
        {excluded.map((i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
                <XCircle className="w-5 h-5 shrink-0 text-red-500/60" /> <span className="line-through decoration-red-500/50">{i}</span>
            </li>
        ))}
    </ul>
);

// Preço antigo riscado + preço novo (Black Friday)
const Price = ({ reais, cents, oldPrice, big = false }: { reais: string; cents: string; oldPrice?: string; big?: boolean }) => (
    <div className="mb-1">
        {oldPrice && <div className="text-sm text-slate-500 line-through mb-0.5">de R$ {oldPrice}</div>}
        <div className={`${big ? 'text-5xl' : 'text-4xl'} font-extrabold text-white`}>
            {oldPrice && <span className="text-base font-bold text-amber-300 mr-1 align-middle">por</span>}
            R$ {reais}
            <span className={big ? 'text-2xl' : 'text-xl'}>,{cents}</span>
        </div>
    </div>
);

const Plans = ({ onLogin, blackFriday }: { onLogin: () => void; blackFriday: boolean }) => (
    <section id="planos" className="relative py-20 sm:py-28 px-4 sm:px-6 border-t border-white/5 scroll-mt-28 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
                {blackFriday ? (
                    <>
                        <span className="inline-block text-sm font-black tracking-wider bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent mb-3">BLACK FRIDAY</span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                            Plano PRO pela <span className="text-amber-300">metade do preço</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-7">Só até 30 de novembro. Depois, o preço volta ao normal.</p>
                        <Countdown boxed className="justify-center" />
                    </>
                ) : (
                    <>
                        <span className="inline-block text-sm font-bold text-blue-400 mb-3">Planos</span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Comece grátis. Cresça com o PRO.</h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">Escolha o plano certo para a sua operação.</p>
                    </>
                )}
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
                <motion.div {...fadeUp} className="rounded-3xl p-7 border border-white/10 bg-[#0a0e18] flex flex-col hover:border-white/25 transition-colors">
                    <div className="text-sm font-bold text-slate-400 mb-4">Gratuito</div>
                    <div className="text-4xl font-extrabold text-white mb-1">R$ 0</div>
                    <div className="text-slate-500 text-sm mb-7">Para sempre, sem cartão</div>
                    <PlanList
                        items={[`Até ${FREE_MONTHLY_FREIGHTS} fretes por mês`, `Histórico dos últimos ${FREE_HISTORY_DAYS} dias`, 'Calculadora com endereço automático', 'Controle de despesas e clientes', '7 dias de teste PRO grátis']}
                        excluded={['Fretes ilimitados', 'Histórico completo', 'Gestão de Frota e Manutenção', 'Agenda e Metas', 'Recibos e relatórios em PDF']}
                    />
                    <button onClick={onLogin} className="w-full rounded-2xl py-4 border border-white/15 text-white font-bold hover:bg-white hover:text-[#05070d] transition-colors">
                        Começar grátis
                    </button>
                </motion.div>

                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="rounded-3xl p-7 border border-white/10 bg-[#0a0e18] flex flex-col hover:border-white/25 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-bold text-slate-400">Mensal</div>
                        {blackFriday && <div className="rounded-full bg-amber-400 text-black text-xs font-black px-2.5 py-0.5">-50%</div>}
                    </div>
                    {blackFriday ? <Price reais="4" cents="95" oldPrice="9,90" /> : <Price reais="9" cents="90" />}
                    <div className="text-slate-500 text-sm mb-7">Cobrado mensalmente</div>
                    <PlanList items={['Fretes ilimitados e histórico completo', 'Gestão de Frota completa', 'Alertas de revisão e lucro por caminhão', 'Agenda e Metas', 'Suporte dedicado']} />
                    <button onClick={onLogin} className="w-full rounded-2xl py-4 border border-white/15 text-white font-bold hover:bg-white hover:text-[#05070d] transition-colors">
                        {blackFriday ? 'Assinar com 50% off' : 'Assinar mensal'}
                    </button>
                </motion.div>

                {/* Anual com borda animada */}
                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="relative rounded-3xl p-[2px] md:-translate-y-4 overflow-hidden group">
                    <motion.div
                        className={`absolute -inset-[100%] ${blackFriday ? 'bg-[conic-gradient(from_0deg,#fbbf24,#3b82f6,#facc15,#fbbf24)]' : 'bg-[conic-gradient(from_0deg,#3b82f6,#34d399,#38bdf8,#3b82f6)]'}`}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                    />
                    <div className="relative h-full rounded-[22px] p-7 bg-[#0a0e18] flex flex-col">
                        {blackFriday ? (
                            <div className="absolute top-5 right-5 rounded-full bg-amber-400 text-black text-xs font-black px-3 py-1">-50% Black Friday</div>
                        ) : (
                            <div className="absolute top-5 right-5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-bold px-3 py-1">Mais popular</div>
                        )}
                        <div className="text-sm font-bold text-blue-400 mb-4">Anual PRO</div>
                        {blackFriday ? <Price big reais="24" cents="99" oldPrice="49,99" /> : <Price big reais="49" cents="99" />}
                        <div className="text-emerald-400 text-sm font-semibold mb-7">Equivale a R$ {blackFriday ? '2,08' : '4,17'}/mês</div>
                        <PlanList highlight items={['Economia de mais de 50% vs. mensal', 'Fretes ilimitados e histórico completo', 'Gestão de Frota completa', 'Alertas de revisão e lucro por caminhão', 'Agenda, Metas e Suporte dedicado']} />
                        <button
                            onClick={onLogin}
                            className="relative overflow-hidden w-full rounded-2xl py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-colors"
                        >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700" />
                            <span className="relative">{blackFriday ? 'Garantir 50% off' : 'Garantir oferta'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

const Faq = () => {
    const [open, setOpen] = useState<number | null>(0);
    return (
        <section id="duvidas" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/5 scroll-mt-28">
            <div className="max-w-3xl mx-auto">
                <motion.div {...fadeUp} className="text-center mb-12">
                    <span className="inline-block text-sm font-bold text-blue-400 mb-3">Dúvidas</span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Perguntas frequentes</h2>
                </motion.div>
                <div className="flex flex-col gap-3">
                    {faqData.map((f, i) => {
                        const isOpen = open === i;
                        return (
                            <motion.div key={f.q} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }} className={`rounded-2xl border transition-colors ${isOpen ? 'border-blue-500/40 bg-blue-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
                                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 text-left p-5 sm:p-6">
                                    <span className="font-bold text-white sm:text-lg">{f.q}</span>
                                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0">
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <p className="px-5 sm:px-6 pb-6 text-slate-400 leading-relaxed">{f.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const FinalCta = ({ onLogin, blackFriday }: { onLogin: () => void; blackFriday: boolean }) => (
    <section className="px-4 sm:px-6 pb-24">
        <motion.div
            {...fadeUp}
            className="relative max-w-5xl mx-auto overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-14 sm:p-16 text-center"
        >
            <motion.div
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 8 }}
            />
            <motion.div
                className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-400/20 blur-2xl"
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ repeat: Infinity, duration: 8 }}
            />
            <div className="relative">
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Pare de rodar no escuro.</h2>
                <p className="text-blue-100 text-lg max-w-xl mx-auto mb-9">
                    {blackFriday
                        ? 'Crie sua conta grátis hoje e aproveite o PRO pela metade do preço até 30 de novembro.'
                        : 'Crie sua conta grátis hoje e descubra quanto cada frete realmente coloca no seu bolso.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={onLogin} className="group rounded-2xl bg-white text-blue-700 px-8 py-4 font-bold text-base hover:-translate-y-0.5 shadow-xl transition-transform">
                        <span className="flex items-center justify-center gap-3">
                            Começar grátis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl border border-white/30 text-white px-8 py-4 font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
                    >
                        <Smartphone className="w-5 h-5" /> Baixar o app
                    </a>
                </div>
            </div>
        </motion.div>
    </section>
);

// Barra fixa da Play Store no celular (aparece depois do topo)
const MobileStickyCta = () => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#05070d]/90 backdrop-blur-xl border-t border-white/10"
                >
                    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full rounded-2xl bg-blue-600 text-white py-3.5 font-bold">
                        <Download className="w-5 h-5" /> Baixar grátis na Play Store
                    </a>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
    const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);
    return <motion.div style={{ scaleX, opacity }} className="fixed top-0 inset-x-0 h-[3px] z-[60] origin-left bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const blackFriday = useBlackFridayActive();
    return (
        <MotionConfig reducedMotion="user">
            <div className="bg-[#05070d] min-h-screen text-slate-300 font-sans antialiased overflow-x-clip selection:bg-blue-600 selection:text-white">
                <ScrollProgress />
                <Navbar onLogin={onLogin} blackFriday={blackFriday} />
                <Hero onLogin={onLogin} blackFriday={blackFriday} />
                <BrandsMarquee />
                <Highlights />
                <Features />
                <HowItWorks />
                <Novidades />
                <Plans onLogin={onLogin} blackFriday={blackFriday} />
                <Faq />
                <FinalCta onLogin={onLogin} blackFriday={blackFriday} />

                <footer className="border-t border-white/5 py-10 px-4 text-center pb-28 md:pb-10">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <img src="/logo-official.png" alt="" className="w-7 h-7 object-contain" />
                        <span className="font-extrabold text-white">
                            Control <span className="text-blue-400">Frete</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-4">
                        <a href="/privacy" className="hover:text-white transition-colors">Privacidade</a>
                        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Play Store</a>
                    </div>
                    <p className="text-xs text-slate-600">© {new Date().getFullYear()} Control Frete. Todos os direitos reservados.</p>
                </footer>

                <MobileStickyCta />
            </div>
        </MotionConfig>
    );
};
