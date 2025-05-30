import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  evaluatorUsn: string;
}

export default function EvaluationModal({ isOpen, onClose, teamName, evaluatorUsn }: EvaluationModalProps) {
  const [clarity, setClarity] = useState(false);
  const [organization, setOrganization] = useState(false);
  const [engagement, setEngagement] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/evaluations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Evaluation submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations'] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setClarity(false);
    setOrganization(false);
    setEngagement(false);
    setFeedback("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      evaluatorUsn,
      teamName,
      clarity,
      organization,
      engagement,
      feedback,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 text-primary mr-2" />
            Evaluate Presentation
          </CardTitle>
          <p className="text-gray-600 text-sm">Rate the team's presentation</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Presentation Quality
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clarity"
                    checked={clarity}
                    onCheckedChange={(checked) => setClarity(checked as boolean)}
                  />
                  <Label htmlFor="clarity" className="text-sm text-gray-700">
                    Clear communication
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="organization"
                    checked={organization}
                    onCheckedChange={(checked) => setOrganization(checked as boolean)}
                  />
                  <Label htmlFor="organization" className="text-sm text-gray-700">
                    Well organized content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="engagement"
                    checked={engagement}
                    onCheckedChange={(checked) => setEngagement(checked as boolean)}
                  />
                  <Label htmlFor="engagement" className="text-sm text-gray-700">
                    Engaging delivery
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Feedback
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on the presentation..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-blue-700"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Evaluation"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
