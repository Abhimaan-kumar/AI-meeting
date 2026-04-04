import { useParams, Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Download,
  Share2,
  Play,
  CheckCircle2,
  Circle,
  User,
  Sparkles,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { meetingsAPI, actionItemsAPI } from "../services/apiWrapper";

export function MeetingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "actions">("summary");
  const [meeting, setMeeting] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeetingData = async () => {
      if (!user || !id) return;

      try {
        setLoading(true);
        setError(null);
        
        const meetingData = await meetingsAPI.getById(id, user.id);
        setMeeting(meetingData);

        const actions = await actionItemsAPI.getByMeeting(id, user.id);
        setActionItems(actions);
      } catch (err: any) {
        console.error('Error loading meeting:', err);
        setError(err.message || 'Failed to load meeting');
      } finally {
        setLoading(false);
      }
    };

    loadMeetingData();
  }, [id, user]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading meeting details...</p>
        </div>
      </motion.div>
    );
  }

  if (error || !meeting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="glass rounded-2xl p-12 text-center shadow-xl">
          <p className="text-gray-600 text-lg mb-4">
            {error || "Meeting not found"}
          </p>
          <button
            onClick={() => navigate('/meetings')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Meetings
          </button>
        </div>
      </motion.div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorForName = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
      'bg-cyan-500', 'bg-lime-500', 'bg-yellow-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/meetings')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Meetings
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-600">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                {formatDate(meeting.date)}
              </div>
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
                {formatTime(meeting.time)} • {meeting.duration}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                meeting.status === "completed"
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                  : meeting.status === "in-progress"
                  ? "bg-gradient-to-r from-orange-400 to-yellow-500 text-white"
                  : "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
              }`}>
                {meeting.status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 glass rounded-xl hover:bg-white transition-all"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 glass rounded-xl hover:bg-white transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="border-b border-white/30">
              <div className="flex">
                {(["summary", "transcript", "actions"] as const).map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    whileHover={{ y: -2 }}
                    className={`px-6 py-4 font-semibold transition-all relative ${
                      activeTab === tab
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "summary" && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Meeting Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {meeting.summary || "No summary available for this meeting."}
                      </p>
                    </div>
                    
                    {meeting.location && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-3">Location</h3>
                        <p className="text-gray-700">{meeting.location}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "transcript" && (
                  <motion.div
                    key="transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Recording Transcript</h3>
                      {meeting.recording_url && (
                        <motion.a
                          href={meeting.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
                        >
                          <Play className="w-4 h-4" />
                          Play Recording
                        </motion.a>
                      )}
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 max-h-96 overflow-y-auto">
                      {meeting.transcript ? (
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                          {meeting.transcript}
                        </pre>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No transcript available for this meeting.</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "actions" && (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {actionItems.length > 0 ? (
                      actionItems.map((action, idx) => (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 bg-white/60 rounded-xl hover:bg-white transition-all border border-white/50"
                        >
                          <div className="flex items-start gap-3">
                            {action.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className={`font-semibold ${
                                action.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                              }`}>
                                {action.title}
                              </p>
                              {action.description && (
                                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <span className="text-gray-600">Assigned to: {action.assignee}</span>
                                <span className="text-gray-600">Due: {formatDate(action.due_date)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  action.priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : action.priority === "medium"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}>
                                  {action.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No action items for this meeting.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Participants */}
          <div className="glass rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Participants ({meeting.meeting_participants?.length || 0})
            </h3>
            <div className="space-y-3">
              {meeting.meeting_participants && meeting.meeting_participants.length > 0 ? (
                meeting.meeting_participants.map((participant: any, idx: number) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white/60 rounded-xl"
                  >
                    <div className={`w-10 h-10 ${getColorForName(participant.participant_name)} rounded-full flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-sm font-bold">
                        {getInitials(participant.participant_name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{participant.participant_name}</p>
                      {participant.role && (
                        <p className="text-xs text-gray-600">{participant.role}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No participants listed</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}