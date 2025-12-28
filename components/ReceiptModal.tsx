import React, { useRef } from 'react';
import { Freight, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { X, Printer } from 'lucide-react';
import { Button } from './Button';

interface ReceiptModalProps {
  freight: Freight;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ freight, settings, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Recibo - FreteControl</title>');
      printWindow.document.write(`
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .receipt-container { border: 2px solid #000; padding: 20px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .label { font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 10px; margin-top: 20px; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          .signature-line { margin-top: 50px; border-top: 1px solid #000; width: 60%; margin-left: auto; margin-right: auto; padding-top: 5px; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const addressLine1 = [
    settings.issuerAddressStreet,
    settings.issuerAddressNumber
  ].filter(Boolean).join(', ');
  
  const addressLine1Suffix = [
     settings.issuerAddressNeighborhood
  ].filter(Boolean).join(' - ');

  const fullLine1 = [addressLine1, addressLine1Suffix].filter(Boolean).join(' - ');

  const addressLine2 = [
    settings.issuerAddressCity,
    settings.issuerAddressState
  ].filter(Boolean).join(' - ');

  const fullAddress = [
      fullLine1,
      addressLine2,
      settings.issuerAddressZip ? `CEP: ${settings.issuerAddressZip}` : ''
  ].filter(Boolean).join('<br/>');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white">Visualizar Recibo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
          <div ref={printRef} className="bg-white p-6 shadow-sm receipt-container text-slate-900">
             <div className="header">
                <div className="title">RECIBO DE FRETE</div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>#{freight.id.substring(0, 8).toUpperCase()}</div>
             </div>

             <div style={{ marginBottom: '20px' }}>
                <p><strong>Emissor:</strong> {settings.issuerName || 'FreteControl Usuário'}</p>
                {settings.issuerDoc && <p><strong>CPF/CNPJ:</strong> {settings.issuerDoc}</p>}
                {settings.issuerPhone && <p><strong>Tel:</strong> {settings.issuerPhone}</p>}
                {fullAddress && (
                    <div style={{ marginTop: '4px' }}>
                         <strong>Endereço:</strong><br/>
                         <span dangerouslySetInnerHTML={{ __html: fullAddress }} />
                    </div>
                )}
             </div>

             <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
                <div className="row">
                    <span className="label">Cliente:</span>
                    <span>{freight.client || 'Cliente Avulso'}</span>
                </div>
                <div className="row">
                    <span className="label">Data do Serviço:</span>
                    <span>{formatDate(freight.date)}</span>
                </div>
                {freight.dueDate && (
                     <div className="row">
                        <span className="label">Vencimento:</span>
                        <span>{formatDate(freight.dueDate)}</span>
                    </div>
                )}
             </div>

             <div className="row">
                <span className="label">Descrição do Serviço:</span>
                <span>Transporte de Carga / Frete</span>
             </div>

             <div className="total">
                VALOR TOTAL: {formatCurrency(freight.totalValue)}
             </div>

             {freight.receivedValue < freight.totalValue && (
                 <div style={{ textAlign: 'right', fontSize: '14px', marginTop: '5px', color: '#666' }}>
                    (Recebido: {formatCurrency(freight.receivedValue)} / Pendente: {formatCurrency(freight.pendingValue)})
                 </div>
             )}

             <div className="footer">
                <div className="signature-line">
                   Assinatura do Responsável
                </div>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
                Fechar
            </Button>
            <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
            </Button>
        </div>
      </div>
    </div>
  );
};