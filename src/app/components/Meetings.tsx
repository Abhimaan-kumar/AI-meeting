import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { 
  Video, 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckSquare,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  Download,
  CheckCircle2
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { meetingsAPI, participantsAPI } from "../services/apiWrapper";

export function Meetings() {
  const { theme, compactMode } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    thisWeek: 0,
    totalHours: 0,
    participants: 0,
  });
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "",
    time: "",
    duration: "30",
    participants: "",
    tags: "",
  });

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await meetingsAPI.getAll(user.id);

      // Fetch participants for each meeting
      const meetingsWithParticipants = await Promise.all(
        data.map(async (meeting: any) => {
          const participants = await participantsAPI.getByMeeting(meeting.id, user.id);
          return {
            ...meeting,
            participants: participants.map((p: any) => ({
              name: p.participant_name,
              avatar: p.participant_name.split(' ').map((n: string) => n[0]).join(''),
              color: `bg-${['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)]}-500`,
            })),
            actions: 0,
            completed: 0,
            tags: [],
          };
        })
      );

      setMeetings(meetingsWithParticipants);

      // Calculate stats from actual data
      const totalMeetings = meetingsWithParticipants.length;
      const uniqueParticipants = new Set();
      let totalMinutes = 0;
      let thisWeekCount = 0;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      meetingsWithParticipants.forEach((meeting: any) => {
        // Count participants
        meeting.participants.forEach((p: any) => uniqueParticipants.add(p.name));

        // Calculate total hours
        const durationMatch = meeting.duration?.match(/(\d+)/);
        if (durationMatch) {
          totalMinutes += parseInt(durationMatch[1]);
        }

        // Count this week's meetings
        const meetingDate = new Date(meeting.date);
        if (meetingDate >= oneWeekAgo && meetingDate <= now) {
          thisWeekCount++;
        }
      });

      setStats({
        totalMeetings,
        thisWeek: thisWeekCount,
        totalHours: parseFloat((totalMinutes / 60).toFixed(1)),
        participants: uniqueParticipants.size,
      });
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
      setStats({ totalMeetings: 0, thisWeek: 0, totalHours: 0, participants: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      await meetingsAPI.create({
        title: newMeeting.title,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: `${newMeeting.duration} min`,
        status: 'scheduled',
        summary: null,
        transcript: null,
        location: null,
        recording_url: null,
      });

      setShowNewMeetingModal(false);
      setNewMeeting({
        title: "",
        date: "",
        time: "",
        duration: "30",
        participants: "",
        tags: "",
      });

      fetchMeetings();
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  return (
    <div className={compactMode ? "space-y-4" : "space-y-6"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Meetings
          </h1>
          <p className={`${compactMode ? 'text-sm' : 'text-base'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage and review your meeting history
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewMeetingModal(true)}
          className={`${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} bg-gradient-to-r from-blue-500 to-purple-600 text-white ${compactMode ? 'rounded-lg' : 'rounded-xl'} shadow-md hover:shadow-lg transition-all flex items-center gap-2`}
        >
          <Plus className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
          New Meeting
        </motion.button>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Meetings</p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalMeetings}</p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>This Week</p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.thisWeek}</p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Hours</p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalHours}</p>
          </div>
          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Participants</p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.participants}</p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${
                  theme === 'dark' ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilterOpen(!filterOpen)}
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2 text-sm`}
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-xl z-10`}
                >
                  <div className="p-2">
                    {['all', 'today', 'this-week', 'this-month'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setSelectedFilter(filter);
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedFilter === filter
                            ? 'bg-blue-500 text-white'
                            : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-2 text-sm`}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* Meetings List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Video className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No meetings yet
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Get started by creating your first meeting
            </p>
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Meeting
            </button>
          </div>
        ) :
          meetings.map((meeting, index) => (
          <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="glass-card rounded-xl p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Left Section */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {meeting.title}
                    </h3>
                    <div className={`flex items-center gap-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex-wrap`}>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meeting.time} • {meeting.duration}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {meeting.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                  {/* Participants */}
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {meeting.participants.slice(0, 3).map((participant, idx) => (
                        <div
                          key={idx}
                          className={`w-7 h-7 rounded-full ${participant.color} flex items-center justify-center text-white text-xs font-bold border-2 ${
                            theme === 'dark' ? 'border-gray-800' : 'border-white'
                          }`}
                          title={participant.name}
                        >
                          {participant.avatar}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Progress */}
                  <div className={`px-3 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.completed}/{meeting.actions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))
        }
      </motion.div>

      {/* New Meeting Modal */}
      <AnimatePresence>
        {showNewMeetingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewMeetingModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl ${compactMode ? 'p-5' : 'p-6'} w-full max-w-2xl shadow-2xl`}
            >
              <h2 className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold ${compactMode ? 'mb-3' : 'mb-4'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Create New Meeting
              </h2>
              
              <div className={compactMode ? "space-y-3" : "space-y-4"}>
                <div>
                  <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="e.g., Product Roadmap Review"
                    className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Time *
                    </label>
                    <input
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                      className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Duration (minutes)
                  </label>
                  <select
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                    className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-300'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Participants (comma-separated emails)
                  </label>
                  <input
                    type="text"
                    value={newMeeting.participants}
                    onChange={(e) => setNewMeeting({ ...newMeeting, participants: e.target.value })}
                    placeholder="john@example.com, sarah@example.com"
                    className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block ${compactMode ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newMeeting.tags}
                    onChange={(e) => setNewMeeting({ ...newMeeting, tags: e.target.value })}
                    placeholder="Product, Planning, Quarterly"
                    className={`w-full ${compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 ${compactMode ? 'mt-4' : 'mt-6'}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className={`${compactMode ? 'px-4 py-1.5 text-sm' : 'px-5 py-2'} ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } rounded-lg font-semibold transition-colors`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleCreateMeeting}
                  disabled={!newMeeting.title || !newMeeting.date || !newMeeting.time}
                  className={`${compactMode ? 'px-4 py-1.5 text-sm' : 'px-5 py-2'} bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Create Meeting
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}