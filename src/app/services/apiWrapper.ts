import { isSupabaseConfigured } from '../../lib/supabase';
import * as supabaseAPI from './api';
import * as localStorage from './localAPI';
import { localGetCurrentUser } from '../../lib/localAuth';

// Helper to get user ID (demo user for local mode)
const getUserId = () => {
  if (!useLocalStorage) {
    // For Supabase mode, the user ID should be passed from components
    return '';
  }
  // For local mode, get the current user from localStorage
  const localUser = localGetCurrentUser();
  return localUser?.id || 'demo-user-id';
};

// Detect if we should use local storage or Supabase
const useLocalStorage = !isSupabaseConfigured();

// ==================== MEETINGS ====================

export const meetingsAPI = {
  async getAll(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localMeetingsAPI.getAll(userId));
    }
    return supabaseAPI.meetingsAPI.getAll(userId);
  },

  async getById(id: string, userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localMeetingsAPI.getById(id, userId));
    }
    return supabaseAPI.meetingsAPI.getById(id, userId);
  },

  async create(meeting: any, participants: string[]) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localMeetingsAPI.create(meeting, participants));
    }
    return supabaseAPI.meetingsAPI.create(meeting, participants);
  },

  async update(id: string, meeting: any, userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localMeetingsAPI.update(id, meeting, userId));
    }
    return supabaseAPI.meetingsAPI.update(id, meeting, userId);
  },

  async delete(id: string, userId: string) {
    if (useLocalStorage) {
      localStorage.localMeetingsAPI.delete(id, userId);
      return Promise.resolve();
    }
    return supabaseAPI.meetingsAPI.delete(id, userId);
  },

  async search(query: string, userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localMeetingsAPI.search(query, userId));
    }
    return supabaseAPI.meetingsAPI.search(query, userId);
  },
};

// ==================== ACTION ITEMS ====================

export const actionItemsAPI = {
  async getAll(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localActionItemsAPI.getAll(userId));
    }
    return supabaseAPI.actionItemsAPI.getAll(userId);
  },

  async getByMeeting(meetingId: string, userId: string) {
    if (useLocalStorage) {
      const items = localStorage.localActionItemsAPI.getAll(userId);
      return Promise.resolve(items.filter(item => item.meeting_id === meetingId));
    }
    return supabaseAPI.actionItemsAPI.getByMeeting(meetingId, userId);
  },

  async create(actionItem: any) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localActionItemsAPI.create(actionItem));
    }
    return supabaseAPI.actionItemsAPI.create(actionItem);
  },

  async update(id: string, actionItem: any, userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localActionItemsAPI.update(id, actionItem, userId));
    }
    return supabaseAPI.actionItemsAPI.update(id, actionItem, userId);
  },

  async updateStatus(id: string, status: any, userId: string) {
    if (useLocalStorage) {
      const progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
      return Promise.resolve(localStorage.localActionItemsAPI.update(id, { status, progress }, userId));
    }
    return supabaseAPI.actionItemsAPI.updateStatus(id, status, userId);
  },

  async delete(id: string, userId: string) {
    if (useLocalStorage) {
      localStorage.localActionItemsAPI.delete(id, userId);
      return Promise.resolve();
    }
    return supabaseAPI.actionItemsAPI.delete(id, userId);
  },

  async getStats(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localActionItemsAPI.getStats(userId));
    }
    return supabaseAPI.actionItemsAPI.getStats(userId);
  },
};

// ==================== NOTIFICATIONS ====================

