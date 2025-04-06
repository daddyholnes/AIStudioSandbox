import { apiRequest } from './queryClient';
import { ProjectFileInfo } from '@shared/schema';

interface FileContentResponse {
  content: string;
}

interface ExecuteCodeResponse {
  result: string;
  error?: string;
}

/**
 * Get file tree structure
 */
export const getFileTree = async (): Promise<ProjectFileInfo[]> => {
  try {
    const data = await apiRequest<ProjectFileInfo[]>('/api/files');
    return data;
  } catch (error) {
    console.error('Error getting file tree:', error);
    // Return empty array on error
    return [];
  }
};

/**
 * Get file content by ID
 */
export const getFileContent = async (fileId: string): Promise<string> => {
  try {
    const data = await apiRequest<ProjectFileInfo>(`/api/files/${fileId}`);
    return data.content || '';
  } catch (error) {
    console.error(`Error getting file content for ${fileId}:`, error);
    throw error;
  }
};

/**
 * Save file content
 */
export const saveFile = async (fileId: string, content: string): Promise<void> => {
  try {
    await apiRequest(`/api/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    });
  } catch (error) {
    console.error(`Error saving file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Create a new file
 */
export const createFile = async (name: string, path: string, content: string = '', language: string = 'plaintext'): Promise<ProjectFileInfo> => {
  try {
    const data = await apiRequest<ProjectFileInfo>('/api/files', {
      method: 'POST',
      body: JSON.stringify({ name, path, content, language })
    });
    return data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

/**
 * Delete file or folder
 */
export const deleteFileOrFolder = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/api/files/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting file/folder ${id}:`, error);
    throw error;
  }
};

/**
 * Execute code
 */
export const executeCode = async (code: string, language: string): Promise<{ result: string; error?: string }> => {
  try {
    const data = await apiRequest<ExecuteCodeResponse>('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
    return data;
  } catch (error) {
    console.error('Error executing code:', error);
    return {
      result: '',
      error: (error as Error).message
    };
  }
};