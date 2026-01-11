import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FieldPill } from './FieldPill';
import type { FieldType } from '../../types';

const TYPE_INFO: { type: FieldType; label: string; color: string }[] = [
  { type: 'quantitative', label: 'Quantitative', color: 'var(--color-quantitative)' },
  { type: 'nominal', label: 'Nominal', color: 'var(--color-nominal)' },
  { type: 'ordinal', label: 'Ordinal', color: 'var(--color-ordinal)' },
  { type: 'temporal', label: 'Temporal', color: 'var(--color-temporal)' },
];

// Type order for sorting fields
const TYPE_ORDER: Record<FieldType, number> = {
  quantitative: 0,
  temporal: 1,
  ordinal: 2,
  nominal: 3,
};

interface FieldListProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function FieldList({ isCollapsed, onToggle }: FieldListProps) {
  const { state } = useApp();

  // Sort fields by type: quantitative, temporal, ordinal, nominal
  const sortedFields = useMemo(() => {
    return [...state.fields].sort((a, b) => {
      const orderA = TYPE_ORDER[a.type];
      const orderB = TYPE_ORDER[b.type];
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by name within same type
      return a.name.localeCompare(b.name);
    });
  }, [state.fields]);

  if (isCollapsed) {
    return (
      <aside
        style={{
          width: '48px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={onToggle}
        title="Expand Data Fields"
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '8px',
            marginBottom: '20px',
            transition: 'color 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            userSelect: 'none',
          }}
        >
          Data Fields
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        padding: '24px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Collapse button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '20px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--color-accent)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Collapse"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
        </svg>
      </button>

      {/* Section header */}
      <div style={{ marginBottom: '20px', paddingRight: '24px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '4px',
          }}
        >
          Data Fields
        </h2>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          Drag fields to encode your chart
        </p>
      </div>

      {/* Type legend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '24px',
          padding: '12px',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: '8px',
        }}
      >
        {TYPE_INFO.map(({ type, label, color }) => (
          <div
            key={type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: color,
                borderRadius: '2px',
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Fields list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flex: 1,
        }}
      >
        {sortedFields.map((field, index) => (
          <FieldPill key={field.name} field={field} index={index} />
        ))}
      </div>

      {/* Footer decoration */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-border)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {state.fields.length} fields available
      </div>
    </aside>
  );
}