export const notificationsAPI = {
  async getAll(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localNotificationsAPI.getAll(userId));
    }
    return supabaseAPI.notificationsAPI.getAll(userId);
  },

  async getUnreadCount(userId: string) {
    if (useLocalStorage) {
      const unread = localStorage.localNotificationsAPI.getUnread(userId);
      return Promise.resolve(unread.length);
    }
    return supabaseAPI.notificationsAPI.getUnreadCount(userId);
  },

  async markAsRead(id: string, userId: string) {
    if (useLocalStorage) {
      localStorage.localNotificationsAPI.markAsRead(id, userId);
      return Promise.resolve();
    }
    return supabaseAPI.notificationsAPI.markAsRead(id, userId);
  },

  async markAllAsRead(userId: string) {
    if (useLocalStorage) {
      localStorage.localNotificationsAPI.markAllAsRead(userId);
      return Promise.resolve();
    }
    return supabaseAPI.notificationsAPI.markAllAsRead(userId);
  },

  async delete(id: string, userId: string) {
    if (useLocalStorage) {
      localStorage.localNotificationsAPI.delete(id, userId);
      return Promise.resolve();
    }
    return supabaseAPI.notificationsAPI.delete(id, userId);
  },

  async create(notification: any) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localNotificationsAPI.create(notification));
    }
    return supabaseAPI.notificationsAPI.create(notification);
  },
};

// ==================== USER PROFILE ====================

export const userAPI = {
  async getProfile(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localUserAPI.get(userId));
    }
    return supabaseAPI.userAPI.getProfile(userId);
  },

  async updateProfile(userId: string, profile: any) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localUserAPI.update(userId, profile));
    }
    return supabaseAPI.userAPI.updateProfile(userId, profile);
  },

  async uploadAvatar(userId: string, file: File) {
    if (useLocalStorage) {
      const url = await localStorage.localUserAPI.uploadAvatar(userId, file);
      return Promise.resolve({ avatar: url });
    }
    return supabaseAPI.userAPI.uploadAvatar(userId, file);
  },
};

// ==================== USER SETTINGS ====================

export const settingsAPI = {
  async get(userId: string) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localSettingsAPI.get(userId));
    }
    return supabaseAPI.settingsAPI.get(userId);
  },

  async update(userId: string, settings: any) {
    if (useLocalStorage) {
      return Promise.resolve(localStorage.localSettingsAPI.update(userId, settings));
    }
    return supabaseAPI.settingsAPI.update(userId, settings);
  },
};

// ==================== PARTICIPANTS ====================

export const participantsAPI = {
  async getAll(userId: string) {
    if (useLocalStorage) {
      // Get all unique participants from meetings
      const meetings = localStorage.localMeetingsAPI.getAll(userId);
      const participantsMap = new Map();
      
      meetings.forEach((meeting: any) => {
        const participants = meeting.participants || [];
        participants.forEach((p: any) => {
          if (!participantsMap.has(p.participant_name)) {
            participantsMap.set(p.participant_name, {
              name: p.participant_name,
              email: p.participant_email,
              role: p.role || 'Team Member',
              meetings: 0,
            });
          }
          const participant = participantsMap.get(p.participant_name);
          participant.meetings += 1;
        });
      });
      
      return Promise.resolve(Array.from(participantsMap.values()));
    }
    return supabaseAPI.participantsAPI.getAll(userId);
  },
};

// ==================== ANALYTICS ====================

