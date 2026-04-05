// Local storage-based API for when backend is not configured
import { getFromStorage, setInStorage, getUserStorageKey, generateId, initializeStorage } from '../../lib/localStorage';

// Types matching the database schema
interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  summary: string | null;
  transcript: string | null;
  location: string | null;
  recording_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  participants?: MeetingParticipant[];
}

interface MeetingParticipant {
  id: string;
  meeting_id: string;
  participant_name: string;
  participant_email: string | null;
  role: string | null;
  created_at: string;
}

interface ActionItem {
  id: string;
  meeting_id: string | null;
  title: string;
  description: string | null;
  assignee: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in_progress' | 'todo';
  progress: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: 'action' | 'meeting' | 'mention' | 'alert' | 'info';
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string | null;
  department: string | null;
  avatar: string | null;
  location: string | null;
  bio: string | null;
  join_date: string;
}

interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark';
  compact_mode: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  slack_notifications: boolean;
  slack_webhook: string | null;
  calendar_sync: boolean;
  google_calendar_connected: boolean;
  outlook_calendar_connected: boolean;
}

// Initialize storage for a user
export const initializeUserStorage = (userId: string) => {
  initializeStorage(userId);
};

// ==================== MEETINGS ====================

export const localMeetingsAPI = {
  getAll(userId: string): Meeting[] {
    const meetings = getFromStorage<Meeting[]>(getUserStorageKey(userId, 'meetings'), []);
    return meetings.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      return dateCompare !== 0 ? dateCompare : b.time.localeCompare(a.time);
    });
  },

  getById(id: string, userId: string): Meeting | null {
    const meetings = getFromStorage<Meeting[]>(getUserStorageKey(userId, 'meetings'), []);
    const meeting = meetings.find(m => m.id === id);

    if (meeting) {
      // Get participants
      const participants = getFromStorage<MeetingParticipant[]>(getUserStorageKey(userId, 'participants'), [])
        .filter(p => p.meeting_id === id);
      return { ...meeting, participants };
    }
    return null;
  },

  create(meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>, participants: string[]): Meeting {
    const meetings = getFromStorage<Meeting[]>(getUserStorageKey(meeting.user_id, 'meetings'), []);
    const now = new Date().toISOString();

    const newMeeting: Meeting = {
      ...meeting,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };

    meetings.push(newMeeting);
    setInStorage(getUserStorageKey(meeting.user_id, 'meetings'), meetings);

    // Add participants
    if (participants.length > 0) {
      const participantRecords = getFromStorage<MeetingParticipant[]>(getUserStorageKey(meeting.user_id, 'participants'), []);
      participants.forEach(name => {
        participantRecords.push({
          id: generateId(),
          meeting_id: newMeeting.id,
          participant_name: name,
          participant_email: null,
          role: null,
          created_at: now,
        });
      });
      setInStorage(getUserStorageKey(meeting.user_id, 'participants'), participantRecords);
    }

    return newMeeting;
  },

  update(id: string, updates: Partial<Meeting>, userId: string): Meeting | null {
    const meetings = getFromStorage<Meeting[]>(getUserStorageKey(userId, 'meetings'), []);
    const index = meetings.findIndex(m => m.id === id);

    if (index === -1) return null;

    meetings[index] = {
      ...meetings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setInStorage(getUserStorageKey(userId, 'meetings'), meetings);
    return meetings[index];
  },

  delete(id: string, userId: string): boolean {
    const meetings = getFromStorage<Meeting[]>(getUserStorageKey(userId, 'meetings'), []);
    const filtered = meetings.filter(m => m.id !== id);

    if (filtered.length === meetings.length) return false;

    setInStorage(getUserStorageKey(userId, 'meetings'), filtered);

    // Delete associated participants
    const participants = getFromStorage<MeetingParticipant[]>(getUserStorageKey(userId, 'participants'), []);
    setInStorage(getUserStorageKey(userId, 'participants'), participants.filter(p => p.meeting_id !== id));

    // Delete associated action items
    const actionItems = getFromStorage<ActionItem[]>(getUserStorageKey(userId, 'action_items'), []);
    setInStorage(getUserStorageKey(userId, 'action_items'), actionItems.filter(a => a.meeting_id !== id));

    return true;
  },

  search(query: string, userId: string): Meeting[] {
    const meetings = this.getAll(userId);
    const lowerQuery = query.toLowerCase();

    return meetings.filter(m =>
      m.title.toLowerCase().includes(lowerQuery) ||
      m.summary?.toLowerCase().includes(lowerQuery) ||
      m.location?.toLowerCase().includes(lowerQuery)
    );
  },
};

