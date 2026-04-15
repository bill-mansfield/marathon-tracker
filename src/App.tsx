import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DemoPage } from "./pages/DemoPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PlanViewPage } from "./pages/PlanViewPage";
import { PlanCreatorPage } from "./pages/PlanCreatorPage";
import { GuestPlanPage } from "./pages/GuestPlanPage";
import { UserSettingsPage } from "./pages/UserSettingsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/demo" element={<DemoPage />} />
          {/* Public — no account needed to create or preview a plan */}
          <Route path="/plans/new" element={<PlanCreatorPage />} />
          <Route path="/plans/preview" element={<GuestPlanPage />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/plans/:planId"
            element={
              <AuthGuard>
                <PlanViewPage />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <UserSettingsPage />
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
