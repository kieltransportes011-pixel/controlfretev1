import React from 'react';
import { Target, Eye, Heart } from 'lucide-react';

export const About = () => {
  return (
    <div className="bg-white">
      {/* Page Header */}
      <div className="bg-kiel-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black text-white uppercase italic">Sobre a Empresa</h1>
          <p className="text-kiel-yellow mt-2 font-medium">Conheça a história e os valores da Kiel Transportes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 uppercase">Nossa História</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A Kiel Transportes nasceu com o propósito de revolucionar o transporte de cargas, unindo tecnologia, segurança e um atendimento humanizado. Desde a nossa fundação, temos percorrido milhares de quilômetros conectando empresas e impulsionando negócios através de soluções logísticas inteligentes.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Com uma frota moderna e uma equipe altamente capacitada, crescemos sustentados pelos pilares da confiança e da eficiência. Entendemos que cada carga carrega o esforço e o sonho de nossos clientes, por isso tratamos cada entrega com máxima prioridade.
            </p>
            <div className="mt-8 p-6 bg-gray-50 border-l-4 border-kiel-orange">
              <p className="text-gray-800 font-bold italic">
                "Nosso compromisso não é apenas transportar mercadorias, é entregar valor e tranquilidade para nossos parceiros."
              </p>
            </div>
          </div>
          <div className="relative">
             <div className="absolute -inset-4 bg-kiel-orange/20 rounded-lg transform rotate-3"></div>
             <img 
               src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
               alt="Equipe Kiel Transportes" 
               className="rounded-lg shadow-xl relative z-10 w-full object-cover h-[400px]"
             />
          </div>
        </div>

        {/* Mission Vision Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="bg-gray-50 p-8 rounded-lg text-center hover:shadow-lg transition-shadow border-t-4 border-kiel-orange">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-kiel-orange">
              <Target size={32} />
            </div>
            <h3 className="text-xl font-bold uppercase mb-3 text-gray-900">Missão</h3>
            <p className="text-gray-600 text-sm">
              Prover soluções logísticas de excelência, garantindo a satisfação dos clientes através de serviços seguros, ágeis e inovadores.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-lg text-center hover:shadow-lg transition-shadow border-t-4 border-kiel-yellow">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-kiel-yellow">
              <Eye size={32} />
            </div>
            <h3 className="text-xl font-bold uppercase mb-3 text-gray-900">Visão</h3>
            <p className="text-gray-600 text-sm">
              Ser reconhecida nacionalmente como referência em qualidade e confiabilidade no setor de transporte rodoviário de cargas.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-lg text-center hover:shadow-lg transition-shadow border-t-4 border-black">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-black">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-bold uppercase mb-3 text-gray-900">Valores</h3>
            <p className="text-gray-600 text-sm">
              Ética, transparência, segurança, comprometimento com o cliente e valorização dos nossos colaboradores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};