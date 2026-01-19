import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

export const Quote = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    origin: '',
    destination: '',
    type: 'Carga Geral',
    weight: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.type === 'radio' ? 'name' : 'name']: e.target.value }); // Fix typing if needed, simplified below
    // Actual implementation with proper connection
    const { value } = e.target;
    // Just using a simplified handler for this snippet to avoid complexity in replace
    // Rethinking the handler to be cleaner in the full replacement
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = `*NOVA SOLICITAÇÃO DE COTAÇÃO*%0A%0A` +
      `*Contato:*%0A` +
      `Nome: ${formData.name}%0A` +
      `Empresa: ${formData.company}%0A` +
      `Email: ${formData.email}%0A` +
      `Tel: ${formData.phone}%0A%0A` +
      `*Carga:*%0A` +
      `Origem: ${formData.origin}%0A` +
      `Destino: ${formData.destination}%0A` +
      `Tipo: ${formData.type}%0A` +
      `Peso: ${formData.weight} kg%0A` +
      `Obs: ${formData.notes}`;

    window.open(`https://wa.me/5511919904407?text=${message}`, '_blank');
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 uppercase italic">Solicitar Cotação</h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Preencha o formulário abaixo e receba nossa proposta comercial diretamente no seu WhatsApp ou E-mail.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border-t-8 border-kiel-orange">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-6 flex items-center">
                <span className="w-2 h-6 bg-kiel-orange mr-3"></span>
                Dados de Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Cargo Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-6 flex items-center">
                <span className="w-2 h-6 bg-kiel-orange mr-3"></span>
                Dados da Carga
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade de Origem *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade de Destino *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carga</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Carga Geral">Carga Geral</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Móveis">Móveis</option>
                    <option value="Alimentos não perecíveis">Alimentos não perecíveis</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso Estimado (kg)</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações ou Dimensões Específicas</label>
                <textarea
                  rows={4}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded focus:border-kiel-orange focus:ring-0 outline-none transition-colors"
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold uppercase py-4 px-8 rounded shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              >
                <MessageCircle className="mr-2" />
                Enviar via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => alert('Solicitação enviada por e-mail (simulação)!')}
                className="w-full sm:w-auto bg-kiel-dark hover:bg-black text-white font-bold uppercase py-4 px-8 rounded shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              >
                <Send className="mr-2" size={18} />
                Enviar via E-mail
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              Ao enviar, você concorda em receber o contato da nossa equipe comercial.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};