import { SavedProject, ProjectMetadata } from '../types';

const STORAGE_KEY_PREFIX = 'finnviz_project_';
const METADATA_KEY = 'finnviz_projects_metadata';
const LAST_SESSION_KEY = 'finnviz_last_session';

export const persistence = {
  saveProject(project: SavedProject): void {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${project.id}`, JSON.stringify(project));
    
    // Update metadata
    const metadata = this.getProjectsMetadata();
    const existingIndex = metadata.findIndex(m => m.id === project.id);
    const newMeta: ProjectMetadata = {
      id: project.id,
      name: project.name,
      updatedAt: project.updatedAt
    };

    if (existingIndex > -1) {
      metadata[existingIndex] = newMeta;
    } else {
      metadata.push(newMeta);
    }
    
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  },

  getProject(id: string): SavedProject | null {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  },

  deleteProject(id: string): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    const metadata = this.getProjectsMetadata().filter(m => m.id !== id);
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  },

  getProjectsMetadata(): ProjectMetadata[] {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveLastSession(session: Omit<SavedProject, 'name' | 'updatedAt'>): void {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session));
  },

  getLastSession(): Omit<SavedProject, 'name' | 'updatedAt'> | null {
    const data = localStorage.getItem(LAST_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};
