import { supabase, Database } from '../../lib/supabase';

// Type aliases for convenience
type Meeting = Database['public']['Tables']['meetings']['Row'];
type MeetingInsert = Database['public']['Tables']['meetings']['Insert'];
type ActionItem = Database['public']['Tables']['action_items']['Row'];
type ActionItemInsert = Database['public']['Tables']['action_items']['Insert'];
type Notification = Database['public']['Tables']['notifications']['Row'];
type UserSettings = Database['public']['Tables']['user_settings']['Row'];

// ==================== AUTHENTICATION ====================

export const authAPI = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        join_date: new Date().toISOString().split('T')[0],
      });

      // Create default user settings
      await supabase.from('user_settings').insert({
        user_id: data.user.id,
        theme: 'light',
        compact_mode: true,
        email_notifications: true,
        push_notifications: false,
        slack_notifications: false,
        calendar_sync: false,
        google_calendar_connected: false,
        outlook_calendar_connected: false,
      });
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};

// ==================== MEETINGS ====================

export const meetingsAPI = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*, meeting_participants(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*, meeting_participants(*), action_items(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(meeting: MeetingInsert, participants: string[]) {
    const { data: meetingData, error: meetingError } = await supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Add participants
    if (participants.length > 0 && meetingData) {
      const participantRecords = participants.map(name => ({
        meeting_id: meetingData.id,
        participant_name: name,
        participant_email: null,
        role: null,
      }));

      const { error: participantError } = await supabase
        .from('meeting_participants')
        .insert(participantRecords);

      if (participantError) throw participantError;
    }

    return meetingData;
  },

  async update(id: string, meeting: Partial<Meeting>, userId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .update({ ...meeting, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string) {
    // Delete related records first
    await supabase.from('meeting_participants').delete().eq('meeting_id', id);
    await supabase.from('action_items').delete().eq('meeting_id', id);

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async search(query: string, userId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ==================== ACTION ITEMS ====================

export const actionItemsAPI = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .select('*, meetings(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByMeeting(meetingId: string, userId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(actionItem: ActionItemInsert) {
    const { data, error } = await supabase
      .from('action_items')
      .insert(actionItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, actionItem: Partial<ActionItem>, userId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .update({ ...actionItem, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: ActionItem['status'], userId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .update({
        status,
        updated_at: new Date().toISOString(),
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('action_items')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      completed: data?.filter(item => item.status === 'completed').length || 0,
      in_progress: data?.filter(item => item.status === 'in_progress').length || 0,
      todo: data?.filter(item => item.status === 'todo').length || 0,
    };

    return stats;
  },
};

// ==================== NOTIFICATIONS ====================

export const notificationsAPI = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  async markAsRead(id: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async create(notification: Database['public']['Tables']['notifications']['Insert']) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== USER PROFILE ====================

export const userAPI = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<Database['public']['Tables']['users']['Update']>) {
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user profile with new avatar URL
    const { data, error } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== USER SETTINGS ====================

export const settingsAPI = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, settings: Partial<UserSettings>) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== PARTICIPANTS ====================

export const participantsAPI = {
  async getAll(userId: string) {
    // Get all unique participants from meetings owned by this user
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, meeting_participants(*)')
      .eq('user_id', userId);

    if (error) throw error;

    // Flatten and deduplicate participants
    const participantsArray: any[] = [];
    meetings?.forEach((meeting: any) => {
      meeting.meeting_participants?.forEach((p: any) => {
        participantsArray.push(p);
      });
    });

    return participantsArray;
  },

  async getByMeeting(meetingId: string, userId: string) {
    // First verify the meeting belongs to this user
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id')
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single();

    if (meetingError || !meeting) {
      return []; // Meeting doesn't exist or doesn't belong to user
    }

    // Get participants for this meeting
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId);

    if (error) throw error;
    return data || [];
  },
};

// ==================== ANALYTICS ====================

export const analyticsAPI = {
  async getMeetingStats(userId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('status, date')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      completed: data?.filter(m => m.status === 'completed').length || 0,
      scheduled: data?.filter(m => m.status === 'scheduled').length || 0,
      inProgress: data?.filter(m => m.status === 'in-progress').length || 0,
    };

    return stats;
  },

  async getActionItemStats(userId: string) {
    return actionItemsAPI.getStats(userId);
  },

  async getMeetingTrends(userId: string, months: number = 6) {
    const { data, error } = await supabase
      .from('meetings')
      .select('date')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData = new Map();
    data?.forEach((meeting: any) => {
      const month = meeting.date.substring(0, 7); // YYYY-MM
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries()).map(([month, count]) => ({
      month,
      meetings: count,
    }));
  },
};

// ==================== EXPORT ====================

export const exportAPI = {
  async exportMeetings(userId: string, format: 'csv' | 'json' = 'csv') {
    const meetings = await meetingsAPI.getAll(userId);

    if (format === 'json') {
      return JSON.stringify(meetings, null, 2);
    }

    // CSV format
    const headers = ['Title', 'Date', 'Time', 'Duration', 'Status', 'Location', 'Summary'];
    const rows = meetings.map(m => [
      m.title,
      m.date,
      m.time,
      m.duration,
      m.status,
      m.location || '',
      (m.summary || '').replace(/,/g, ';'), // Replace commas to avoid CSV issues
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  },

  async exportActionItems(userId: string, format: 'csv' | 'json' = 'csv') {
    const actions = await actionItemsAPI.getAll(userId);

    if (format === 'json') {
      return JSON.stringify(actions, null, 2);
    }

    // CSV format
    const headers = ['Title', 'Description', 'Assignee', 'Due Date', 'Priority', 'Status', 'Progress'];
    const rows = actions.map(a => [
      a.title,
      (a.description || '').replace(/,/g, ';'),
      a.assignee,
      a.due_date,
      a.priority,
      a.status,
      a.progress,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  },

  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};