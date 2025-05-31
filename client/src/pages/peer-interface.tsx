import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut, Dock, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import EvaluationModal from "@/components/evaluation-modal";
import { useStream } from "@/hooks/use-stream";
import { 
  StreamVideo, 
  StreamCall, 
  ParticipantView, 
  useCallStateHooks,
  StreamVideoClient,
  StreamVideoParticipant,
  Call
} from '@stream-io/video-react-sdk';

interface Session {
  screenShareActive: boolean;
  streamCallId: string;
  evaluationActive: boolean;
  currentTeam: string;
}

interface Peer {
  usn: string;
  name: string;
}

interface PeerInterfaceProps {
  peer: Peer;
  onLogout: () => void;
}

function ScreenShareView({ call }: { call: Call }) {
  const { useScreenShareState } = useCallStateHooks();
  const { status: screenShareStatus } = useScreenShareState();

  if (screenShareStatus !== 'enabled' || !call.state.localParticipant) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <Dock className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl mb-2">Connecting to screen share...</p>
          <p className="text-gray-400">Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  return (
    <ParticipantView
      participant={call.state.localParticipant}
      className="w-full h-full"
      trackType="screenShareTrack"
    />
  );
}

function PeerInterfaceContent({ peer, onLogout }: PeerInterfaceProps) {
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [hasSubmittedEvaluation, setHasSubmittedEvaluation] = useState(false);

  const { joinCall, call } = useStream(`peer-${peer.usn}`, peer.usn);

  // Fetch session to monitor state changes
  const { data: session } = useQuery<Session>({
    queryKey: ['/api/session'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  useEffect(() => {
    // Join call when screen sharing becomes active
    if (session?.screenShareActive && session?.streamCallId && !call) {
      console.log('Joining call with ID:', session.streamCallId);
      joinCall(session.streamCallId);
    }
  }, [session?.screenShareActive, session?.streamCallId, call, joinCall]);

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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <User className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-lg font-medium text-gray-900">{peer.name}</span>
              <span className="ml-2 text-sm text-gray-500">({peer.usn})</span>
            </div>
            <Button variant="ghost" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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
                call ? (
                  <StreamCall call={call}>
                    <ScreenShareView call={call} />
                  </StreamCall>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Dock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl mb-2">Connecting to screen share...</p>
                      <p className="text-gray-400">Please wait while we connect you</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Dock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Waiting for presentation...</p>
                    <p className="text-gray-400">The admin will start screen sharing when ready</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Modal */}
        {showEvaluationModal && (
          <EvaluationModal
            isOpen={showEvaluationModal}
            onClose={handleEvaluationClose}
            teamName={session?.currentTeam || ""}
            evaluatorUsn={peer.usn}
          />
        )}
      </div>
    </div>
  );
}

export default function PeerInterface(props: PeerInterfaceProps) {
  const { client } = useStream(`peer-${props.peer.usn}`, props.peer.usn);

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Initializing...</p>
          <p className="text-sm text-gray-500">Please wait while we set up your interface</p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <PeerInterfaceContent {...props} />
    </StreamVideo>
  );
}