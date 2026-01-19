import React from 'react';
import { Hero } from '../components/Hero.tsx';
import { ServiceCard } from '../components/ServiceCard.tsx';
import { Truck, Package, Clock, ShieldCheck, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const services = [
    {
      title: 'Transporte Rodoviário',
      description: 'Cobertura nacional com frota diversificada. Sua carga monitorada de ponta a ponta.',
      icon: Truck
    },
    {
      title: 'Cargas Fracionadas',
      description: 'Economia inteligente para volumes menores, compartilhando espaço com segurança.',
      icon: Package
    },
    {
      title: 'Cargas Dedicadas',
      description: 'Exclusividade e rapidez. O veículo vai direto da coleta ao destino, sem paradas.',
      icon: ShieldCheck
    },
    {
      title: 'Logística & Distribuição',
      description: 'Armazenagem estratégica e gestão de estoque para otimizar sua operação.',
      icon: Map
    }
  ];

  const features = [
    { icon: Clock, title: "Pontualidade", text: "Compromisso rigoroso com os prazos de coleta e entrega." },
    { icon: ShieldCheck, title: "Segurança Total", text: "Monitoramento 24h e seguro completo para todas as cargas." },
    { icon: Users, title: "Equipe Especializada", text: "Motoristas e equipe de apoio treinados e qualificados." },
    { icon: Truck, title: "Frota Moderna", text: "Veículos revisados e prontos para qualquer desafio." }
  ];

  return (
    <div className="bg-gray-50">
      <Hero />

      {/* Services Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-kiel-orange font-bold uppercase tracking-widest text-sm">Por que escolher a Kiel</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 uppercase italic">
              Nossos Diferenciais
            </h2>
            <div className="w-24 h-1 bg-kiel-orange mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-kiel-orange/20 group-hover:border-kiel-orange group-hover:bg-kiel-orange/10 transition-all">
                  <feature.icon className="text-gray-700 group-hover:text-kiel-orange transition-colors" size={36} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-kiel-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-800 transform skew-x-12 translate-x-12 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-4">
              Pronto para otimizar sua logística?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl">
              Entre em contato conosco hoje mesmo e descubra como podemos ajudar sua empresa a ir mais longe.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-end">
            <Link
              to="/cotacao"
              className="bg-kiel-orange hover:bg-orange-600 text-white px-8 py-4 rounded-sm font-bold uppercase shadow-lg transition-transform hover:scale-105"
            >
              Fazer Orçamento
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 uppercase italic">O que dizem nossos clientes</h2>
            <div className="w-16 h-1 bg-kiel-orange mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 italic relative">
                <div className="text-kiel-orange text-4xl font-serif absolute top-4 left-4 opacity-30">"</div>
                <p className="text-gray-600 mb-6 relative z-10">
                  "A Kiel Transportes superou nossas expectativas. A carga chegou antes do prazo e o atendimento foi impecável do início ao fim."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">João Silva</h4>
                    <p className="text-xs text-gray-500 uppercase">Gerente de Logística</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};