export const analyticsAPI = {
  async getMeetingStats(userId: string) {
    if (useLocalStorage) {
      const meetings = localStorage.localMeetingsAPI.getAll(userId);
      return Promise.resolve({
        total: meetings.length,
        completed: meetings.filter(m => m.status === 'completed').length,
        scheduled: meetings.filter(m => m.status === 'scheduled').length,
        inProgress: meetings.filter(m => m.status === 'in-progress').length,
      });
    }
    return supabaseAPI.analyticsAPI.getMeetingStats(userId);
  },

  async getActionItemStats(userId: string) {
    return actionItemsAPI.getStats(userId);
  },

  async getMeetingTrends(userId?: string) {
    const uid = userId || getUserId();
    if (useLocalStorage) {
      const meetings = localStorage.localMeetingsAPI.getAll(uid);
      const monthCounts: Record<string, number> = {};

      meetings.forEach(m => {
        const month = m.date.slice(0, 7);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      return Promise.resolve(
        Object.entries(monthCounts)
          .map(([month, total_meetings]) => ({ month, total_meetings }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6) // Last 6 months
      );
    }
    return supabaseAPI.analyticsAPI.getMeetingTrends(uid);
  },

  async getActionsByStatus(userId?: string) {
    const uid = userId || getUserId();
    const stats = await actionItemsAPI.getStats(uid);
    return Promise.resolve({
      completed: stats.completed,
      in_progress: stats.in_progress,
      todo: stats.todo,
    });
  },

  async getMeetingDuration(userId?: string) {
    const uid = userId || getUserId();
    if (useLocalStorage) {
      const meetings = localStorage.localMeetingsAPI.getAll(uid);
      const durations: Record<string, number> = {
        '0-30': 0,
        '30-60': 0,
        '60-90': 0,
        '90+': 0,
      };

      meetings.forEach(m => {
        const duration = parseInt(m.duration) || 0;
        if (duration <= 30) durations['0-30']++;
        else if (duration <= 60) durations['30-60']++;
        else if (duration <= 90) durations['60-90']++;
        else durations['90+']++;
      });

      return Promise.resolve(durations);
    }
    
    // For Supabase, implement similar logic
    const meetings = await meetingsAPI.getAll(uid);
    const durations: Record<string, number> = {
      '0-30': 0,
      '30-60': 0,
      '60-90': 0,
      '90+': 0,
    };

    meetings.forEach((m: any) => {
      const duration = parseInt(m.duration) || 0;
      if (duration <= 30) durations['0-30']++;
      else if (duration <= 60) durations['30-60']++;
      else if (duration <= 90) durations['60-90']++;
      else durations['90+']++;
    });

    return durations;
  },

  async getParticipantEngagement(userId?: string) {
    const uid = userId || getUserId();
    if (useLocalStorage) {
      const meetings = localStorage.localMeetingsAPI.getAll(uid);
      const participantCounts = new Map();

      meetings.forEach(meeting => {
        const participants = meeting.participants || [];
        participants.forEach((p: any) => {
          const name = p.participant_name;
          if (!participantCounts.has(name)) {
            participantCounts.set(name, { participant_name: name, meeting_count: 0 });
          }
          participantCounts.get(name).meeting_count++;
        });
      });

      return Promise.resolve(
        Array.from(participantCounts.values())
          .sort((a, b) => b.meeting_count - a.meeting_count)
      );
    }

    // For Supabase
    const participants = await participantsAPI.getAll(uid);
    return participants.map((p: any) => ({
      participant_name: p.name,
      meeting_count: p.meetings,
    })).sort((a, b) => b.meeting_count - a.meeting_count);
  },
};

// ==================== EXPORT ====================

export const exportAPI = {
  async exportMeetings(userId: string, format: 'csv' | 'json' = 'csv') {
    if (useLocalStorage) {
      if (format === 'json') {
        return Promise.resolve(localStorage.localExportAPI.exportMeetingsJSON(userId));
      }
      return Promise.resolve(localStorage.localExportAPI.exportMeetingsCSV(userId));
    }
    return supabaseAPI.exportAPI.exportMeetings(userId, format);
  },

  async exportActionItems(userId: string, format: 'csv' | 'json' = 'csv') {
    if (useLocalStorage) {
      if (format === 'json') {
        return Promise.resolve(localStorage.localExportAPI.exportActionItemsJSON(userId));
      }
      return Promise.resolve(localStorage.localExportAPI.exportActionItemsCSV(userId));
    }
    return supabaseAPI.exportAPI.exportActionItems(userId, format);
  },

  downloadFile(content: string, filename: string, mimeType: string) {
    if (useLocalStorage) {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }
    return supabaseAPI.exportAPI.downloadFile(content, filename, mimeType);
  },
};

// Helper to get current user ID
export const getCurrentUserId = () => getUserId();

// Export flag for whether we're using local storage
export const isUsingLocalStorage = useLocalStorage;