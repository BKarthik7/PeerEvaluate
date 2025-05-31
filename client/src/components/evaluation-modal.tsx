import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  evaluatorUsn: string;
}

interface EvaluationCriteria {
  clarity: boolean;
  organization: boolean;
  engagement: boolean;
}

interface FormErrors {
  clarity?: string;
  organization?: string;
  engagement?: string;
  feedback?: string;
}

export default function EvaluationModal({ 
  isOpen, 
  onClose, 
  teamName, 
  evaluatorUsn 
}: EvaluationModalProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    clarity: false,
    organization: false,
    engagement: false,
  });
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!criteria.clarity) newErrors.clarity = "Please rate clarity";
    if (!criteria.organization) newErrors.organization = "Please rate organization";
    if (!criteria.engagement) newErrors.engagement = "Please rate engagement";
    if (!feedback.trim()) newErrors.feedback = "Please provide feedback";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async (data: {
      evaluatorUsn: string;
      teamName: string;
      clarity: boolean;
      organization: boolean;
      engagement: boolean;
      feedback: string;
    }) => {
      const response = await apiRequest("POST", "/api/evaluations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Evaluation submitted successfully",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCriteria({
      clarity: false,
      organization: false,
      engagement: false,
    });
    setFeedback("");
    setErrors({});
  };

  const handleCriteriaChange = (criterion: keyof EvaluationCriteria, checked: boolean) => {
    setCriteria(prev => ({ ...prev, [criterion]: checked }));
    if (errors[criterion]) {
      setErrors(prev => ({ ...prev, [criterion]: undefined }));
    }
  };

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    if (errors.feedback) {
      setErrors(prev => ({ ...prev, feedback: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      evaluatorUsn,
      teamName,
      ...criteria,
      feedback,
    });
  };

  const handleClose = () => {
    if (submitMutation.isPending) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitMutation.isPending}
          >
            <X className="h-4 w-4" />
          </button>
          <CardTitle className="flex items-center pr-8">
            <ClipboardCheck className="h-5 w-5 text-primary mr-2" />
            Evaluate Presentation
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Rate {teamName}'s presentation
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Presentation Quality <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clarity"
                    checked={criteria.clarity}
                    onCheckedChange={(checked) => 
                      handleCriteriaChange('clarity', checked as boolean)
                    }
                    className={errors.clarity ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="clarity" className="text-sm text-gray-700 cursor-pointer">
                    Clear communication
                  </Label>
                </div>
                {errors.clarity && (
                  <p className="text-sm text-red-500 ml-6">{errors.clarity}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="organization"
                    checked={criteria.organization}
                    onCheckedChange={(checked) => 
                      handleCriteriaChange('organization', checked as boolean)
                    }
                    className={errors.organization ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="organization" className="text-sm text-gray-700 cursor-pointer">
                    Well organized content
                  </Label>
                </div>
                {errors.organization && (
                  <p className="text-sm text-red-500 ml-6">{errors.organization}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="engagement"
                    checked={criteria.engagement}
                    onCheckedChange={(checked) => 
                      handleCriteriaChange('engagement', checked as boolean)
                    }
                    className={errors.engagement ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="engagement" className="text-sm text-gray-700 cursor-pointer">
                    Engaging delivery
                  </Label>
                </div>
                {errors.engagement && (
                  <p className="text-sm text-red-500 ml-6">{errors.engagement}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Feedback <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => handleFeedbackChange(e.target.value)}
                placeholder="Share your thoughts on the presentation..."
                rows={4}
                className={`resize-none ${errors.feedback ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.feedback && (
                  <p className="text-sm text-red-500">{errors.feedback}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {feedback.length}/500 characters
                </p>
              </div>
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
                onClick={handleClose}
                disabled={submitMutation.isPending}
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