import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import Chat from "@/routes/Chat";
import ProtectedRoute from "@/routes/ProtectedRoute";
import SettingsPage from "@/routes/Settings";
import GalleryPage from "@/routes/Gallery";
import ResearchPage from "@/routes/Research";
import { api } from "@aether-ai-2/backend/convex/_generated/api";
import LoginPage from "@/routes/Login";
import { CircularLoader } from "@/components/ui/loader";
import { SidebarProvider } from "@/components/ui/sidebar";
import AccountDashboard from "@/routes/account/accountDashboard";
import AccountIndex from "@/routes/account/AccountIndex";
import AccountAppearance from "@/routes/account/AccountAppearance";
import AccountModels from "@/routes/account/AccountModels";
import AccountPreferences from "@/routes/account/AccountPreferences";
import AccountSubscription from "@/routes/account/AccountSubscription";
import AccountLayout from "@/routes/account/AccountLayout";
import TestUploadPage from "@/routes/testUploadPage";
import TestResendPage from "@/routes/test-resend";

const SharedChatPage = () => <div>Shared Chat Page (to be implemented)</div>;
const NotFoundPage = () => <p>Not found</p>;

function SidebarLayout() {
  return (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularLoader />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<LoginPage />} />
      <Route path="/shared/:shareId" element={<SharedChatPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<SidebarLayout />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/test-upload" element={<TestUploadPage />} />
          <Route path="/test-resend" element={<TestResendPage />} />
        </Route>

        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboard />} />
          <Route path="index" element={<AccountIndex />} />
          <Route path="appearance" element={<AccountAppearance />} />
          <Route path="models" element={<AccountModels />} />
          <Route path="preferences" element={<AccountPreferences />} />
          <Route path="subscription" element={<AccountSubscription />} />
        </Route>

        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
