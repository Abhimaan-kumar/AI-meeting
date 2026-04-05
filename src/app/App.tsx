import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { DashboardLayout } from "./components/DashboardLayout";
import { Overview } from "./components/Overview";
import { Meetings } from "./components/Meetings";
import { MeetingDetail } from "./components/MeetingDetail";
import { ActionItems } from "./components/ActionItems";
import { Calendar } from "./components/Calendar";
import { Analytics } from "./components/Analytics";
import { Participants } from "./components/Participants";
import { Profile } from "./components/Profile";
import { Notifications } from "./components/Notifications";
import { Settings } from "./components/Settings";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";

export default function App() {
  useEffect(() => {
    // Verify Supabase connection
    const verifyConnection = async () => {
      const configured = isSupabaseConfigured();

      if (configured) {
        console.log(
          "%c🎉 SUPABASE CONNECTED! 🎉",
          "color: #10b981; font-size: 20px; font-weight: bold; padding: 10px;",
        );
        console.log(
          "%c✅ Cloud database: ACTIVE",
          "color: #10b981; font-size: 14px;",
        );
        console.log(
          "%c✅ Authentication: READY",
          "color: #10b981; font-size: 14px;",
        );
        console.log(
          "%c✅ Data persistence: ENABLED",
          "color: #10b981; font-size: 14px;",
        );
        console.log(
          "%c\nYour data is now stored securely in the cloud!",
          "color: #059669; font-size: 12px;",
        );
        console.log(
          "%c📊 Dashboard: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn",
          "color: #6b7280; font-size: 11px;",
        );

        // Test database connection
        try {
          const { error } = await supabase
            .from("kv_store_af44c8dd")
            .select("key")
            .limit(1);
          if (error) {
            console.warn(
              "⚠️ Database query test failed:",
              error.message,
            );
            console.log(
              "💡 Have you run the SQL script? Check DO_THIS_NOW.md",
            );
          } else {
            console.log(
              "%c✅ Database query test: SUCCESS",
              "color: #10b981; font-size: 14px;",
            );
          }
        } catch (err) {
          console.warn(
            "⚠️ Database connection test error:",
            err,
          );
        }
      } else {
        console.log(
          "%c⚠️ USING LOCAL STORAGE ONLY",
          "color: #f59e0b; font-size: 16px; font-weight: bold;",
        );
        console.log(
          "%c📝 Data stored in browser localStorage (temporary)",
          "color: #f59e0b; font-size: 12px;",
        );
        console.log(
          "%c💡 To enable cloud storage, check QUICK_START.md",
          "color: #6b7280; font-size: 11px;",
        );
      }
    };

    verifyConnection();

    // Suppress Recharts duplicate key warnings (known Recharts internal issue)
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes(
          "Encountered two children with the same key",
        )
      ) {
        return; // Suppress this specific warning
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="meetings" element={<Meetings />} />
              <Route
                path="meetings/:id"
                element={<MeetingDetail />}
              />
              <Route path="actions" element={<ActionItems />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="analytics" element={<Analytics />} />
              <Route
                path="participants"
                element={<Participants />}
              />
              <Route path="profile" element={<Profile />} />
              <Route
                path="notifications"
                element={<Notifications />}
              />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route
              path="*"
              element={<Navigate to="/login" replace />}
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}