import React, { useRef } from 'react';
import { Freight, Expense, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { X, Printer, FileText } from 'lucide-react';
import { Button } from './Button';

interface MonthlyClosureModalProps {
    month: string; // "YYYY-MM"
    freights: Freight[];
    expenses: Expense[];
    settings: AppSettings;
    onClose: () => void;
}

export const MonthlyClosureModal: React.FC<MonthlyClosureModalProps> = ({ month, freights, expenses, settings, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const [year, monthNum] = month.split('-');
    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const totalIncome = freights.reduce((acc, f) => acc + f.totalValue, 0);
    const totalCompany = freights.reduce((acc, f) => acc + f.companyValue, 0);
    const totalDriver = freights.reduce((acc, f) => acc + f.driverValue, 0);
    const totalReserve = freights.reduce((acc, f) => acc + f.reserveValue, 0);

    const expensesBySource = expenses.reduce((acc, e) => {
        acc[e.source] = (acc[e.source] || 0) + e.value;
        return acc;
    }, {} as Record<string, number>);

    const netCompany = totalCompany - (expensesBySource['COMPANY'] || 0);
    const netDriver = totalDriver - (expensesBySource['DRIVER'] || 0);
    const netReserve = totalReserve - (expensesBySource['RESERVE'] || 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.value, 0);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Fechamento Mensal - ' + monthName + '</title>');
            printWindow.document.write(`
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: white; }
          .closure-container { 
            max-width: 900px; 
            margin: 0 auto; 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 24px; 
            margin-bottom: 32px; 
          }
          .company-info h1 { font-size: 24px; font-weight: 800; margin: 0; color: #1e293b; text-transform: uppercase; }
          .company-info p { font-size: 12px; color: #64748b; margin: 2px 0; }
          .document-title { text-align: right; }
          .document-title h2 { font-size: 18px; font-weight: 700; color: #3b82f6; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
          .document-title p { font-size: 14px; font-weight: 600; color: #1e293b; margin: 4px 0; }

          .logo { max-height: 80px; max-width: 200px; object-fit: contain; margin-bottom: 12px; }

          .summary-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .summary-card { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .summary-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .summary-value { font-size: 18px; font-weight: 800; color: #1e293b; }
          .summary-value.positive { color: #10b981; }
          .summary-value.negative { color: #ef4444; }

          .section-title { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 32px 0 16px; display: flex; align-items: center; gap: 8px; }
          .section-title::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
          tr:last-child td { border-bottom: none; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }

          .footer { margin-top: 60px; padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: center; }
          .signature-box { display: flex; justify-content: center; gap: 80px; margin-bottom: 24px; }
          .signature-line { border-top: 1px solid #cbd5e1; width: 220px; padding-top: 8px; font-size: 11px; color: #64748b; text-transform: uppercase; }
          
          .timestamp { font-size: 10px; color: #94a3b8; }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .summary-card { border: 1px solid #cbd5e1; }
          }
        </style>
      `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Fechamento Mensal</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{monthName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Preview */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-slate-100 dark:bg-slate-900/50">
                    <div ref={printRef} className="bg-white p-10 sm:p-14 shadow-xl rounded-sm closure-container text-slate-900 mx-auto w-full min-h-[1120px]">
                        <div className="header">
                            <div className="company-info">
                                {settings.issuerLogoUrl && (
                                    <img src={settings.issuerLogoUrl} alt="Logo" className="logo" />
                                )}
                                <h1>{settings.issuerName || 'Control Frete'}</h1>
                                {settings.issuerDoc && <p>CPF/CNPJ: {settings.issuerDoc}</p>}
                                {settings.issuerPhone && <p>Contato: {settings.issuerPhone}</p>}
                                {settings.issuerAddressStreet && (
                                    <p>{settings.issuerAddressStreet}, {settings.issuerAddressNumber} - {settings.issuerAddressCity}/{settings.issuerAddressState}</p>
                                )}
                            </div>
                            <div className="document-title">
                                <h2>Fechamento de Frete</h2>
                                <p>Período: {monthName}</p>
                                <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontBold: '700' }}>
                                    Documento Digital CF-FECH-{month.replace('-', '')}
                                </div>
                            </div>
                        </div>

                        <div className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-label">Total Bruto</div>
                                <div className="summary-value">{formatCurrency(totalIncome)}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-label">Total Despesas</div>
                                <div className="summary-value negative">-{formatCurrency(totalExpenses)}</div>
                            </div>
                            <div className="summary-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                <div className="summary-label">Saldo Empresa</div>
                                <div className="summary-value positive">{formatCurrency(netCompany)}</div>
                            </div>
                            <div className="summary-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                <div className="summary-label">Saldo Motorista</div>
                                <div className="summary-value positive">{formatCurrency(netDriver)}</div>
                            </div>
                        </div>

                        <div className="section-title">Resumo de Atividades</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente / Descrição</th>
                                    <th>Origem / Destino</th>
                                    <th className="text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {freights.length > 0 ? freights.map(f => (
                                    <tr key={f.id}>
                                        <td>{formatDate(f.date).split('/').slice(0, 2).join('/')}</td>
                                        <td className="font-bold">{f.client}</td>
                                        <td><div style={{ fontSize: '10px', color: '#64748b' }}>{f.origin ? `${f.origin} → ${f.destination}` : '---'}</div></td>
                                        <td className="text-right font-bold">{formatCurrency(f.totalValue)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center" style={{ color: '#94a3b8', fontStyle: 'italic', padding: '32px' }}>
                                            Nenhum frete registrado neste período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {expenses.length > 0 && (
                            <>
                                <div className="section-title">Detalhamento de Despesas</div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Descrição</th>
                                            <th>Origem Fundo</th>
                                            <th className="text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(e => (
                                            <tr key={e.id}>
                                                <td>{formatDate(e.date).split('/').slice(0, 2).join('/')}</td>
                                                <td>{e.description}</td>
                                                <td>{e.source === 'COMPANY' ? 'Empresa' : (e.source === 'DRIVER' ? 'Motorista' : 'Reserva')}</td>
                                                <td className="text-right font-bold" style={{ color: '#ef4444' }}>-{formatCurrency(e.value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        <div className="section-title">Consolidado Final</div>
                        <table style={{ background: '#f8fafc', borderRadius: '8px' }}>
                            <tbody>
                                <tr>
                                    <td className="font-bold">Total Arrecadado (Bruto)</td>
                                    <td className="text-right font-bold">{formatCurrency(totalIncome)}</td>
                                </tr>
                                <tr>
                                    <td>Total Pago em Despesas</td>
                                    <td className="text-right" style={{ color: '#ef4444' }}>-{formatCurrency(totalExpenses)}</td>
                                </tr>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <td className="font-bold">Saldo para Reserva Técnica</td>
                                    <td className="text-right font-bold" style={{ color: '#3b82f6' }}>{formatCurrency(netReserve)}</td>
                                </tr>
                                <tr style={{ borderTop: '2px solid #3b82f6' }}>
                                    <td style={{ fontSize: '16px', fontWeight: '800' }}>LUCRO LÍQUIDO DO MÊS</td>
                                    <td className="text-right" style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>{formatCurrency(netCompany + netDriver + netReserve)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="footer">
                            <div className="signature-box">
                                <div className="signature-line">
                                    Assinatura do Responsável
                                </div>
                                <div className="signature-line">
                                    Data de Emissão
                                </div>
                            </div>
                            <p className="timestamp">
                                Relatório gerado em {new Date().toLocaleString('pt-BR')} • Control Frete Profissional
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                        Fechar Previa
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 shadow-lg shadow-blue-500/20">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir ou Salvar PDF
                    </Button>
                </div>
            </div>
        </div>
    );
};
