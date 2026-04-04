import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Database, X } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export function DatabaseConnectionStatus() {
  const [show, setShow] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    
    // Show banner on first load
    const hasSeenBanner = localStorage.getItem('hasSeenDatabaseBanner');
    if (!hasSeenBanner) {
      setShow(true);
      localStorage.setItem('hasSeenDatabaseBanner', 'true');
      
      // Auto-hide after different durations based on status
      const duration = configured ? 8000 : 12000; // Success = 8s, Warning = 12s
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4"
      >
        <div className={`${
          isConfigured 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
            : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300'
        } rounded-2xl shadow-2xl p-4`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {isConfigured ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Database className="w-6 h-6 text-amber-600" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">
                {isConfigured ? '🎉 Connected to Cloud Database!' : '⚠️ Using Local Storage Only'}
              </h3>
              
              <p className="text-sm text-gray-700 mb-2">
                {isConfigured 
                  ? 'All your data is stored permanently in Supabase cloud database and syncs across devices. Your meetings, actions, and settings are secure!'
                  : 'Your data is stored in browser localStorage. It will be lost if you clear browser data. Connect to Supabase for permanent cloud storage.'
                }
              </p>
              
              {isConfigured ? (
                <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-800">
                  <p className="font-semibold mb-2">✅ Ready to use:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Cloud database storage with PostgreSQL</li>
                    <li>Secure authentication & user management</li>
                    <li>Real-time data sync across devices</li>
                    <li>Automatic backups & Row Level Security</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-600">
                    📊 View your data: <a 
                      href="https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline font-semibold"
                    >
                      Supabase Dashboard →
                    </a>
                  </p>
                </div>
              ) : (
                <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-800">
                  <p className="font-semibold mb-2">🚀 Setup Supabase (Free & Easy):</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open <code className="bg-amber-100 px-1 rounded">QUICK_START.md</code> in your project</li>
                    <li>Follow the step-by-step guide (takes ~5 minutes)</li>
                    <li>Get permanent cloud storage + multi-device sync</li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => setShow(false)}
              className={`flex-shrink-0 p-1 ${
                isConfigured ? 'hover:bg-green-200' : 'hover:bg-amber-200'
              } rounded-full transition-colors`}
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}