
import React, { useState } from 'react';
import { Booking } from '../types';
import { formatCurrency, formatMonthYear, getCalendarDays, generateId } from '../utils';
import { Card } from './Card';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, CalendarCheck, Trash2, AlertTriangle, X } from 'lucide-react';

interface WorkCalendarProps {
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onConvertBooking: (booking: Booking) => void;
}

export const WorkCalendar: React.FC<WorkCalendarProps> = ({ bookings, onAddBooking, onDeleteBooking, onConvertBooking }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // New Booking Form State
  const [newClient, setNewClient] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEstValue, setNewEstValue] = useState('');

  const days = getCalendarDays(viewDate.getMonth(), viewDate.getFullYear());
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const getBookingsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return bookings.filter(b => b.date === dateStr);
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient) return;

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const booking: Booking = {
      id: generateId(),
      date: dateStr,
      client: newClient,
      time: newTime,
      estimatedValue: newEstValue ? parseFloat(newEstValue) : undefined,
      status: 'SCHEDULED'
    };

    onAddBooking(booking);
    setShowAddModal(false);
    setNewClient('');
    setNewTime('');
    setNewEstValue('');
  };

  return (
    <div className="pb-24 space-y-6 relative">
      <header>
        <h1 className="text-2xl font-bold text-base-text dark:text-white">Agenda de Fretes</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Planejamento futuro</p>
      </header>

      {/* Calendar Grid Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-base-text dark:text-white capitalize">{formatMonthYear(viewDate)}</span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-6 h-6" />
            </button>
        </div>

        <div className="grid grid-cols-7 mb-2 text-center">
            {weekDays.map((d, i) => (
              <span key={i} className="text-xs font-bold text-slate-400">{d}</span>
            ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="h-10" />;
              
              const dayBookings = getBookingsForDate(date);
              const hasBookings = dayBookings.length > 0;
              const isSelected = selectedDate.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    h-10 w-10 mx-auto rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative
                    ${isSelected ? 'bg-brand text-white shadow-lg scale-110 z-10' : 'text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700'}
                    ${isToday && !isSelected ? 'border-2 border-brand text-brand dark:text-brand-300' : ''}
                  `}
                >
                  <span>{date.getDate()}</span>
                  {hasBookings && (
                    <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand'}`}></span>
                  )}
                </button>
              );
            })}
        </div>
      </Card>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <button 
                onClick={() => setShowAddModal(true)}
                className="text-brand dark:text-brand-300 text-sm font-bold flex items-center gap-1 hover:bg-brand-50 dark:hover:bg-brand-900/30 px-3 py-1 rounded-lg transition-colors"
            >
                <Plus className="w-4 h-4" />
                Agendar
            </button>
        </div>

        {selectedDateBookings.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-sm">Nenhum frete agendado para este dia.</p>
                <Button variant="outline" className="mt-4 text-xs" onClick={() => setShowAddModal(true)}>
                    + Adicionar Agendamento
                </Button>
            </div>
        ) : (
            selectedDateBookings.map(booking => (
                <Card key={booking.id} className="border-l-4 border-l-brand">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {booking.time && (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {booking.time}
                                    </span>
                                )}
                                <span className="text-xs font-bold text-brand dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded">Agendado</span>
                            </div>
                            <h3 className="font-bold text-base-text dark:text-white text-lg">{booking.client}</h3>
                            {booking.estimatedValue && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Valor Est.: <span className="font-semibold">{formatCurrency(booking.estimatedValue)}</span>
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => setBookingToDelete(booking.id)}
                            className="p-2 text-accent-error hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button fullWidth onClick={() => onConvertBooking(booking)}>
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            Realizar Frete
                        </Button>
                    </div>
                </Card>
            ))
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slideUp">
                <h3 className="text-lg font-bold text-base-text dark:text-white mb-4">Novo Agendamento</h3>
                <form onSubmit={handleSaveBooking} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cliente</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={newClient}
                            onChange={(e) => setNewClient(e.target.value)}
                            className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
                            placeholder="Nome do cliente ou empresa"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Horário (Op.)</label>
                            <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Valor Est. (Op.)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newEstValue}
                                onChange={(e) => setNewEstValue(e.target.value)}
                                className="w-full p-3 bg-[#F5F7FA] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-brand dark:text-white"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            Agendar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slideUp">
            <div className="flex justify-between items-start mb-4">
               <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-accent-error dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <button onClick={() => setBookingToDelete(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <h3 className="text-lg font-bold text-base-text dark:text-white mb-2">Excluir Agendamento?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Você tem certeza que deseja remover este item da agenda? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setBookingToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={() => { onDeleteBooking(bookingToDelete); setBookingToDelete(null); }}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
