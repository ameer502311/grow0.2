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
  submitButtonText = 'Fetch Bill Details'
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
          <label className="block text-slate-700 dark:text-slate-300 font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.hint || `Enter ${field.label}`}
            value={formData[field.name] || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 text-xs focus:outline-none transition-colors ${
              errors[field.name] 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500'
            }`}
          />
          {errors[field.name] ? (
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">{errors[field.name]}</p>
          ) : (
            field.hint && <p className="text-[10px] text-slate-500 dark:text-slate-400">{field.hint}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Processing Provider Request...' : submitButtonText}
      </button>
    </form>
  );
};
