import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut, Dock, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import EvaluationModal from "@/components/evaluation-modal";
import { useStream } from "@/hooks/use-stream";

interface PeerInterfaceProps {
  peer: any;
  onLogout: () => void;
}

export default function PeerInterface({ peer, onLogout }: PeerInterfaceProps) {
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [hasSubmittedEvaluation, setHasSubmittedEvaluation] = useState(false);

  const { joinCall, call } = useStream(`peer-${peer.usn}`, peer.usn);

  // Fetch session to monitor state changes
  const { data: session } = useQuery({
    queryKey: ['/api/session'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  useEffect(() => {
    // Join call when screen sharing becomes active
    if (session?.screenShareActive && session?.streamCallId && !call) {
      joinCall(session.streamCallId);
    }
  }, [session, call, joinCall]);

  useEffect(() => {
    // Show evaluation modal when evaluation becomes active
    if (session?.evaluationActive && !showEvaluationModal && !hasSubmittedEvaluation) {
      setShowEvaluationModal(true);
    }
  }, [session?.evaluationActive, showEvaluationModal, hasSubmittedEvaluation]);

  const handleEvaluationClose = () => {
    setShowEvaluationModal(false);
    setHasSubmittedEvaluation(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="text-primary text-xl mr-3" />
              <h1 className="text-lg font-semibold text-gray-800">Peer Evaluation</h1>
              <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded">
                {peer.usn}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-gray-600">Connected</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Screen Share Viewer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Dock className="h-5 w-5 text-primary mr-2" />
              Presentation View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-900 rounded-b-xl relative">
              {session?.screenShareActive ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Dock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Screen sharing active</p>
                    <p className="text-gray-400">The admin is sharing their screen</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Dock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Waiting for presentation...</p>
                    <p className="text-gray-400">The admin will start screen sharing when ready</p>
                  </div>
                </div>
              )}
              
              {/* Stream.io Video Element - This would be rendered by the Stream SDK */}
              {call && session?.screenShareActive && (
                <video 
                  className="w-full h-full object-contain"
                  autoPlay 
                  playsInline
                  style={{ display: 'none' }} // Hidden until Stream SDK renders
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Area */}
        <Card>
          <CardContent className="p-6">
            {hasSubmittedEvaluation ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Evaluation Submitted</h3>
                <p className="text-gray-600">Thank you for your feedback!</p>
              </div>
            ) : session?.evaluationActive ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">!</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Evaluation Time</h3>
                <p className="text-gray-600 mb-4">Please evaluate the presentation</p>
                <Button 
                  onClick={() => setShowEvaluationModal(true)}
                  className="bg-primary hover:bg-blue-700"
                >
                  Open Evaluation Form
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Waiting for Evaluation</h3>
                <p className="text-gray-600">The evaluation form will appear after the presentation ends</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={showEvaluationModal}
        onClose={handleEvaluationClose}
        teamName={session?.currentTeam || ""}
        evaluatorUsn={peer.usn}
      />
    </div>
  );
}
