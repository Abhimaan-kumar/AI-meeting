import { Video, CheckCircle2, Clock, Users, ArrowUpRight, ArrowDownRight, ArrowRight, Loader2, TrendingUp, Check, Play } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { meetingsAPI, actionItemsAPI, analyticsAPI } from "../services/apiWrapper";
import { MeetingsAreaChart, ActionsLineChart } from "./ChartComponents";

export function Overview() {
  const { theme, compactMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    actionItems: 0,
    pendingTasks: 0,
    activeParticipants: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [priorityActions, setPriorityActions] = useState<any[]>([]);
  const [meetingData, setMeetingData] = useState<any[]>([]);
  const [actionData, setActionData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch meetings stats
        const meetingStats = await analyticsAPI.getMeetingStats(user.id);

        // Fetch action items stats
        const actionStats = await analyticsAPI.getActionItemStats(user.id);

        // Fetch recent meetings
        const meetings = await meetingsAPI.getAll(user.id);
        const sortedMeetings = meetings.slice(0, 4);

        // Fetch recent action items
        const actions = await actionItemsAPI.getAll(user.id);
        const highPriorityActions = actions
          .filter((a: any) => a.priority === 'high' || a.priority === 'medium')
          .slice(0, 3);

        // Update stats
        setStats({
          totalMeetings: meetingStats.total,
          actionItems: actionStats.total,
          pendingTasks: actionStats.todo + actionStats.in_progress,
          activeParticipants: 0, // This would need a separate query
        });

        setRecentMeetings(sortedMeetings);
        setPriorityActions(highPriorityActions);

        // Generate meeting trend data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const meetingsByDay = last7Days.map((date, index) => {
          const count = meetings.filter((m: any) => m.date === date).length;
          const dayIndex = new Date(date).getDay();
          return {
            day: daysOfWeek[dayIndex],
            meetings: count,
            id: `day-${index}`,
          };
        });

        setMeetingData(meetingsByDay);

        // Generate action items trend data (last 4 weeks)
        const weeklyActionData = Array.from({ length: 4 }, (_, i) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - (i * 7));
          const weekAgoStr = weekAgo.toISOString().split('T')[0];

          const created = actions.filter((a: any) => {
            const createdDate = new Date(a.created_at).toISOString().split('T')[0];
            return createdDate >= weekAgoStr;
          }).length;

          const completed = actions.filter((a: any) => {
            const completedDate = a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : null;
            return a.status === 'completed' && completedDate && completedDate >= weekAgoStr;
          }).length;

          return {
            week: `Week ${4 - i}`,
            created: Math.floor(created / (i + 1)),
            completed: Math.floor(completed / (i + 1)),
            id: `wk-${i}`,
          };
        }).reverse();

        setActionData(weeklyActionData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Meetings",
      value: stats.totalMeetings.toString(),
      change: "+12.5%",
      trend: "up",
      icon: Video,
      gradient: "from-blue-500 to-cyan-500",
      link: "/meetings",
    },
    {
      name: "Action Items",
      value: stats.actionItems.toString(),
      change: "-5.2%",
      trend: "down",
      icon: CheckCircle2,
      gradient: "from-green-500 to-emerald-500",
      link: "/actions",
    },
    {
      name: "Pending Tasks",
      value: stats.pendingTasks.toString(),
      change: "+8.1%",
      trend: "up",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      link: "/actions",
    },
    {
      name: "Active Participants",
      value: stats.activeParticipants.toString(),
      change: "+3",
      trend: "up",
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      link: "/participants",
    },
  ];

  return (
    <div className={compactMode ? "space-y-4" : "space-y-6"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Overview
        </h1>
        <p className={`${compactMode ? 'text-sm' : 'text-base mt-1'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Welcome back! Here's what's happening today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${compactMode ? 'gap-3' : 'gap-4'}`}>
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
            whileHover={{ scale: 1.02 }}
          >
            <Link to={stat.link}>
              <div className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'} cursor-pointer`}>
                <div className={`flex items-start justify-between ${compactMode ? 'mb-2' : 'mb-3'}`}>
                  <div className={`${compactMode ? 'p-2' : 'p-3'} rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <stat.icon className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    stat.trend === "up" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className={`text-xs font-medium ${compactMode ? 'mb-1' : 'mb-2'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {stat.name}
                </p>
                <p className={`${compactMode ? 'text-2xl' : 'text-3xl'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactMode ? 'gap-3' : 'gap-6'}`}>
        {/* Meetings Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'}`}
        >
          <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${compactMode ? 'text-sm' : 'text-base'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Weekly Meetings
            </h3>
            <Video className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
          <div className={compactMode ? "h-[160px] w-full" : "h-[200px] w-full"} style={{ minHeight: compactMode ? '160px' : '200px' }}>
            <MeetingsAreaChart data={meetingData} />
          </div>
        </motion.div>

        {/* Actions Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'}`}
        >
          <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${compactMode ? 'text-sm' : 'text-base'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Action Items Trend
            </h3>
            <CheckCircle2 className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
          <div className={compactMode ? "h-[160px] w-full" : "h-[200px] w-full"} style={{ minHeight: compactMode ? '160px' : '200px' }}>
            <ActionsLineChart data={actionData} />
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Row */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactMode ? 'gap-3' : 'gap-6'}`}>
        {/* Recent Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'}`}
        >
          <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${compactMode ? 'text-sm' : 'text-base'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recent Meetings
            </h3>
            <Link to="/meetings">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center gap-1`}
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </Link>
          </div>
          <div className={compactMode ? "space-y-2" : "space-y-3"}>
            {recentMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Video className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No meetings yet
                </p>
                <Link to="/meetings">
                  <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    Create your first meeting
                  </button>
                </Link>
              </div>
            ) :
              recentMeetings.slice(0, 3).map((meeting, index) => (
              <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className={`${compactMode ? 'p-3 rounded-lg' : 'p-4 rounded-xl'} cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`${compactMode ? 'p-1.5' : 'p-2'} rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0`}>
                        <Video className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`${compactMode ? 'text-sm' : 'text-base'} font-semibold mb-1 truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {meeting.title}
                        </h4>
                        <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span>{meeting.time}</span>
                          <span>•</span>
                          <span>{meeting.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        meeting.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : meeting.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
            }
          </div>
        </motion.div>

        {/* Recent Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`glass-card ${compactMode ? 'rounded-xl p-4' : 'rounded-2xl p-6'}`}
        >
          <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
            <h3 className={`${compactMode ? 'text-sm' : 'text-base'} font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Priority Actions
            </h3>
            <Link to="/actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} flex items-center gap-1`}
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </Link>
          </div>
          <div className={compactMode ? "space-y-2" : "space-y-3"}>
            {priorityActions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No action items yet
                </p>
                <Link to="/actions">
                  <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    Create your first action item
                  </button>
                </Link>
              </div>
            ) :
              priorityActions.slice(0, 3).map((action, index) => (
              <Link key={action.id} to={`/actions`}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className={`${compactMode ? 'p-3 rounded-lg' : 'p-4 rounded-xl'} cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${
                      action.status === 'completed'
                        ? 'text-green-500'
                        : action.status === 'in_progress'
                        ? 'text-blue-500'
                        : 'text-yellow-500'
                    }`}>
                      {action.status === 'completed' ? (
                        <Check className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      ) : action.status === 'in_progress' ? (
                        <Play className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      ) : (
                        <Clock className={`${compactMode ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`${compactMode ? 'text-sm' : 'text-base'} font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {action.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {action.assignee}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          action.priority === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : action.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
}