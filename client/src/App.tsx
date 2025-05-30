import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LoginSelection from "@/components/login-selection";
import AdminLogin from "@/pages/admin-login";
import PeerLogin from "@/pages/peer-login";
import AdminDashboard from "@/pages/admin-dashboard";
import PeerInterface from "@/pages/peer-interface";

type AuthState = 'selection' | 'admin-login' | 'peer-login' | 'admin-dashboard' | 'peer-interface';

function App() {
  const [authState, setAuthState] = useState<AuthState>('selection');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleAdminLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setAuthState('admin-dashboard');
  };

  const handlePeerLoginSuccess = (peer: any) => {
    setCurrentUser(peer);
    setAuthState('peer-interface');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthState('selection');
  };

  const renderCurrentView = () => {
    switch (authState) {
      case 'selection':
        return (
          <LoginSelection
            onShowAdminLogin={() => setAuthState('admin-login')}
            onShowPeerLogin={() => setAuthState('peer-login')}
          />
        );
      case 'admin-login':
        return (
          <AdminLogin
            onBack={() => setAuthState('selection')}
            onLoginSuccess={handleAdminLoginSuccess}
          />
        );
      case 'peer-login':
        return (
          <PeerLogin
            onBack={() => setAuthState('selection')}
            onLoginSuccess={handlePeerLoginSuccess}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        );
      case 'peer-interface':
        return (
          <PeerInterface
            peer={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {authState === 'selection' || authState === 'admin-login' || authState === 'peer-login' ? (
            <div className="min-h-screen flex items-center justify-center p-4">
              {renderCurrentView()}
            </div>
          ) : (
            renderCurrentView()
          )}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
