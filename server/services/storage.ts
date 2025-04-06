import fs from 'fs/promises';
import path from 'path';

interface AISession {
  id: string;
  features?: Record<string, boolean>;
  [key: string]: any;
}

export class StorageService {
  private storagePath: string;
  
  constructor() {
    this.storagePath = path.join(process.cwd(), 'data');
    this.initializeStorage();
  }
  
  private async initializeStorage() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage directory:', error);
    }
  }
  
  async getAISession(sessionId: string): Promise<AISession | null> {
    try {
      const filePath = path.join(this.storagePath, `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error reading session ${sessionId}:`, error);
      }
      return null;
    }
  }
  
  async updateAISession(sessionId: string, data: any): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${sessionId}.json`);
      const session = { 
        id: sessionId,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      throw error;
    }
  }
  
  async deleteAISession(sessionId: string): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${sessionId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }
  
  async listAISessions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storagePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
  }
}
