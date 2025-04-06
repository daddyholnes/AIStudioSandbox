import { ProjectFileInfo } from '@shared/schema';
import { apiRequest } from './queryClient';

// Get project file tree
export const getFileTree = async (): Promise<ProjectFileInfo[]> => {
  try {
    const response = await apiRequest('GET', '/api/files');
    return await response.json();
  } catch (error) {
    console.error('Error getting file tree:', error);
    throw error;
  }
};

// Get file content
export const getFileContent = async (fileId: string): Promise<string> => {
  try {
    const response = await apiRequest('GET', `/api/files/${fileId}`);
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};

// Save file content
export const saveFile = async (fileId: string, content: string): Promise<void> => {
  try {
    await apiRequest('PATCH', `/api/files/${fileId}`, { content });
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Create new file
export const createFile = async (name: string, path: string, content: string = '', language: string = 'plaintext'): Promise<ProjectFileInfo> => {
  try {
    const response = await apiRequest('POST', '/api/files', {
      name,
      path,
      content,
      language
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

// Create new folder
export const createFolder = async (name: string, path: string): Promise<ProjectFileInfo> => {
  try {
    const response = await apiRequest('POST', '/api/folders', {
      name,
      path
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Delete file or folder
export const deleteFileOrFolder = async (id: string): Promise<void> => {
  try {
    await apiRequest('DELETE', `/api/files/${id}`);
  } catch (error) {
    console.error('Error deleting file/folder:', error);
    throw error;
  }
};

// Rename file or folder
export const renameFileOrFolder = async (id: string, newName: string): Promise<ProjectFileInfo> => {
  try {
    const response = await apiRequest('PATCH', `/api/files/${id}/rename`, {
      name: newName
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error renaming file/folder:', error);
    throw error;
  }
};

// Execute code
export const executeCode = async (code: string, language: string): Promise<{ result: string; error?: string }> => {
  try {
    const response = await apiRequest('POST', '/api/execute', {
      code,
      language
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error executing code:', error);
    return {
      result: '',
      error: `Failed to execute code: ${(error as Error).message}`
    };
  }
};
