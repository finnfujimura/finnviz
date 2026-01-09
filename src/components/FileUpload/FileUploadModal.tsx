import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseFile, isParseError } from '../../utils/fileParsers';
import type { FileParseError, FileUploadResult } from '../../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const { loadData } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FileParseError | null>(null);
  const [result, setResult] = useState<FileUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const parseResult = await parseFile(file);

    setIsLoading(false);

    if (isParseError(parseResult)) {
      setError(parseResult);
    } else {
      setResult(parseResult);
    }
  };

  const handleLoadData = () => {
    if (result) {
      loadData(result.data);
      onClose();
    }
  };

  const handleClose = () => {
    setError(null);
    setResult(null);
    setIsLoading(false);
    onClose();
  };

  const handleReset = () => {
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '32px',
          width: '480px',
          maxWidth: '90vw',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 400,
                color: 'var(--color-text-primary)',
                fontStyle: 'italic',
                marginBottom: '4px',
              }}
            >
              Upload Data
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
              }}
            >
              CSV, JSON, or Excel files supported
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Processing file...
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                !
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#ef4444',
                }}
              >
                {error.message}
              </span>
            </div>
            {error.details && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  marginBottom: '16px',
                }}
              >
                {error.details}
              </p>
            )}
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              Try Again
            </button>
          </div>
        ) : result ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22c55e',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#22c55e',
                }}
              >
                File ready to load
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {result.rowCount.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Rows
                </div>
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {result.fieldCount}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Fields
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                marginBottom: '16px',
              }}
            >
              {result.fileName}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleLoadData}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Load Data
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: 'block',
              padding: '48px 24px',
              border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: '12px',
              backgroundColor: isDragging ? 'var(--color-accent-glow)' : 'var(--color-bg-tertiary)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                borderRadius: '12px',
                backgroundColor: isDragging ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                border: `1px solid ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDragging ? 'white' : 'var(--color-text-muted)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p
              style={{
                fontSize: '14px',
                color: isDragging ? 'var(--color-accent)' : 'var(--color-text-primary)',
                fontWeight: 500,
                marginBottom: '8px',
                transition: 'color 0.2s ease',
              }}
            >
              {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
              }}
            >
              Supports CSV, JSON, Excel (.xlsx, .xls)
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '16px',
              }}
            >
              {['CSV', 'JSON', 'XLS'].map((type) => (
                <span
                  key={type}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 500,
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          </label>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
