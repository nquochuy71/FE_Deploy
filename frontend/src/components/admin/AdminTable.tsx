import type { ReactNode } from 'react';

export interface AdminTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface AdminTableProps<T> {
  title: string;
  description?: string;
  columns: AdminTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}

export const AdminTable = <T,>({ title, description, columns, rows, emptyMessage = 'Không có dữ liệu' }: AdminTableProps<T>) => {
  return (
    <section
      style={{
        borderRadius: '20px',
        background: '#ffffff',
        padding: '1.25rem',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{title}</h3>
        {description ? <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>{description}</p> : null}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  style={{
                    textAlign: column.align || 'left',
                    padding: '0.9rem 0.75rem',
                    color: '#475569',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '1.25rem 0.75rem', color: '#64748b', textAlign: 'center' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      style={{
                        textAlign: column.align || 'left',
                        padding: '0.95rem 0.75rem',
                        borderBottom: '1px solid #f1f5f9',
                        color: '#0f172a',
                        verticalAlign: 'middle',
                      }}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};