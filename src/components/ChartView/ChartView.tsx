import { useEffect, useRef, useState, useMemo } from 'react';
import embed, { type Result } from 'vega-embed';
import { useApp } from '../../context/AppContext';
import { buildVegaSpec, generateChartTitle } from '../../utils/vegaSpecBuilder';
import { DataTableView } from '../DataTableView/DataTableView';

export function ChartView() {
  const { state, setChartTitle, setViewMode } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const vegaResultRef = useRef<Result | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [transformedData, setTransformedData] = useState<Record<string, unknown>[] | undefined>(undefined);

  const autoTitle = generateChartTitle(state.encodings);
  const displayTitle = state.chartTitle ?? autoTitle;

  const spec = useMemo(() => {
    return buildVegaSpec(state.encodings, state.data, state.markType, state.chartTitle, state.filters);
  }, [state.encodings, state.data, state.markType, state.chartTitle, state.filters]);

  // Calculate X-axis density for dynamic label scaling
  const densityMetrics = useMemo(() => {
    const xField = state.encodings.x?.field.name;
    const uniqueXValues = xField ? new Set(state.data.map((d) => d[xField])).size : 0;

    // Scaling logic: smaller font and rotated angle as density increases
    return {
      labelSize: uniqueXValues > 50 ? 8 : uniqueXValues > 25 ? 9 : 11,
      angle: uniqueXValues > 20 ? -90 : uniqueXValues > 8 ? -45 : 0
    };
  }, [state.encodings.x?.field.name, state.data]);

  useEffect(() => {
    // Cleanup previous Vega view
    if (vegaResultRef.current) {
      vegaResultRef.current.finalize();
      vegaResultRef.current = null;
    }

    if (!containerRef.current) return;

    if (!spec) {
      containerRef.current.innerHTML = '';
      return;
    }

    const embedChart = async () => {
      try {
        const result = await embed(containerRef.current!, spec, {
          actions: { export: true, source: false, compiled: false, editor: false },
          renderer: 'svg',
          config: {
            background: 'transparent',
            axis: {
              labelColor: '#a3a3a3',
              titleColor: '#fafafa',
              gridColor: 'rgba(255, 255, 255, 0.06)',
              domainColor: 'rgba(255, 255, 255, 0.15)',
              tickColor: 'rgba(255, 255, 255, 0.15)',
              labelFont: 'DM Sans, sans-serif',
              titleFont: 'DM Sans, sans-serif',
              labelFontSize: densityMetrics.labelSize,
              labelOverlap: false, // Force all labels to show, never hide any
              labelLimit: 120,
              titleFontSize: 13,
              titleFontWeight: 600,
              titleFontStyle: 'normal',
            },
            axisX: {
              labelAngle: densityMetrics.angle,
            },
            legend: {
              labelColor: '#a3a3a3',
              titleColor: '#fafafa',
              labelFont: 'DM Sans, sans-serif',
              titleFont: 'DM Sans, sans-serif',
              labelFontSize: 11,
              titleFontSize: 11,
              titleFontWeight: 600,
            },
            title: {
              color: '#fafafa',
              font: 'DM Sans, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              fontStyle: 'normal',
            },
            view: {
              stroke: 'transparent',
            },
            range: {
              category: ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899'],
            },
          },
        });
        vegaResultRef.current = result;

        // Extract aggregated data from the Vega view
        try {
          const data = result.view.data('data_0');
          if (data && Array.isArray(data)) {
            setTransformedData(data);
          }
        } catch (e) {
          console.warn('Could not extract transformed data:', e);
          setTransformedData(undefined);
        }
      } catch (error) {
        console.error('Vega embed error:', error);
      }
    };

    embedChart();

    // Cleanup on unmount
    return () => {
      if (vegaResultRef.current) {
        vegaResultRef.current.finalize();
        vegaResultRef.current = null;
      }
    };
  }, [spec, densityMetrics, state.viewMode]);

  const hasEncodings = Object.keys(state.encodings).length > 0;

  return (
    <main
      style={{
        padding: '32px',
        backgroundColor: 'var(--color-bg-primary)',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 107, 74, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '4px',
            }}
          >
            Visualization
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
            }}
          >
            {hasEncodings
              ? spec
                ? 'Your chart is ready'
                : 'Add X or Y axis to render'
              : 'Start by dragging fields to encodings'}
          </p>
        </div>

        {spec && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Live Preview
          </div>
        )}

        {/* View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-bg-tertiary)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            gap: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <button
            onClick={() => setViewMode('chart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: state.viewMode === 'chart' ? 'var(--color-bg-secondary)' : 'transparent',
              color: state.viewMode === 'chart' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              boxShadow: state.viewMode === 'chart' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
              transform: state.viewMode === 'chart' ? 'translateY(0)' : 'translateY(0)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: state.viewMode === 'table' ? 'var(--color-bg-secondary)' : 'transparent',
              color: state.viewMode === 'table' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              boxShadow: state.viewMode === 'table' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            Table
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        display: state.viewMode === 'chart' ? 'flex' : 'none', 
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {!hasEncodings ? (
          <div
            key="empty-state"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                maxWidth: '320px',
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              {/* Decorative chart icon */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 24px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-elevated) 100%)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '20px',
                    backgroundColor: 'var(--color-quantitative)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '32px',
                    backgroundColor: 'var(--color-nominal)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '24px',
                    backgroundColor: 'var(--color-ordinal)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.7,
                  }}
                />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '8px',
                }}
              >
                Create Your Chart
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Drag data fields from the left panel to encoding channels to build your visualization
              </p>
            </div>
          </div>
        ) : !spec ? (
          <div
            key="almost-there"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                maxWidth: '320px',
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              {/* Axes indicator */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 24px',
                  position: 'relative',
                }}
              >
                {/* Y axis */}
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '10px',
                    bottom: '20px',
                    width: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '1px',
                    opacity: 0.5,
                  }}
                />
                {/* X axis */}
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    bottom: '20px',
                    right: '10px',
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '1px',
                    opacity: 0.5,
                  }}
                />
                {/* Dashed placeholder */}
                <div
                  style={{
                    position: 'absolute',
                    left: '30px',
                    top: '20px',
                    right: '15px',
                    bottom: '30px',
                    border: '2px dashed var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '8px',
                }}
              >
                Almost There
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Add a field to the <span style={{ color: 'var(--color-accent)' }}>X</span> or{' '}
                <span style={{ color: 'var(--color-accent)' }}>Y</span> axis to render your chart
              </p>
            </div>
          </div>
        ) : (
          <div
            key="chart-wrapper"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            {/* Editable Chart Title */}
            <div
              style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    if (titleInput.trim()) {
                      setChartTitle(titleInput.trim());
                    } else {
                      setChartTitle(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                      if (titleInput.trim()) {
                        setChartTitle(titleInput.trim());
                      } else {
                        setChartTitle(null);
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setTitleInput(displayTitle);
                    }
                  }}
                  autoFocus
                  placeholder={autoTitle || 'Enter chart title...'}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  onClick={() => {
                    setTitleInput(displayTitle);
                    setIsEditingTitle(true);
                  }}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    color: displayTitle ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{displayTitle || 'Click to add title...'}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.5 }}
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              )}
              {state.chartTitle && (
                <button
                  onClick={() => setChartTitle(null)}
                  title="Reset to auto-generated title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Chart container */}
            <div
              ref={containerRef}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            ></div>
          </div>
        )}
      </div>

      {state.viewMode === 'table' && (
        <DataTableView transformedData={transformedData} />
      )}

      {/* Footer gradient line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '32px',
          right: '32px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)',
        }}
      />
    </main>
  );
}
