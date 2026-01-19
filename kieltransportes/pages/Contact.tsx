import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="bg-white">
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black text-gray-900 uppercase italic">Fale Conosco</h1>
          <p className="text-gray-600 mt-2">Estamos prontos para atender você. Escolha a melhor forma de contato.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info Side */}
          <div>
            <div className="bg-kiel-dark text-white p-8 rounded-lg shadow-xl relative overflow-hidden mb-8">
              <div className="relative z-10 space-y-8">
                <div className="flex items-start">
                  <div className="bg-kiel-orange p-3 rounded-lg mr-4">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase text-kiel-yellow mb-1">Telefone / WhatsApp</h3>
                    <p className="text-xl font-bold">(11) 91990-4407</p>
                    <p className="text-sm text-gray-400">Atendimento ágil e personalizado</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-kiel-orange p-3 rounded-lg mr-4">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase text-kiel-yellow mb-1">E-mail</h3>
                    <p className="text-lg">contato@kieltransportes.com.br</p>
                    <p className="text-sm text-gray-400">Para dúvidas, cotações e parcerias</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-kiel-orange p-3 rounded-lg mr-4">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase text-kiel-yellow mb-1">Localização</h3>
                    <p className="text-lg">Rua Exemplo de Logística, 123</p>
                    <p className="text-gray-400">Bairro Industrial, São Paulo - SP</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-kiel-orange p-3 rounded-lg mr-4">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase text-kiel-yellow mb-1">Horário</h3>
                    <p className="text-gray-300">Segunda a Sexta: 08h às 18h</p>
                    <p className="text-gray-300">Sábado: 08h às 12h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase">Envie uma mensagem</h2>
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
              (e.target as HTMLFormElement).reset();
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input type="text" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input type="text" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea rows={5} required className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"></textarea>
              </div>
              <button type="submit" className="bg-kiel-dark text-white font-bold uppercase py-3 px-8 rounded hover:bg-gray-800 transition-colors w-full sm:w-auto shadow-lg transform hover:-translate-y-1">
                Enviar Mensagem
              </button>
            </form>
          </div>
        </div>

        {/* Fake Map */}
        <div className="mt-16 w-full h-96 bg-gray-200 rounded-lg overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
            <div className="text-center text-gray-500">
              <MapPin size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="font-bold uppercase">Mapa Integrado</p>
              <p className="text-sm">(Google Maps Embed Placeholder)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};