// ==================== ACTION ITEMS ====================

export const localActionItemsAPI = {
  getAll(userId: string): ActionItem[] {
    const items = getFromStorage<ActionItem[]>(getUserStorageKey(userId, 'action_items'), []);
    return items.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  },

  getById(id: string, userId: string): ActionItem | null {
    const items = getFromStorage<ActionItem[]>(getUserStorageKey(userId, 'action_items'), []);
    return items.find(item => item.id === id && item.user_id === userId) || null;
  },

  create(actionItem: Omit<ActionItem, 'id' | 'created_at' | 'updated_at'>): ActionItem {
    const items = getFromStorage<ActionItem[]>(getUserStorageKey(actionItem.user_id, 'action_items'), []);
    const now = new Date().toISOString();

    const newItem: ActionItem = {
      ...actionItem,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };

    items.push(newItem);
    setInStorage(getUserStorageKey(actionItem.user_id, 'action_items'), items);
    return newItem;
  },

  update(id: string, updates: Partial<ActionItem>, userId: string): ActionItem | null {
    const items = getFromStorage<ActionItem[]>(getUserStorageKey(userId, 'action_items'), []);
    const index = items.findIndex(item => item.id === id && item.user_id === userId);

    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setInStorage(getUserStorageKey(userId, 'action_items'), items);
    return items[index];
  },

  delete(id: string, userId: string): boolean {
    const items = getFromStorage<ActionItem[]>(getUserStorageKey(userId, 'action_items'), []);
    const filtered = items.filter(item => !(item.id === id && item.user_id === userId));

    if (filtered.length === items.length) return false;

    setInStorage(getUserStorageKey(userId, 'action_items'), filtered);
    return true;
  },

  getStats(userId: string) {
    const items = this.getAll(userId);
    return {
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      in_progress: items.filter(i => i.status === 'in_progress').length,
      todo: items.filter(i => i.status === 'todo').length,
      high_priority: items.filter(i => i.priority === 'high').length,
    };
  },
};

// ==================== NOTIFICATIONS ====================

