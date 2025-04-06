import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").default("Untitled Session"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  modelConfig: jsonb("model_config").notNull().default({
    model: "gemini-2.0-flash-exp",
    temperature: 0.8
  })
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  name: true,
  modelConfig: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  role: true,
  content: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Summaries
export const chatSummaries = pgTable("chat_summaries", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id),
  content: text("content").notNull(),
  fromTimestamp: timestamp("from_timestamp").notNull(),
  toTimestamp: timestamp("to_timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSummarySchema = createInsertSchema(chatSummaries).pick({
  sessionId: true,
  content: true,
  fromTimestamp: true,
  toTimestamp: true,
});

export type InsertChatSummary = z.infer<typeof insertChatSummarySchema>;
export type ChatSummary = typeof chatSummaries.$inferSelect;

// Project files
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  path: text("path").notNull(),
  content: text("content").notNull(),
  language: text("language").default("plaintext"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).pick({
  userId: true,
  name: true,
  path: true,
  content: true,
  language: true,
});

export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;
export type ProjectFile = typeof projectFiles.$inferSelect;

// LiveKit rooms
export const livekitRooms = pgTable("livekit_rooms", {
  id: serial("id").primaryKey(),
  roomName: text("room_name").notNull().unique(),
  roomSid: text("room_sid").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertLivekitRoomSchema = createInsertSchema(livekitRooms).pick({
  roomName: true,
  roomSid: true,
  userId: true,
  expiresAt: true,
});

export type InsertLivekitRoom = z.infer<typeof insertLivekitRoomSchema>;
export type LivekitRoom = typeof livekitRooms.$inferSelect;

// In-memory models
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type Summary = {
  content: string;
  fromTimestamp: number;
  toTimestamp: number;
};

export type AISession = {
  userId: string;
  sessionId: string;
  history: Message[];
  summaries: Summary[];
  lastActive: number;
  modelConfig: {
    model: string;
    temperature: number;
  };
  features?: {
    webAccess?: boolean;
    thinking?: boolean;
    genkit?: boolean;
    commands?: boolean;
  };
};

export type ProjectFileInfo = {
  id: string;
  name: string;
  path: string;
  language: string;
  isFolder: boolean;
  content?: string;
  children?: ProjectFileInfo[];
};
