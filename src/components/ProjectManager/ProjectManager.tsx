import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export function ProjectManager() {
  const { state, saveProject, loadProject, deleteProject, clearAll } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [projectName, setProjectName] = useState('');

  const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      saveProject(projectName.trim());
      setProjectName('');
      setIsExpanded(false);
    }
  };

  const handleNewProject = () => {
    clearAll();
    setIsExpanded(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          color: 'var(--color-text-primary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {currentProject ? currentProject.name : 'Untitled Project'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '280px',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 100,
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <button
            onClick={handleNewProject}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px',
              marginBottom: '16px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px dashed var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-accent)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '16px' }} />
          <form onSubmit={handleSave} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Save current chart
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name..."
                style={{
                  flex: 1,
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </form>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Projects ({state.projects.length})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {state.projects.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px' }}>
                  No saved projects yet
                </div>
              ) : (
                state.projects
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map(project => (
                    <div
                      key={project.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: state.currentProjectId === project.id ? 'var(--color-bg-tertiary)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onClick={() => {
                        loadProject(project.id);
                        setIsExpanded(false);
                      }}
                      onMouseOver={(e) => {
                        if (state.currentProjectId !== project.id) {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (state.currentProjectId !== project.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