export const localNotificationsAPI = {
  getAll(userId: string): Notification[] {
    const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getUnread(userId: string): Notification[] {
    return this.getAll(userId).filter(n => !n.is_read);
  },

  create(notification: Omit<Notification, 'id' | 'created_at'>): Notification {
    const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);

    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    notifications.push(newNotification);
    setInStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },

  markAsRead(id: string, userId: string): boolean {
    const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const index = notifications.findIndex(n => n.id === id && n.user_id === userId);

    if (index === -1) return false;

    notifications[index].is_read = true;
    setInStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return true;
  },

  markAllAsRead(userId: string): void {
    const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.forEach(n => {
      if (n.user_id === userId) {
        n.is_read = true;
      }
    });
    setInStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  delete(id: string, userId: string): boolean {
    const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const filtered = notifications.filter(n => !(n.id === id && n.user_id === userId));

    if (filtered.length === notifications.length) return false;

    setInStorage(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return true;
  },
};

// ==================== USER PROFILE ====================

export const localUserAPI = {
  get(userId: string): UserProfile {
    const profile = getFromStorage<UserProfile>(getUserStorageKey(userId, 'profile'), {
      id: userId,
      email: 'user@example.com',
      name: 'User',
      role: 'Team Member',
      department: 'General',
      avatar: null,
      location: 'Remote',
      bio: '',
      join_date: new Date().toISOString().split('T')[0],
    });

    // Ensure the profile has the correct user ID
    if (profile.id !== userId) {
      profile.id = userId;
      setInStorage(getUserStorageKey(userId, 'profile'), profile);
    }

    return profile;
  },

  update(userId: string, updates: Partial<UserProfile>): UserProfile {
    const profile = this.get(userId);
    const updated = { ...profile, ...updates, id: userId };
    setInStorage(getUserStorageKey(userId, 'profile'), updated);
    return updated;
  },

  uploadAvatar(userId: string, file: File): Promise<string> {
    // For local storage, convert file to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const profile = this.get(userId);
        profile.avatar = dataUrl;
        setInStorage(getUserStorageKey(userId, 'profile'), profile);
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

// ==================== SETTINGS ====================

export const localSettingsAPI = {
  get(userId: string): UserSettings {
    const settings = getFromStorage<UserSettings>(getUserStorageKey(userId, 'settings'), {
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

    // Ensure settings have the correct user ID
    if (settings.user_id !== userId) {
      settings.user_id = userId;
      setInStorage(getUserStorageKey(userId, 'settings'), settings);
    }

    return settings;
  },

  update(userId: string, updates: Partial<UserSettings>): UserSettings {
    const settings = this.get(userId);
    const updated = { ...settings, ...updates, user_id: userId };
    setInStorage(getUserStorageKey(userId, 'settings'), updated);
    return updated;
  },
};

// ==================== ANALYTICS ====================

export const localAnalyticsAPI = {
  getStats(userId: string) {
    const meetings = localMeetingsAPI.getAll(userId);
    const actionItems = localActionItemsAPI.getAll(userId);
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);

    return {
      total_meetings: meetings.length,
      completed_meetings: meetings.filter(m => m.status === 'completed').length,
      scheduled_meetings: meetings.filter(m => m.status === 'scheduled').length,
      in_progress_meetings: meetings.filter(m => m.status === 'in-progress').length,
      this_month_meetings: meetings.filter(m => m.date.startsWith(thisMonth)).length,
      total_action_items: actionItems.length,
      completed_action_items: actionItems.filter(a => a.status === 'completed').length,
      pending_action_items: actionItems.filter(a => a.status !== 'completed').length,
      overdue_action_items: actionItems.filter(a =>
        a.status !== 'completed' && new Date(a.due_date) < now
      ).length,
    };
  },

  getMeetingTrends(userId: string) {
    const meetings = localMeetingsAPI.getAll(userId);
    const monthCounts: Record<string, number> = {};

    meetings.forEach(m => {
      const month = m.date.slice(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },
};

// ==================== EXPORT ====================

export const localExportAPI = {
  exportMeetingsCSV(userId: string): string {
    const meetings = localMeetingsAPI.getAll(userId);

    const headers = ['Title', 'Date', 'Time', 'Duration', 'Status', 'Location', 'Summary'];
    const rows = meetings.map(m => [
      m.title,
      m.date,
      m.time,
      m.duration,
      m.status,
      m.location || '',
      m.summary || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  exportMeetingsJSON(userId: string): string {
    const meetings = localMeetingsAPI.getAll(userId);
    return JSON.stringify(meetings, null, 2);
  },

  exportActionItemsCSV(userId: string): string {
    const items = localActionItemsAPI.getAll(userId);

    const headers = ['Title', 'Assignee', 'Due Date', 'Priority', 'Status', 'Progress', 'Description'];
    const rows = items.map(item => [
      item.title,
      item.assignee,
      item.due_date,
      item.priority,
      item.status,
      `${item.progress}%`,
      item.description || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  exportActionItemsJSON(userId: string): string {
    const items = localActionItemsAPI.getAll(userId);
    return JSON.stringify(items, null, 2);
  },
};