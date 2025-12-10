/**
 * NOTE: In a production environment, this file would be replaced by actual Firebase SDK calls.
 * To ensure this application is immediately playable/testable without requiring the user 
 * to create a Firebase project and insert keys, we are using a robust LocalStorage simulation.
 */

import { User, Session } from '../types';

const STORAGE_KEYS = {
  USER: 'wanderai_user',
  SESSIONS: 'wanderai_sessions'
};

// --- Auth Simulation ---

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const login = async (email: string, password?: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would verify the password against the backend
  const user: User = {
    uid: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    displayName: email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
};

export const register = async (email: string, password: string, name: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const user: User = {
    uid: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    displayName: name,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
};

export const logout = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// --- Firestore Simulation ---

export const saveSession = async (session: Omit<Session, 'id'>): Promise<Session> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newSession: Session = {
    ...session,
    id: 'sess_' + Math.random().toString(36).substr(2, 9),
  };

  const existing = getSessions();
  const updated = [newSession, ...existing];
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  
  return newSession;
};

export const getSessions = (): Session[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  const sessions = stored ? JSON.parse(stored) : [];
  // Filter by current user if we were implementing multi-user logic strictly
  // For now, return all local sessions
  return sessions;
};