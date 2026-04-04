import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Video,
  Search,
  Bell,
  Settings as SettingsIcon,
  Sparkles,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/apiWrapper";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Meetings", href: "/meetings", icon: Video },
  { name: "Action Items", href: "/actions", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Participants", href: "/participants", icon: Users },
];

export function DashboardLayout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const profile = await userAPI.getProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  // Generate avatar initials from name or email
  const getInitials = () => {
    if (userProfile?.name) {
      return userProfile.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (userProfile?.email || user?.email) {
      const email = userProfile?.email || user?.email;
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div 
      className="min-h-screen p-3 md:p-4"
      style={{ 
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
          : 'linear-gradient(135deg, #f5f5dc 0%, #faf8f3 50%, #f0ece2 100%)' 
      }}
    >
      {/* Single Large Container Frame - Max height to fit viewport */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[1600px] mx-auto rounded-[2rem] p-4 md:p-5 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto backdrop-blur-xl"
        style={{ 
          background: theme === 'dark' 
            ? 'rgba(30, 30, 46, 0.6)' 
            : 'rgba(255, 255, 255, 0.4)',
          border: theme === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(210, 180, 140, 0.2)'
        }}
      >
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          {/* Logo */}
          <div 
            className={`px-5 py-1.5 rounded-full backdrop-blur-md shadow-lg`}
            style={{
              background: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.4)',
              border: theme === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.2)' 
                : '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Meeting AI</span>
          </div>

          {/* Horizontal Navigation */}
          <nav className="flex items-center gap-1.5 flex-wrap">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-1.5 rounded-full font-medium text-xs transition-all ${
                    isActive(item.href)
                      ? 'bg-gray-900 text-white shadow-md'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-white/10'
                        : 'text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {item.name}
                </motion.button>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-white/60'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700" />
              )}
            </motion.button>

            <Link to="/settings">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                className={`p-1.5 rounded-full transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-white/60'
                }`}
              >
                <SettingsIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
              </motion.button>
            </Link>

            <Link to="/notifications">
              <motion.button
                whileHover={{ scale: 1.1 }}
                className={`relative p-1.5 rounded-full transition-colors ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-white/60'
                }`}
              >
                <Bell className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
              </motion.button>
            </Link>

            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md cursor-pointer"
              >
                <span className="text-white text-xs font-bold">{getInitials()}</span>
              </motion.div>
            </Link>

            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => signOut().then(() => navigate('/login'))}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-white/60'
              }`}
            >
              <LogOut className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
            </motion.button>
          </div>
        </div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Outlet />
        </motion.div>
      </motion.div>
    </div>
  );
}