import React, { useRef } from 'react';
import { Freight, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { X, Printer, MessageCircle, Share2 } from 'lucide-react';
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
      printWindow.document.write('<html><head><title>Recibo - Control Frete</title>');
      printWindow.document.write(`
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .receipt-container { 
            border: 1px solid #e2e8f0; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.025em; }
          .id { font-family: monospace; color: #64748b; font-size: 14px; margin-top: 4px; }
          
          .section { margin-bottom: 24px; }
          .section-title { font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 12px; }
          
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
          .item { margin-bottom: 8px; }
          .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .value { font-size: 15px; font-weight: 500; color: #1e293b; }
          
          .total-box { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 30px; 
            text-align: right; 
            border: 1px solid #e2e8f0;
          }
          .total-label { font-size: 14px; color: #64748b; }
          .total-value { font-size: 32px; font-weight: 800; color: #3b82f6; }
          
          .footer { margin-top: 60px; text-align: center; }
          .signature-line { border-top: 1px solid #cbd5e1; width: 250px; margin: 0 auto 8px; }
          .signature-label { font-size: 12px; color: #64748b; }
          
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; box-shadow: none; }
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleWhatsAppShare = () => {
    const issuer = settings.issuerName || 'Prestador de Serviço';
    const client = freight.client || 'Cliente';
    const value = formatCurrency(freight.totalValue);
    const date = formatDate(freight.date);
    const id = freight.id.substring(0, 8).toUpperCase();

    let text = `*RECIBO DE FRETE #${id}*\n\n`;
    text += `*EMISSOR:* ${issuer}\n`;
    if (settings.issuerDoc) text += `*CPF/CNPJ:* ${settings.issuerDoc}\n`;
    text += `--------------------------\n`;
    text += `*CLIENTE:* ${client}\n`;
    text += `*DATA:* ${date}\n`;
    if (freight.description) text += `*DESCRIÇÃO:* ${freight.description}\n`;
    if (freight.origin) text += `*ORIGEM:* ${freight.origin}\n`;
    if (freight.destination) text += `*DESTINO:* ${freight.destination}\n`;
    text += `*FORMA PAGTO:* ${freight.paymentMethod || 'Não informado'}\n`;
    text += `--------------------------\n`;
    text += `*VALOR TOTAL:* ${value}\n`;

    if (freight.pendingValue > 0) {
      text += `*RECEBIDO:* ${formatCurrency(freight.receivedValue)}\n`;
      text += `*SALDO PENDENTE:* ${formatCurrency(freight.pendingValue)}\n`;
    }

    text += `\n_Gerado por Control Frete_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-900/50">
          <div ref={printRef} className="bg-white p-8 sm:p-12 shadow-sm rounded-lg receipt-container text-slate-900 mx-auto max-w-[700px] border border-slate-100">
            <div className="header" style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #3b82f6', paddingBottom: '20px' }}>
              <div className="title" style={{ fontSize: '28px', fontWeight: '800', textTransform: 'uppercase', color: '#1e293b' }}>
                RECIBO DE FRETE
              </div>
              <div className="id" style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                #{freight.id.substring(0, 8).toUpperCase()}
              </div>
            </div>

            <div className="section" style={{ marginBottom: '30px' }}>
              <div className="section-title" style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '16px' }}>
                Informações do Emissor
              </div>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="item">
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Emissor / Empresa</div>
                  <div className="value" style={{ fontSize: '16px', fontWeight: '700' }}>{settings.issuerName || 'Control Frete Usuário'}</div>
                </div>
                {settings.issuerDoc && (
                  <div className="item">
                    <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>CPF / CNPJ</div>
                    <div className="value" style={{ fontSize: '14px' }}>{settings.issuerDoc}</div>
                  </div>
                )}
              </div>
              {settings.issuerPhone && (
                <div className="item" style={{ marginTop: '12px' }}>
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Contato</div>
                  <div className="value" style={{ fontSize: '14px' }}>{settings.issuerPhone}</div>
                </div>
              )}
              {fullAddress && (
                <div className="item" style={{ marginTop: '12px' }}>
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Endereço</div>
                  <div className="value" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                    <span dangerouslySetInnerHTML={{ __html: fullAddress }} />
                  </div>
                </div>
              )}
            </div>

            <div className="section" style={{ marginBottom: '30px' }}>
              <div className="section-title" style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '16px' }}>
                Detalhes do Cliente e Serviço
              </div>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="item">
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Cliente</div>
                  <div className="value" style={{ fontSize: '16px', fontWeight: '700' }}>{freight.client || 'Cliente Avulso'}</div>
                </div>
                <div className="item">
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Data do Serviço</div>
                  <div className="value" style={{ fontSize: '14px' }}>{formatDate(freight.date)}</div>
                </div>
              </div>

              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '12px' }}>
                {freight.origin && (
                  <div className="item">
                    <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Origem</div>
                    <div className="value" style={{ fontSize: '13px' }}>{freight.origin}</div>
                  </div>
                )}
                {freight.destination && (
                  <div className="item">
                    <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Destino</div>
                    <div className="value" style={{ fontSize: '13px' }}>{freight.destination}</div>
                  </div>
                )}
              </div>

              {freight.description && (
                <div className="item" style={{ marginTop: '12px' }}>
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Descrição / Mercadoria</div>
                  <div className="value" style={{ fontSize: '13px' }}>{freight.description}</div>
                </div>
              )}
            </div>

            <div className="section" style={{ marginBottom: '30px' }}>
              <div className="section-title" style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '16px' }}>
                Pagamento
              </div>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="item">
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Forma de Pagamento</div>
                  <div className="value" style={{ fontSize: '14px', fontWeight: '600' }}>{freight.paymentMethod || 'PIX'}</div>
                </div>
                <div className="item">
                  <div className="label" style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
                  <div className="value" style={{ fontSize: '14px', fontWeight: '700', color: freight.status === 'PAID' ? '#10b981' : '#f59e0b' }}>
                    {freight.status === 'PAID' ? 'PAGO INTEGRAL' : (freight.status === 'PARTIAL' ? 'PAGO PARCIAL' : 'PENDENTE')}
                  </div>
                </div>
              </div>
            </div>

            <div className="total-box" style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginTop: '40px', textAlign: 'right', border: '1px solid #e2e8f0' }}>
              <div className="total-label" style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>VALOR TOTAL DO FRETE</div>
              <div className="total-value" style={{ fontSize: '36px', fontWeight: '900', color: '#3b82f6' }}>{formatCurrency(freight.totalValue)}</div>

              {freight.pendingValue > 0 && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                  <div>Valor Recebido: <strong>{formatCurrency(freight.receivedValue)}</strong></div>
                  <div style={{ color: '#ef4444', fontWeight: '700' }}>Saldo a Receber: {formatCurrency(freight.pendingValue)}</div>
                </div>
              )}
            </div>

            <div className="footer" style={{ marginTop: '80px', textAlign: 'center' }}>
              <div className="signature-line" style={{ borderTop: '1px solid #cbd5e1', width: '250px', margin: '0 auto 8px' }}></div>
              <div className="signature-label" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assinatura do Responsável
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '40px' }}>
                Recibo gerado eletronicamente através do sistema Control Frete.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1 min-w-[120px]">
            Fechar
          </Button>
          <Button variant="outline" onClick={handleWhatsAppShare} className="flex-1 min-w-[120px] bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={handlePrint} className="flex-1 min-w-[120px]">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};