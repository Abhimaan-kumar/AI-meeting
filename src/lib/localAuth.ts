import { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'meetingmanager_user';
const USERS_KEY = 'meetingmanager_users';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string; // hashed in production, plain for demo
  created_at: string;
}

// Get all registered users
const getUsers = (): StoredUser[] => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch {
    return [];
  }
};

// Save users list
const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Simple hash function for demo purposes
const hashPassword = (password: string): string => {
  // In production, use proper bcrypt or similar
  return btoa(password);
};

// Convert stored user to Supabase User format
const toSupabaseUser = (storedUser: StoredUser): User => {
  return {
    id: storedUser.id,
    email: storedUser.email,
    created_at: storedUser.created_at,
    updated_at: storedUser.created_at,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { name: storedUser.name },
  } as User;
};

// Sign up a new user
export const localSignUp = async (email: string, password: string, name: string): Promise<User> => {
  const users = getUsers();

  // Check if user already exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User with this email already exists');
  }

  // Create new user
  const newUser: StoredUser = {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    name,
    password: hashPassword(password),
    created_at: new Date().toISOString(),
  };

  // Save to users list
  users.push(newUser);
  saveUsers(users);

  // Set as current user
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

  return toSupabaseUser(newUser);
};

// Sign in an existing user
export const localSignIn = async (email: string, password: string): Promise<User> => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.password !== hashPassword(password)) {
    throw new Error('Invalid email or password');
  }

  // Set as current user
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return toSupabaseUser(user);
};

// Sign out current user
export const localSignOut = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
};

// Get current user
export const localGetCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(STORAGE_KEY);
    if (!userJson) return null;

    const storedUser: StoredUser = JSON.parse(userJson);
    return toSupabaseUser(storedUser);
  } catch {
    return null;
  }
};

// Check if user is logged in
export const localIsAuthenticated = (): boolean => {
  return localGetCurrentUser() !== null;
};

// Reset password (demo - just updates password)
export const localResetPassword = async (email: string, newPassword: string): Promise<void> => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex].password = hashPassword(newPassword);
  saveUsers(users);
};

// Update user profile
export const localUpdateProfile = async (userId: string, updates: { name?: string; email?: string }): Promise<void> => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  if (updates.name) users[userIndex].name = updates.name;
  if (updates.email) users[userIndex].email = updates.email.toLowerCase();

  saveUsers(users);

  // Update current user if it's the same one
  const currentUserJson = localStorage.getItem(STORAGE_KEY);
  if (currentUserJson) {
    const currentUser = JSON.parse(currentUserJson);
    if (currentUser.id === userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users[userIndex]));
    }
  }
};