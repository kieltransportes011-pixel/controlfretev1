import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white p-8 border-b-4 border-gray-200 hover:border-kiel-orange shadow-sm hover:shadow-xl transition-all duration-300 group rounded-t-lg">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-kiel-orange transition-colors">
        <Icon className="text-kiel-dark group-hover:text-white transition-colors" size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-kiel-orange transition-colors uppercase">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed text-sm h-20 overflow-hidden">{description}</p>
      <Link to="/servicos" className="inline-flex items-center text-kiel-orange font-bold uppercase text-xs tracking-wider hover:text-orange-700">
        Saiba Mais <ChevronRight size={14} className="ml-1" />
      </Link>
    </div>
  );
};