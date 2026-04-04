// Local storage service for persisting data when backend is not configured

const STORAGE_PREFIX = 'meetingmanager_';

// Storage keys - now user-specific
export const getUserStorageKey = (userId: string, type: string) => {
  return `${STORAGE_PREFIX}${userId}_${type}`;
};

// Legacy global storage keys (for migration)
export const STORAGE_KEYS = {
  MEETINGS: `${STORAGE_PREFIX}meetings`,
  ACTION_ITEMS: `${STORAGE_PREFIX}action_items`,
  NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
  PROFILE: `${STORAGE_PREFIX}profile`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  PARTICIPANTS: `${STORAGE_PREFIX}participants`,
};

// Generic get function with type safety
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

// Generic set function
export const setInStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

// Remove from storage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

// Clear all app data
export const clearAllStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get user email from auth storage
const getUserEmail = (userId: string): string => {
  try {
    const users = JSON.parse(localStorage.getItem('meetingmanager_users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    return user?.email || 'user@example.com';
  } catch {
    return 'user@example.com';
  }
};

// Get user name from auth storage
const getUserName = (userId: string): string => {
  try {
    const users = JSON.parse(localStorage.getItem('meetingmanager_users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    return user?.name || 'User';
  } catch {
    return 'User';
  }
};

// Initialize storage with default values if empty - USER SPECIFIC
export const initializeStorage = (userId: string): void => {
  const userMeetingsKey = getUserStorageKey(userId, 'meetings');
  const userActionsKey = getUserStorageKey(userId, 'action_items');
  const userNotificationsKey = getUserStorageKey(userId, 'notifications');
  const userProfileKey = getUserStorageKey(userId, 'profile');
  const userSettingsKey = getUserStorageKey(userId, 'settings');

  // Initialize meetings
  if (!localStorage.getItem(userMeetingsKey)) {
    setInStorage(userMeetingsKey, []);
  }

  // Initialize action items
  if (!localStorage.getItem(userActionsKey)) {
    setInStorage(userActionsKey, []);
  }

  // Initialize notifications
  if (!localStorage.getItem(userNotificationsKey)) {
    setInStorage(userNotificationsKey, []);
  }

  // Initialize profile with user's actual data
  if (!localStorage.getItem(userProfileKey)) {
    setInStorage(userProfileKey, {
      id: userId,
      name: getUserName(userId),
      email: getUserEmail(userId),
      role: 'Team Member',
      department: 'General',
      location: 'Remote',
      bio: '',
      avatar: null,
      join_date: new Date().toISOString().split('T')[0],
    });
  }

  // Initialize settings
  if (!localStorage.getItem(userSettingsKey)) {
    setInStorage(userSettingsKey, {
      user_id: userId,
      theme: 'light',
      compact_mode: false,
      email_notifications: true,
      push_notifications: false,
      slack_notifications: false,
      slack_webhook: null,
      calendar_sync: false,
      google_calendar_connected: false,
      outlook_calendar_connected: false,
    });
  }
};