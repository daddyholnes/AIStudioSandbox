import { users, type User, type InsertUser, AISession, ProjectFileInfo, Message } from "@shared/schema";

// Storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // AI Session management
  getOrCreateAISession(sessionId: string): Promise<AISession>;
  saveAISession(session: AISession): Promise<void>;
  
  // Project files management
  getProjectFiles(): Promise<ProjectFileInfo[]>;
  getProjectFile(id: string): Promise<ProjectFileInfo | undefined>;
  createProjectFile(file: Omit<ProjectFileInfo, 'id' | 'isFolder' | 'children'>): Promise<ProjectFileInfo>;
  updateProjectFile(id: string, updates: Partial<ProjectFileInfo>): Promise<ProjectFileInfo | undefined>;
  deleteProjectFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private aiSessions: Map<string, AISession>;
  private projectFiles: ProjectFileInfo[];
  currentId: number;

  constructor() {
    this.users = new Map();
    this.aiSessions = new Map();
    this.currentId = 1;
    
    // Initialize with sample project files
    this.projectFiles = [
      {
        id: 'folder-1',
        name: 'Project Files',
        path: '/project-files',
        language: 'folder',
        isFolder: true,
        children: [
          {
            id: 'file-1',
            name: 'index.js',
            path: '/project-files/index.js',
            language: 'javascript',
            isFolder: false,
            content: '// Start coding here...'
          },
          {
            id: 'file-2',
            name: 'index.html',
            path: '/project-files/index.html',
            language: 'html',
            isFolder: false,
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiveKit Communication App</title>
  <script src="https://cdn.livekit.io/livekit-client/latest/livekit-client.js"></script>
</head>
<body>
  <div id="app">
    <h1>LiveKit Room Demo</h1>
    <div id="controls"></div>
  </div>
</body>
</html>`
          },
          {
            id: 'file-3',
            name: 'styles.css',
            path: '/project-files/styles.css',
            language: 'css',
            isFolder: false,
            content: `body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 20px;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}`
          }
        ]
      },
      {
        id: 'folder-2',
        name: 'LiveKit Config',
        path: '/livekit-config',
        language: 'folder',
        isFolder: true,
        children: []
      },
      {
        id: 'folder-3',
        name: 'Vertex AI',
        path: '/vertex-ai',
        language: 'folder',
        isFolder: true,
        children: []
      }
    ];
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // AI Session methods
  
  async getOrCreateAISession(sessionId: string): Promise<AISession> {
    if (this.aiSessions.has(sessionId)) {
      return this.aiSessions.get(sessionId)!;
    }
    
    // Create a new session
    const newSession: AISession = {
      userId: 'anonymous',
      sessionId,
      history: [
        {
          role: 'assistant',
          content: "Welcome to Dartopia, your AI-powered development environment! I'm connected via LiveKit and ready to help you build your application.\n\nWhat would you like to work on today?",
          timestamp: Date.now()
        }
      ],
      summaries: [],
      lastActive: Date.now(),
      modelConfig: {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.8
      }
    };
    
    this.aiSessions.set(sessionId, newSession);
    return newSession;
  }
  
  async saveAISession(session: AISession): Promise<void> {
    this.aiSessions.set(session.sessionId, { ...session });
  }
  
  // Project files methods
  
  async getProjectFiles(): Promise<ProjectFileInfo[]> {
    return [...this.projectFiles];
  }
  
  async getProjectFile(id: string): Promise<ProjectFileInfo | undefined> {
    // Recursive search function
    const findFile = (files: ProjectFileInfo[]): ProjectFileInfo | undefined => {
      for (const file of files) {
        if (file.id === id) {
          return file;
        }
        if (file.isFolder && file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findFile(this.projectFiles);
  }
  
  async createProjectFile(fileData: Omit<ProjectFileInfo, 'id' | 'isFolder' | 'children'>): Promise<ProjectFileInfo> {
    const fileId = `file-${Date.now()}`;
    const newFile: ProjectFileInfo = {
      id: fileId,
      name: fileData.name,
      path: fileData.path,
      language: fileData.language,
      isFolder: false,
      content: fileData.content || ''
    };
    
    // Find parent folder and add file
    const pathParts = fileData.path.split('/');
    const folderPath = pathParts.slice(0, -1).join('/') || '/';
    
    // Recursive function to find and add to folder
    const addToFolder = (files: ProjectFileInfo[]): boolean => {
      for (const file of files) {
        if (file.isFolder && file.path === folderPath) {
          if (!file.children) file.children = [];
          file.children.push(newFile);
          return true;
        }
        if (file.isFolder && file.children) {
          if (addToFolder(file.children)) return true;
        }
      }
      return false;
    };
    
    // Try to add to existing folder
    if (!addToFolder(this.projectFiles)) {
      // If folder not found, add to root
      this.projectFiles.push(newFile);
    }
    
    return newFile;
  }
  
  async updateProjectFile(id: string, updates: Partial<ProjectFileInfo>): Promise<ProjectFileInfo | undefined> {
    // Recursive update function
    const updateFile = (files: ProjectFileInfo[]): boolean => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].id === id) {
          files[i] = { ...files[i], ...updates };
          return true;
        }
        if (files[i].isFolder && files[i].children) {
          if (updateFile(files[i].children)) return true;
        }
      }
      return false;
    };
    
    if (updateFile(this.projectFiles)) {
      return this.getProjectFile(id);
    }
    
    return undefined;
  }
  
  async deleteProjectFile(id: string): Promise<boolean> {
    // Recursive delete function
    const deleteFile = (files: ProjectFileInfo[]): boolean => {
      for (let i = 0; i < files.length; i++) {
        if (files[i].id === id) {
          files.splice(i, 1);
          return true;
        }
        if (files[i].isFolder && files[i].children) {
          if (deleteFile(files[i].children)) return true;
        }
      }
      return false;
    };
    
    return deleteFile(this.projectFiles);
  }
}

export const storage = new MemStorage();
