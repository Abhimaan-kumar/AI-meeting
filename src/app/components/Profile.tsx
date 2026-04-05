import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { userAPI, meetingsAPI, actionItemsAPI, participantsAPI } from "../services/apiWrapper";
import {
  Calendar as CalendarIcon,
  Award,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Edit,
  Edit2,
  Save,
  User,
  Loader2,
  Camera
} from "lucide-react";

export function Profile() {
  const { theme, compactMode } = useTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "",
    department: "",
    joinDate: "",
    bio: ""
  });
  const [profileStats, setProfileStats] = useState({
    meetings: 0,
    actions: 0,
    completionRate: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchProfileStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    console.log('🔍 [Profile] Fetching profile for user:', user.id, user.email);

    try {
      setLoading(true);
      const userData = await userAPI.getProfile(user.id);

      console.log('✅ [Profile] Got user data:', userData);

      setProfile({
        name: userData.name || user.email?.split('@')[0] || '',
        email: userData.email || user.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        role: userData.role || '',
        department: userData.department || '',
        joinDate: new Date(userData.join_date || userData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        bio: userData.bio || ''
      });
    } catch (error) {
      console.error("❌ [Profile] Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStats = async () => {
    if (!user) return;

    console.log('🔍 [Profile] Fetching stats for user:', user.id, user.email);

    try {
      // Fetch all meetings and count user's participation
      const allMeetings = await meetingsAPI.getAll(user.id);
      console.log('📊 [Profile] Found meetings:', allMeetings.length);

      let userMeetingCount = 0;

      for (const meeting of allMeetings) {
        const participants = await participantsAPI.getByMeeting(meeting.id, user.id);
        // Check if user is a participant (by name or email)
        const isParticipant = participants.some((p: any) => 
          p.participant_name?.toLowerCase().includes(user.email?.toLowerCase()) ||
          p.participant_name?.toLowerCase().includes(profile.name?.toLowerCase())
        );
        if (isParticipant) {
          userMeetingCount++;
        }
      }

      console.log('👥 [Profile] User participated in meetings:', userMeetingCount);

      // Fetch all action items
      const allActions = await actionItemsAPI.getAll(user.id);
      console.log('✅ [Profile] Found action items:', allActions.length);

      const completedActions = allActions.filter((a: any) => a.status === 'completed').length;
      const totalActions = allActions.length;
      const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

      setProfileStats({
        meetings: userMeetingCount,
        actions: totalActions,
        completionRate,
      });
    } catch (error) {
      console.error("❌ [Profile] Error fetching profile stats:", error);
      setProfileStats({ meetings: 0, actions: 0, completionRate: 0 });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      await userAPI.updateProfile(user.id, {
        name: profile.name,
        role: profile.role,
        department: profile.department,
        location: profile.location,
        bio: profile.bio,
      });
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data after save
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // Generate avatar initials from name or email
  const getInitials = () => {
    if (profile.name) {
      return profile.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (profile.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className={compactMode ? "space-y-4" : "space-y-6"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          My Profile
        </h1>
        <p className={`${compactMode ? 'text-sm' : 'mt-1'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Manage your account information and preferences
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`glass-card ${compactMode ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden`}
      >
        {/* Cover Image */}
        <div className={`${compactMode ? 'h-24' : 'h-32'} bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 relative`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute ${compactMode ? 'bottom-2 right-2 p-1.5' : 'bottom-4 right-4 p-2'} bg-white/20 backdrop-blur-sm ${compactMode ? 'rounded' : 'rounded-lg'} hover:bg-white/30 transition-colors`}
          >
            <Camera className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </motion.button>
        </div>

        <div className={compactMode ? "px-4 pb-4" : "px-8 pb-8"}>
          {/* Avatar & Edit Button */}
          <div className={`flex items-end justify-between ${compactMode ? '-mt-8 mb-3' : '-mt-12 mb-6'}`}>
            <div className="relative">
              <div className={`${compactMode ? 'w-16 h-16 text-xl' : 'w-24 h-24 text-3xl'} bg-gradient-to-br from-green-400 to-blue-500 ${compactMode ? 'rounded-xl' : 'rounded-2xl'} flex items-center justify-center text-white font-bold shadow-xl ring-4 ${theme === 'dark' ? 'ring-gray-800' : 'ring-white'}`}>
                {getInitials()}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`absolute bottom-0 right-0 ${compactMode ? 'p-1' : 'p-1.5'} bg-gradient-to-br from-blue-500 to-purple-600 ${compactMode ? 'rounded' : 'rounded-lg'} shadow-lg`}
              >
                <Camera className={`${compactMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
              </motion.button>
            </div>

            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className={`${compactMode ? 'px-3 py-1.5 text-sm' : 'px-5 py-2'} ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900'} text-white ${compactMode ? 'rounded-lg' : 'rounded-full'} font-semibold hover:shadow-lg transition-all`}
              >
                <Edit2 className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} inline mr-2`} />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className={`${compactMode ? 'px-3 py-1.5 text-sm rounded-lg' : 'px-4 py-2 rounded-full'} font-semibold ${
                    theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className={`${compactMode ? 'px-3 py-1.5 text-sm rounded-lg' : 'px-4 py-2 rounded-full'} ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-900'} text-white font-semibold hover:shadow-lg`}
                >
                  <Save className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} inline mr-2`} />
                  Save Changes
                </motion.button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className={compactMode ? "space-y-3" : "space-y-6"}>
            {/* Name & Title */}
            <div>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder=""
                    className={`${compactMode ? 'text-lg' : 'text-2xl'} font-bold mb-2 w-full ${compactMode ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg'} ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border`}
                  />
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({...profile, role: e.target.value})}
                    placeholder=""
                    className={`${compactMode ? 'text-sm mb-1' : 'mb-2'} w-full ${compactMode ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg'} ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border`}
                  />
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                    placeholder=""
                    className={`${compactMode ? 'text-sm mb-1' : 'mb-2'} w-full ${compactMode ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg'} ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border`}
                  />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      placeholder=""
                      className={`${compactMode ? 'text-sm' : ''} flex-1 ${compactMode ? 'px-2 py-1 rounded' : 'px-3 py-2 rounded-lg'} ${
                        theme === 'dark' 
                          ? 'bg-gray-800 text-white border-gray-700' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className={`${compactMode ? 'text-lg' : 'text-2xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile.name || 'No name set'}
                  </h2>
                  {(profile.role || profile.department) && (
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {profile.role}{profile.role && profile.department && ' • '}{profile.department}
                    </p>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {profile.location}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bio */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Bio
              </h3>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder=""
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white border-gray-700' 
                      : 'bg-white text-gray-900 border-gray-200'
                  } border`}
                />
              ) : (
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  {profile.bio || 'No bio added yet'}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    placeholder=""
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border`}
                  />
                ) : (
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                    {profile.email || 'No email set'}
                  </p>
                )}
              </div>

              <div>
                <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    placeholder=""
                    className={`w-full px-3 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border`}
                  />
                ) : (
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                    {profile.phone || 'No phone set'}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profileStats.meetings}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Meetings
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profileStats.actions}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Actions
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profileStats.completionRate}%
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}