import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RangeFilterValue, SelectionFilterValue } from '../../types';

interface DataTableViewProps {
  transformedData?: Record<string, unknown>[];
}

export function DataTableView({ transformedData }: DataTableViewProps) {
  const { state } = useApp();

  // Apply filters to data if any exist
  const displayData = useMemo(() => {
    // If we have aggregated data from Vega, use it directly
    if (transformedData) return transformedData;

    if (state.filters.length === 0) return state.data;

    return state.data.filter((row: Record<string, unknown>) => {
      return state.filters.every((filter) => {
        const value = row[filter.fieldName];
        if (value === undefined || value === null) return false;

        if (filter.filterType === 'range') {
          const numValue = Number(value);
          const range = filter.value as RangeFilterValue;
          return (range.min === null || numValue >= range.min) && 
                 (range.max === null || numValue <= range.max);
        } else if (filter.filterType === 'selection') {
          const selection = filter.value as SelectionFilterValue;
          return selection.selected.includes(String(value));
        }
        return true;
      });
    });
  }, [state.data, state.filters, transformedData]);

  const columns = useMemo(() => {
    if (displayData.length === 0) return [];
    return Object.keys(displayData[0]);
  }, [displayData]);

  if (displayData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No data available to display.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <div
        style={{
          overflow: 'auto',
          flex: 1,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '13px',
            color: 'var(--color-text-primary)',
          }}
        >
          <thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row: Record<string, unknown>, i: number) => (
              <tr
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)';
                }}
              >
                {columns.map((col: string) => (
                  <td
                    key={col}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-tertiary)',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {transformedData ? (
            <>
              Showing <strong>{displayData.length}</strong> aggregated summaries
            </>
          ) : (
            <>
              Showing <strong>{displayData.length}</strong> of <strong>{state.data.length}</strong> records
            </>
          )}
        </span>
        {state.filters.length > 0 && (
          <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
            {state.filters.length} filters applied
          </span>
        )}
      </div>
    </div>
  );
}
