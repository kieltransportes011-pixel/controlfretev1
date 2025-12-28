
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatMonthYear, getCalendarDays } from '../utils';

interface CalendarPickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  className?: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Initialize view date from selected date
  useEffect(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [selectedDate]); // Only run when selectedDate prop actually changes significantly

  const days = getCalendarDays(viewDate.getMonth(), viewDate.getFullYear());
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return 'Selecione uma data';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-[#F5F7FA] rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-slate-700 transition-all"
      >
        <CalendarIcon className="w-5 h-5 text-brand" />
        <span className="font-medium">{formatDateDisplay(selectedDate)}</span>
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base-text capitalize">{formatMonthYear(viewDate)}</span>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {weekDays.map((d, i) => (
              <span key={i} className="text-xs font-bold text-slate-400">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;
              
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(date)}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors mx-auto
                    ${isSelected ? 'bg-brand text-white shadow-md' : 'text-slate-700 hover:bg-brand-50'}
                    ${isToday && !isSelected ? 'border border-brand text-brand' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};
