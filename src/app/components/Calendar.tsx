import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  X,
  Check,
  Loader2
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";
import { meetingsAPI } from "../services/apiWrapper";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function Calendar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [view, setView] = useState<"month" | "week">("month");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: "",
    time: "",
    duration: "30",
    participants: "",
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
      setMeetings(data.map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        duration: m.duration,
        participants: 0,
        type: 'one-time',
      })));
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  
  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const getMeetingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return meetings.filter(m => m.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Get the current week days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const today = new Date();
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Calendar
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            View and manage your meeting schedule
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:shadow-lg transition-all text-sm"
          onClick={() => setShowScheduleModal(true)}
        >
          <Video className="w-4 h-4" />
          Schedule Meeting
        </motion.button>
      </motion.div>

      {/* Calendar Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={view === "month" ? previousMonth : previousWeek}
              className={`p-2 rounded-xl ${ theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'
              } transition-colors`}
            >
              <ChevronLeft className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </motion.button>
            
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {view === "month" ? `${monthNames[month]} ${year}` : `Week of ${monthNames[month]} ${currentDate.getDate()}, ${year}`}
            </h2>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={view === "month" ? nextMonth : nextWeek}
              className={`p-2 rounded-xl ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'
              } transition-colors`}
            >
              <ChevronRight className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </motion.button>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setView("month")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === "month"
                  ? "bg-gray-900 text-white"
                  : theme === 'dark'
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Month
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === "week"
                  ? "bg-gray-900 text-white"
                  : theme === 'dark'
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              Week
            </motion.button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className={`text-center py-3 text-sm font-semibold ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((calDay, index) => {
            const dayMeetings = getMeetingsForDate(calDay.date);
            const isTodayDate = isToday(calDay.date);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`min-h-[100px] p-2 rounded-xl ${
                  calDay.isCurrentMonth
                    ? theme === 'dark'
                      ? 'bg-gray-800/50'
                      : 'bg-white/80'
                    : theme === 'dark'
                    ? 'bg-gray-900/30'
                    : 'bg-gray-100/50'
                } ${
                  isTodayDate
                    ? 'ring-2 ring-yellow-400'
                    : ''
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className={`text-sm font-semibold mb-2 ${
                  calDay.isCurrentMonth
                    ? isTodayDate
                      ? 'text-yellow-400'
                      : theme === 'dark'
                      ? 'text-white'
                      : 'text-gray-900'
                    : theme === 'dark'
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  {calDay.day}
                </div>

                <div className="space-y-1">
                  {dayMeetings.slice(0, 2).map((meeting) => (
                    <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          meeting.type === 'recurring'
                            ? 'bg-blue-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        <div className="font-semibold truncate">{meeting.title}</div>
                        <div className="text-[10px] opacity-90">{meeting.time}</div>
                      </motion.div>
                    </Link>
                  ))}
                  {dayMeetings.length > 2 && (
                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      +{dayMeetings.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </motion.div>

      {/* Upcoming Meetings List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Upcoming Meetings
        </h3>
        <div className="space-y-3">
          {meetings.slice(0, 5).map((meeting, index) => (
            <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl cursor-pointer ${
                  theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-xl ${
                      meeting.type === 'recurring' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    }`}>
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h4>
                      <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span>{meeting.date}</span>
                        <span>{meeting.time}</span>
                        <span>{meeting.duration}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.participants}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    meeting.type === 'recurring'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {meeting.type}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Schedule Meeting
                </h2>
                <button
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  onClick={() => setShowScheduleModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={meetingForm.title}
                      onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input
                      type="date"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={meetingForm.date}
                      onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time
                    </label>
                    <input
                      type="time"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={meetingForm.time}
                      onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Duration
                    </label>
                    <select
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={meetingForm.duration}
                      onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })}
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                      <option value="180">180 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Participants
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={meetingForm.participants}
                      onChange={(e) => setMeetingForm({ ...meetingForm, participants: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}