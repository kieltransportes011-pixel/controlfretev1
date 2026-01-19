import React from 'react';
import { Truck, Box, Zap, MapPin } from 'lucide-react';

export const Services = () => {
  const serviceList = [
    {
      icon: Truck,
      title: "Carga Lotação (Fechada)",
      desc: "Veículo exclusivo para sua carga, garantindo que sua mercadoria viaje sozinha do ponto de coleta ao destino final. Ideal para grandes volumes, cargas sensíveis ou quando o prazo é prioridade absoluta. Oferecemos rastreamento dedicado e seguro total.",
      bg: "bg-gray-900",
      text: "text-white"
    },
    {
      icon: Box,
      title: "Carga Fracionada",
      desc: "Solução econômica onde sua carga compartilha espaço com outras mercadorias compatíveis. Nossa malha logística inteligente permite prazos competitivos e custos reduzidos, sem abrir mão da segurança e do cuidado no manuseio.",
      bg: "bg-white",
      text: "text-gray-900"
    },
    {
      icon: Zap,
      title: "Entregas Expressas",
      desc: "Modalidade premium para urgências. Coleta e entrega realizadas no menor tempo possível, utilizando veículos dedicados e rotas expressas. Atendimento 24/7 para quando sua empresa não pode parar.",
      bg: "bg-gray-50",
      text: "text-gray-900"
    },
    {
      icon: MapPin,
      title: "Distribuição Urbana",
      desc: "Especialistas em Last Mile. Veículos adequados para restrições de circulação em centros urbanos (VUCs), garantindo que seu produto chegue às prateleiras ou ao consumidor final com agilidade e eficiência.",
      bg: "bg-white",
      text: "text-gray-900"
    }
  ];

  return (
    <div>
      <div className="bg-kiel-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black text-white uppercase italic">Nossos Serviços</h1>
          <p className="text-gray-400 mt-2">Soluções completas para sua necessidade logística</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {serviceList.map((service, idx) => (
            <div key={idx} className={`flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg border border-gray-100`}>
              <div className="md:w-1/3 h-64 md:h-auto relative bg-gray-200">
                <div className={`absolute inset-0 flex items-center justify-center ${service.bg === 'bg-gray-900' ? 'bg-kiel-orange' : 'bg-gray-100'}`}>
                  <service.icon size={80} className={`${service.bg === 'bg-gray-900' ? 'text-white' : 'text-kiel-orange'} opacity-90`} />
                </div>
              </div>
              <div className={`md:w-2/3 p-8 md:p-12 flex flex-col justify-center ${service.bg}`}>
                <h3 className={`text-2xl font-bold uppercase mb-4 ${service.text}`}>{service.title}</h3>
                <p className={`${service.text === 'text-white' ? 'text-gray-300' : 'text-gray-600'} text-lg leading-relaxed`}>
                  {service.desc}
                </p>
                <div className="mt-6">
                  <span className="inline-block px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-kiel-yellow text-kiel-dark">
                    Disponível
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};