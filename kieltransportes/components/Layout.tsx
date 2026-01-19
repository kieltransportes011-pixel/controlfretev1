import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin, Instagram, Facebook, Truck, MessageCircle } from 'lucide-react';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { label: 'Início', path: '/' },
  { label: 'Sobre', path: '/sobre' },
  { label: 'Serviços', path: '/servicos' },
  { label: 'Rastrear', path: '/rastreamento' },
  { label: 'Cotação', path: '/cotacao' },
  { label: 'Contato', path: '/contato' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Top Bar */}
      <div className="bg-kiel-dark text-gray-300 text-xs sm:text-sm py-2 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center hover:text-kiel-orange transition-colors cursor-pointer">
              <Phone size={14} className="mr-2" /> (11) 91990-4407
            </span>
            <span className="hidden sm:flex items-center hover:text-kiel-orange transition-colors cursor-pointer">
              <Mail size={14} className="mr-2" /> contato@kieltransportes.com.br
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-kiel-yellow font-medium">Siga-nos:</span>
            <a href="#" className="hover:text-kiel-orange transition-colors"><Instagram size={16} /></a>
            <a href="#" className="hover:text-kiel-orange transition-colors"><Facebook size={16} /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-kiel-dark shadow-lg sticky top-0 z-50 border-b-4 border-kiel-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Placeholder / Text */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-kiel-orange blur-md opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                  <Truck className="h-10 w-10 text-white relative z-10 transform -skew-x-12" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none" style={{ textShadow: '2px 2px 0px #FF6B00' }}>
                    KIEL
                  </span>
                  <span className="text-xs font-bold tracking-widest text-kiel-yellow uppercase">Transportes</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-bold uppercase tracking-wide transition-colors duration-300 py-2 border-b-2 ${
                    location.pathname === item.path
                      ? 'text-kiel-orange border-kiel-orange'
                      : 'text-gray-300 border-transparent hover:text-white hover:border-kiel-yellow'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Button Desktop */}
            <div className="hidden md:flex">
              <Link 
                to="/cotacao"
                className="bg-kiel-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-sm font-bold uppercase text-sm shadow-md transition-all hover:scale-105 transform -skew-x-12 border-l-4 border-kiel-yellow"
              >
                <span className="skew-x-12 inline-block">Cotação Online</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none p-2"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-3 rounded-md text-base font-bold uppercase ${
                    location.pathname === item.path
                      ? 'text-kiel-orange bg-gray-900'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link 
                to="/cotacao"
                className="block px-3 py-3 mt-4 text-center rounded-md text-base font-bold uppercase bg-kiel-orange text-white"
              >
                Solicitar Cotação
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/5511919904407"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center animate-bounce-slow"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle size={32} fill="white" className="text-green-500" />
      </a>

      {/* Footer */}
      <footer className="bg-kiel-dark text-white pt-16 pb-8 border-t-8 border-kiel-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Column 1: Brand */}
            <div>
               <div className="flex items-center gap-2 mb-6">
                <Truck className="h-8 w-8 text-kiel-orange" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black italic text-white uppercase leading-none">
                    KIEL
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Excelência em transporte rodoviário de cargas. Segurança, rapidez e compromisso com o seu negócio em cada quilômetro rodado.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-kiel-orange transition-colors"><Instagram size={20} /></a>
                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-kiel-orange transition-colors"><Facebook size={20} /></a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-kiel-yellow font-bold uppercase tracking-wider mb-6 text-lg">Menu Rápido</h3>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-gray-400 hover:text-kiel-orange transition-colors text-sm flex items-center">
                      <span className="w-1.5 h-1.5 bg-kiel-orange rounded-full mr-2"></span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h3 className="text-kiel-yellow font-bold uppercase tracking-wider mb-6 text-lg">Serviços</h3>
              <ul className="space-y-3">
                {['Carga Fracionada', 'Carga Lotação', 'Logística Reversa', 'Entregas Expressas', 'Distribuição Urbana'].map((service) => (
                  <li key={service} className="text-gray-400 text-sm flex items-center">
                     <span className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2"></span>
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h3 className="text-kiel-yellow font-bold uppercase tracking-wider mb-6 text-lg">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="text-kiel-orange mr-3 mt-1 flex-shrink-0" size={18} />
                  <span className="text-gray-400 text-sm">Rua Exemplo de Logística, 123<br />São Paulo - SP, 00000-000</span>
                </li>
                <li className="flex items-center">
                  <Phone className="text-kiel-orange mr-3 flex-shrink-0" size={18} />
                  <span className="text-gray-400 text-sm">(11) 91990-4407</span>
                </li>
                <li className="flex items-center">
                  <Mail className="text-kiel-orange mr-3 flex-shrink-0" size={18} />
                  <span className="text-gray-400 text-sm">contato@kieltransportes.com.br</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center md:flex md:justify-between md:items-center">
            <p className="text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} Kiel Transportes. Todos os direitos reservados.
            </p>
            <p className="text-gray-600 text-xs mt-2 md:mt-0">
              Desenvolvido para alta performance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};