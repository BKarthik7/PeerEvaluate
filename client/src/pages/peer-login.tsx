import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PeerLoginProps {
  onBack: () => void;
  onLoginSuccess: (peer: any) => void;
}

export default function PeerLogin({ onBack, onLoginSuccess }: PeerLoginProps) {
  const [usn, setUsn] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { usn: string }) => {
      const response = await apiRequest("POST", "/api/peer/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Joined successfully",
        description: "Welcome to the evaluation session",
      });
      onLoginSuccess(data.peer);
    },
    onError: (error: any) => {
      toast({
        title: "Join failed",
        description: error.message || "USN not found in eligible peers list",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ usn: usn.toUpperCase() });
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <User className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Join as Peer</h2>
          <p className="text-gray-600 text-sm">Enter your USN to join the evaluation</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="usn">USN</Label>
            <Input
              id="usn"
              type="text"
              value={usn}
              onChange={(e) => setUsn(e.target.value.toUpperCase())}
              placeholder="e.g., 1CR21CS123"
              className="font-mono"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-success hover:bg-green-700"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Joining..." : "Join Session"}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
