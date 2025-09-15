import { Button } from "@/components/ui/button";
import { ModelProvider } from "@/contexts/ModelContext";
import {
  Bot,
  CreditCard,
  Paintbrush,
  Settings,
  User,
  ArrowLeft,
} from "lucide-react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function AccountLayout() {
  const navigate = useNavigate();

  const accountNavItems = [
    {
      path: "/account",
      label: "Account",
      icon: <User size={18} />,
    },
    {
      path: "/account/subscription",
      label: "Subscription",
      icon: <CreditCard size={18} />,
    },
    {
      path: "/account/preferences",
      label: "Preferences",
      icon: <Settings size={18} />,
    },
    { path: "/account/models", label: "Models", icon: <Bot size={18} /> },
    {
      path: "/account/appearance",
      label: "Appearance",
      icon: <Paintbrush size={18} />,
    },
  ];

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <>
      <ModelProvider>
        <Button
          onClick={handleBackClick}
          className="absolute top-5 left-5 flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-md hover:bg-card"
          aria-label="Go back"
          variant={"ghost"}
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </Button>
        <div className="flex flex-col items-center justify-start mt-10 min-h-screen py-8">
          <div className="max-w-5xl w-full relative">
            <div className="flex flex-col gap-2 pt-12">
              <nav className="flex-shrink-0">
                <div className="flex flex-col mb-7">
                  <h2 className="text-2xl font-bold">Settings</h2>
                  <p className="text-muted-foreground">
                    Manage your account preferences and configuration.
                  </p>
                </div>
                <ul className="flex gap-4">
                  {accountNavItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/account"}
                        className={({ isActive }) =>
                          `${
                            isActive ? "bg-card border" : ""
                          } flex items-center gap-x-2 p-2 rounded-md text-sm hover:bg-card transition-all duration-150`
                        }
                      >
                        {item.icon} {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <main className="account-content flex-1 min-h-[500px] mt-8">
              <Outlet />
            </main>
          </div>
        </div>
      </ModelProvider>
    </>
  );
}
