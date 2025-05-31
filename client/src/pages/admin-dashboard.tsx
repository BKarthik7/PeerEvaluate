import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Upload, Users, UsersIcon, Dock, Play, 
  Pause, ClipboardCheck, LogOut, CloudUpload, Theater,
  BarChart
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStream } from "@/hooks/use-stream";
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';

interface Team {
  id: number;
  name: string;
  members: string[];
}

interface Evaluation {
  id: number;
  teamName: string;
  evaluatorUsn: string;
  clarity: boolean;
  organization: boolean;
  engagement: boolean;
  feedback: string;
}

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

function AdminDashboardContent({ user, onLogout }: AdminDashboardProps) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    createCall, 
    startScreenShare, 
    stopScreenShare, 
    isScreenSharing,
    call,
    client
  } = useStream(`admin-${user.id}`, user.username);

  // Fetch teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch session
  const { data: session } = useQuery({
    queryKey: ['/api/session'],
  });

  // Fetch evaluations
  const { data: evaluations = [] } = useQuery<Evaluation[]>({
    queryKey: ['/api/evaluations'],
  });

  // Upload peers mutation
  const uploadPeersMutation = useMutation({
    mutationFn: async (peers: string[]) => {
      const response = await apiRequest("POST", "/api/admin/upload-peers", { peers });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/peers'] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Please check your CSV format",
        variant: "destructive",
      });
    },
  });

  // Upload teams mutation
  const uploadTeamsMutation = useMutation({
    mutationFn: async (teams: any[]) => {
      const response = await apiRequest("POST", "/api/admin/upload-teams", { teams });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Please check your CSV format",
        variant: "destructive",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/session", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session'] });
    },
  });

  const handlePeersCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const peers = csv.split('\n').map(line => line.trim()).filter(line => line);
        uploadPeersMutation.mutate(peers);
      };
      reader.readAsText(file);
    }
  };

  const handleTeamsCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const teams = csv.split('\n').map(line => {
          const parts = line.split(',').map(part => part.trim());
          return {
            name: parts[0],
            members: parts.slice(1).filter(member => member)
          };
        }).filter(team => team.name && team.members.length > 0);
        uploadTeamsMutation.mutate(teams);
      };
      reader.readAsText(file);
    }
  };

  const handleBringToStage = async () => {
    const team = teams.find((t: any) => t.id.toString() === selectedTeam);
    if (team) {
      setCurrentTeam(team);
      await updateSessionMutation.mutateAsync({ currentTeam: team.name });
      
      // Create call for screen sharing
      if (!call) {
        console.log('Creating new call...');
        await createCall();
      }
      
      toast({
        title: "Team on stage",
        description: `${team.name} is now presenting`,
      });
    }
  };

  const handleStartScreenShare = async () => {
    if (!call) {
      console.log('Creating new call before screen sharing...');
      await createCall();
    }
    
    const success = await startScreenShare();
    if (success) {
      await updateSessionMutation.mutateAsync({ 
        screenShareActive: true,
        streamCallId: call?.id
      });
      toast({
        title: "Screen sharing started",
        description: "All peers can now see your screen",
      });
    } else {
      toast({
        title: "Screen share failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleStopScreenShare = async () => {
    const success = await stopScreenShare();
    if (success) {
      await updateSessionMutation.mutateAsync({ 
        screenShareActive: false,
        streamCallId: null
      });
      toast({
        title: "Screen sharing stopped",
        description: "You can now start the evaluation",
      });
    }
  };

  const handleStartEvaluation = async () => {
    await updateSessionMutation.mutateAsync({ evaluationActive: true });
    toast({
      title: "Evaluation started",
      description: "Peers can now submit their evaluations",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-xl mr-3" />
              <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
                <span className="text-sm font-medium text-gray-800">{teams.length} peers connected</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CSV Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 text-primary mr-2" />
                    Upload Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Peers CSV Upload */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Eligible Peers (CSV)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handlePeersCSV}
                        className="hidden"
                        id="peersCSV"
                      />
                      <Label htmlFor="peersCSV" className="cursor-pointer">
                        <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Upload peers USN list</p>
                        <p className="text-xs text-gray-500 mt-1">Format: USN per line</p>
                      </Label>
                    </div>
                  </div>

                  {/* Teams CSV Upload */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Formation (CSV)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleTeamsCSV}
                        className="hidden"
                        id="teamsCSV"
                      />
                      <Label htmlFor="teamsCSV" className="cursor-pointer">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Upload team formations</p>
                        <p className="text-xs text-gray-500 mt-1">Format: teamName,usn1,usn2,...</p>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teams Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-primary mr-2" />
                    Team Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Team for Presentation
                    </Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTeam && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Selected Team: {teams.find((t: any) => t.id.toString() === selectedTeam)?.name}
                      </h4>
                      <div className="space-y-1">
                        {teams.find((t: any) => t.id.toString() === selectedTeam)?.members.map((member: string, idx: number) => (
                          <div key={idx} className="text-blue-800 font-mono text-sm">{member}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleBringToStage}
                    className="w-full bg-warning hover:bg-orange-600"
                    disabled={!selectedTeam}
                  >
                    <Theater className="h-4 w-4 mr-2" />
                    Bring Team to Theater
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Presentation Tab */}
          <TabsContent value="presentation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Screen Share Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dock className="h-5 w-5 text-primary mr-2" />
                    Screen Share Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`flex items-center p-3 rounded-lg ${isScreenSharing ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className={`w-3 h-3 rounded-full mr-3 ${isScreenSharing ? 'bg-success' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm ${isScreenSharing ? 'text-success font-medium' : 'text-gray-600'}`}>
                      {isScreenSharing ? 'Screen sharing active' : 'Screen sharing inactive'}
                    </span>
                  </div>

                  {!isScreenSharing ? (
                    <Button 
                      onClick={handleStartScreenShare}
                      className="w-full bg-primary hover:bg-blue-700"
                      disabled={!call}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Screen Share
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStopScreenShare}
                      className="w-full bg-error hover:bg-red-700"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Screen Share
                    </Button>
                  )}

                  <Button 
                    onClick={handleStartEvaluation}
                    className="w-full bg-success hover:bg-green-700"
                    disabled={isScreenSharing || !currentTeam}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Start Evaluation
                  </Button>
                </CardContent>
              </Card>

              {/* Current Team Info */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 text-primary mr-2" />
                      Current Presenting Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentTeam ? (
                      <div className="text-center">
                        <div className="bg-warning text-white inline-flex items-center px-4 py-2 rounded-full mb-4">
                          <Users className="h-4 w-4 mr-2" />
                          Now Presenting: {currentTeam.name}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {currentTeam.members.map((member: string, idx: number) => (
                            <div key={idx} className="bg-blue-50 text-blue-800 px-3 py-2 rounded font-mono text-sm">
                              {member}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4" />
                        <p>No team selected for presentation</p>
                        <p className="text-sm">Go to Setup tab to select a team</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Evaluation Tab */}
          <TabsContent value="evaluation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 text-primary mr-2" />
                  Evaluation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.map((evaluation: any) => (
                      <div key={evaluation.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Team: {evaluation.teamName}</h4>
                          <span className="text-sm text-gray-500 font-mono">
                            {evaluation.evaluatorUsn}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className={`text-sm ${evaluation.clarity ? 'text-success' : 'text-gray-400'}`}>
                            ✓ Clear communication
                          </div>
                          <div className={`text-sm ${evaluation.organization ? 'text-success' : 'text-gray-400'}`}>
                            ✓ Well organized
                          </div>
                          <div className={`text-sm ${evaluation.engagement ? 'text-success' : 'text-gray-400'}`}>
                            ✓ Engaging delivery
                          </div>
                        </div>
                        {evaluation.feedback && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {evaluation.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-4" />
                    <p>No evaluation data available</p>
                    <p className="text-sm">Complete a presentation session to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const { client } = useStream(`admin-${props.user.id}`, props.user.username);

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Initializing...</p>
          <p className="text-sm text-gray-500">Please wait while we set up your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <AdminDashboardContent {...props} />
    </StreamVideo>
  );
}
