import { createBrowserRouter, Navigate } from "react-router";
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
import { DiagnosticPage } from "./components/DiagnosticPage";

export const router = createBrowserRouter([
  {
    path: "/diagnostic",
    element: <DiagnosticPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: "meetings", element: <Meetings /> },
      { path: "meetings/:id", element: <MeetingDetail /> },
      { path: "actions", element: <ActionItems /> },
      { path: "calendar", element: <Calendar /> },
      { path: "analytics", element: <Analytics /> },
      { path: "participants", element: <Participants /> },
      { path: "profile", element: <Profile /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);