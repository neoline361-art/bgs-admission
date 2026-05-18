import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import { isConfigured } from "./lib/supabase";
import SetupPrompt from "./components/SetupPrompt";
import Landing from "./pages/Landing";
import Apply from "./pages/Apply";
import ApplySuccess from "./pages/ApplySuccess";
import StaffLogin from "./pages/StaffLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import OfficeDashboard from "./pages/OfficeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function Router() {
  if (!isConfigured) {
    return <SetupPrompt />;
  }
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/apply" component={Apply} />
      <Route path="/apply/success" component={ApplySuccess} />
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/office" component={OfficeDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </AuthProvider>
  );
}
