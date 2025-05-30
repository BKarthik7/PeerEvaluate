import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, User } from "lucide-react";

interface LoginSelectionProps {
  onShowAdminLogin: () => void;
  onShowPeerLogin: () => void;
}

export default function LoginSelection({ onShowAdminLogin, onShowPeerLogin }: LoginSelectionProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Peer Evaluation System</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={onShowAdminLogin}
            className="w-full bg-primary text-white py-3 hover:bg-blue-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
          <Button 
            onClick={onShowPeerLogin}
            variant="outline"
            className="w-full py-3"
          >
            <User className="w-4 h-4 mr-2" />
            Peer Join
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
