import type { ReactNode } from 'react';

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  action?: ReactNode;
};

export const FieldShell = ({ label, hint, error, children, action }: FieldShellProps) => {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}

      {error ? <p className="m-0 text-xs font-medium text-rose-600 pl-3">{error}</p> : null}
    </label>
  );
};
