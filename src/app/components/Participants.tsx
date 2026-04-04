import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { participantsAPI } from "../services/apiWrapper";
import { 
  Search, 
  Mail, 
  Phone, 
  Users, 
  Calendar as CalendarIcon, 
  Award, 
  TrendingUp, 
  Clock, 
  Loader2 
} from "lucide-react";

export function Participants() {
  const { theme, compactMode } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchParticipants();
    }
  }, [user]);

  const fetchParticipants = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await participantsAPI.getAll(user.id);

      // Group by participant name and aggregate stats
      const participantMap = new Map();
      data.forEach((p: any) => {
        if (!participantMap.has(p.participant_name)) {
          participantMap.set(p.participant_name, {
            id: p.id,
            name: p.participant_name,
            email: p.participant_email || `${p.participant_name.toLowerCase().replace(' ', '.')}@company.com`,
            role: p.role || 'Team Member',
            department: 'General',
            avatar: p.participant_name.split(' ').map((n: string) => n[0]).join(''),
            color: `bg-${['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)]}-500`,
            stats: {
              meetings: 1,
              actions: 0,
              completionRate: 0,
              avgResponseTime: "N/A",
            },
          });
        } else {
          const existing = participantMap.get(p.participant_name);
          existing.stats.meetings += 1;
        }
      });

      setParticipants(Array.from(participantMap.values()));
    } catch (error) {
      console.error("Error fetching participants:", error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || p.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ["all", ...new Set(participants.map(p => p.department))];

  return (
    <div className={compactMode ? "space-y-4" : "space-y-6"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Participants
        </h1>
        <p className={`${compactMode ? 'text-sm' : 'mt-1'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Manage team members and track engagement
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-4'}`}
      >
        <div className={`flex items-center ${compactMode ? 'gap-3' : 'gap-4'} flex-wrap`}>
          <div className="flex-1 min-w-[200px]">
            <div className={`flex items-center gap-3 ${compactMode ? 'px-3 py-2' : 'px-4 py-3'} ${compactMode ? 'rounded-lg' : 'rounded-xl'} ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <Search className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none ${compactMode ? 'text-sm' : ''} ${
                  theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {departments.map((dept) => (
              <motion.button
                key={dept}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  selectedDepartment === dept
                    ? "bg-gray-900 text-white"
                    : theme === 'dark'
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                {dept}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Participants Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactMode ? 'gap-3' : 'gap-4'}`}>
        {loading ? (
          <div className="col-span-2 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="col-span-2 glass-card rounded-xl p-8 text-center">
            <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {participants.length === 0 ? 'No participants yet' : 'No participants found'}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {participants.length === 0 ? 'Participants will appear here once meetings are created' : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) :
          filteredParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'}`}
          >
            <div className={`flex items-start ${compactMode ? 'gap-3 mb-3' : 'gap-4 mb-4'}`}>
              <div className={`${compactMode ? 'w-12 h-12' : 'w-16 h-16'} ${participant.color} ${compactMode ? 'rounded-xl' : 'rounded-2xl'} flex items-center justify-center text-white ${compactMode ? 'text-lg' : 'text-xl'} font-bold shadow-lg`}>
                {participant.avatar}
              </div>
              <div className="flex-1">
                <h3 className={`${compactMode ? 'text-base' : 'text-lg'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {participant.name}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {participant.role}
                </p>
                <div className={`px-3 py-1 bg-yellow-400 text-gray-900 ${compactMode ? 'rounded-lg' : 'rounded-full'} text-xs font-bold inline-block mt-2`}>
                  {participant.department}
                </div>
              </div>
            </div>

            <div className={`${compactMode ? 'space-y-1 mb-3' : 'space-y-2 mb-4'}`}>
              <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <Mail className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {participant.email}
              </div>
              {participant.phone && (
                <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Phone className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {participant.phone}
                </div>
              )}
            </div>

            <div className={`grid grid-cols-2 ${compactMode ? 'gap-2' : 'gap-3'}`}>
              <div className={`${compactMode ? 'p-2' : 'p-3'} ${compactMode ? 'rounded-lg' : 'rounded-xl'} ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</span>
                </div>
                <p className={`${compactMode ? 'text-lg' : 'text-xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {participant.stats.meetings}
                </p>
              </div>

              <div className={`${compactMode ? 'p-2' : 'p-3'} ${compactMode ? 'rounded-lg' : 'rounded-xl'} ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Award className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Actions</span>
                </div>
                <p className={`${compactMode ? 'text-lg' : 'text-xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {participant.stats.actions}
                </p>
              </div>

              <div className={`${compactMode ? 'p-2' : 'p-3'} ${compactMode ? 'rounded-lg' : 'rounded-xl'} ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-purple-500`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completion</span>
                </div>
                <p className={`${compactMode ? 'text-lg' : 'text-xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {participant.stats.completionRate}%
                </p>
              </div>

              <div className={`${compactMode ? 'p-2' : 'p-3'} ${compactMode ? 'rounded-lg' : 'rounded-xl'} ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/80'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-orange-500`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Response</span>
                </div>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {participant.stats.avgResponseTime}
                </p>
              </div>
            </div>
          </motion.div>
        ))
        }
      </div>

      {filteredParticipants.length === 0 && !loading && participants.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <Search className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No participants found
          </h3>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}
    </div>
  );
}