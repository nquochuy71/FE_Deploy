import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const SectionCard = ({ title, description, badge, children, className = '' }: SectionCardProps) => {
  return (
    <section className={`rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_12px_32px_rgba(201,169,110,0.12)] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="m-0 text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h3>
          {description ? <p className="m-0 mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>

        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      <div className="px-5 py-5">{children}</div>
    </section>
  );
};
