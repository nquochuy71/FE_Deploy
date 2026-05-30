import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  accent?: string;
}

export const StatCard = ({ label, value, detail, icon, accent = '#4f46e5' }: StatCardProps) => {
  return (
    <article
      style={{
        borderRadius: '20px',
        background: 'var(--color-white)',
        padding: '1.25rem',
        boxShadow: '0 12px 30px rgba(201,169,110,0.12)',
        border: '1px solid rgba(201,169,110,0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-gray-500)' }}>{label}</p>
          <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.9rem', color: 'var(--color-black)' }}>{value}</h3>
          {detail ? <p style={{ margin: '0.4rem 0 0', color: 'var(--color-gray-700)', fontSize: '0.88rem' }}>{detail}</p> : null}
        </div>

        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: 'rgba(201,169,110,0.12)',
          }}
        >
          {icon}
        </div>
      </div>
    </article>
  );
};