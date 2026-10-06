import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ label, value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('address-suggestions', {
          body: { input: value },
        });
        if (error || data?.error) {
          setSuggestions([]);
          return;
        }
        setSuggestions(data?.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  const select = (text: string) => {
    skipNextFetch.current = true;
    onChange(text);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-roboto font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-brand-secondary/20 text-sm text-slate-800 dark:text-white"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(s); }}
                className="w-full flex items-start gap-2 px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <MapPin className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                <span>{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
