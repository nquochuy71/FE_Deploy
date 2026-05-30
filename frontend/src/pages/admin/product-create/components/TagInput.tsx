import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { FieldShell } from './FieldShell';
import type { ProductCreateFormValues } from '../productCreate.schema';

type TagInputProps = {
  name: 'suitableSkinTypes' | 'skinConcerns';
  label: string;
  hint?: string;
  placeholder?: string;
  suggestions: string[];
};

export const TagInput = ({ name, label, hint, suggestions }: TagInputProps) => {
  const { watch, setValue, formState } = useFormContext<ProductCreateFormValues>();
  const items = watch(name) || [];
  const fieldError = useMemo(() => {
    const error = formState.errors[name];
    return typeof error?.message === 'string' ? error.message : undefined;
  }, [formState.errors, name]);

  const addItem = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue || items.includes(nextValue) || items.length >= 8) {
      return;
    }

    setValue(name, [...items, nextValue], { shouldDirty: true, shouldValidate: true });
  };

  const removeItem = (value: string) => {
    setValue(name, items.filter((item) => item !== value), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FieldShell label={label} hint={hint} error={fieldError}>
      <div style={{ border: '1px solid #8691a2' }} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => removeItem(item)}
              style={{ border: '1px solid #d1c23b' }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              {item}
              <X size={12} />
            </button>
          ))}
          {items.length === 0 ? <span className="text-sm text-slate-400">Chưa có mục nào.</span> : null}
        </div>


        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addItem(suggestion)}
              style={{ border: '1px solid #d1c23b' }}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </FieldShell>
  );
};
