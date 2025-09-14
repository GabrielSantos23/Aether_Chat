import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../backend/convex/_generated/api";
import { CircularLoader } from "@/components/ui/loader";

const ProtectedRoute = () => {
  const { data: session, status } = useSession();

  // Show loading while NextAuth is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularLoader />
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
