import React, { useState } from 'react';
import { BillerField } from '../types';

interface DynamicBillerFormProps {
  fields: BillerField[];
  onSubmit: (formData: Record<string, string>) => void;
  loading?: boolean;
  submitButtonText?: string;
}

export const DynamicBillerForm: React.FC<DynamicBillerFormProps> = ({
  fields,
  onSubmit,
  loading = false,
  submitButtonText = 'Proceed to Fetch Bill'
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const val = (formData[field.name] || '').trim();

      if (field.required && !val) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (val && field.minLength && val.length < field.minLength) {
        newErrors[field.name] = `Must be at least ${field.minLength} characters`;
      }

      if (val && field.maxLength && val.length > field.maxLength) {
        newErrors[field.name] = `Must be at most ${field.maxLength} characters`;
      }

      if (val && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(val)) {
          newErrors[field.name] = `Invalid format for ${field.label}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {fields.map(field => (
        <div key={field.name} className="space-y-1">
          <label className="block text-slate-300 font-semibold">
            {field.label} {field.required && <span className="text-rose-400">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.hint || `Enter ${field.label}`}
            value={formData[field.name] || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            className={`w-full p-3 rounded-xl bg-slate-950 border text-slate-100 focus:outline-none transition-all ${
              errors[field.name] 
                ? 'border-rose-500/80 focus:border-rose-500' 
                : 'border-slate-800 focus:border-emerald-500'
            }`}
          />
          {errors[field.name] ? (
            <p className="text-[10px] text-rose-400 font-semibold">{errors[field.name]}</p>
          ) : (
            field.hint && <p className="text-[10px] text-slate-500">{field.hint}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Processing Provider Request...' : submitButtonText}
      </button>
    </form>
  );
};
