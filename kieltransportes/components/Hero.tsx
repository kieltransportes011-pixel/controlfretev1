import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="relative bg-gray-900 h-[600px] sm:h-[800px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-3xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-kiel-orange/20 border border-kiel-orange/50 text-kiel-orange px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-kiel-orange animate-pulse"></span>
            Referência Nacional em Logística
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 leading-tight uppercase italic tracking-tight">
            Transporte <span className="text-kiel-orange">Rápido</span> <br />
            Segurança <span className="text-transparent bg-clip-text bg-gradient-to-r from-kiel-yellow to-orange-500">Total</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl border-l-4 border-kiel-orange pl-6">
            Conectamos seu negócio ao Brasil inteiro com uma frota moderna e tecnologia de ponta.
            Sua carga entregue no prazo, com a integridade que você exige.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/cotacao"
              className="bg-kiel-orange hover:bg-orange-600 text-white text-center px-8 py-4 rounded font-bold uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transform hover:-translate-y-1 flex items-center justify-center group"
            >
              Fazer Cotação Agora
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="https://wa.me/5511919904407?text=Ol%C3%A1%2C%20gostaria%20de%20uma%20cota%C3%A7%C3%A3o%20de%20frete."
              target="_blank"
              rel="noreferrer"
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white text-center px-8 py-4 rounded font-bold uppercase tracking-wide transition-all flex items-center justify-center hover:border-white/40"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Conversar no WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Visual strip */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-kiel-orange via-yellow-500 to-kiel-orange"></div>
    </div>
  );
};