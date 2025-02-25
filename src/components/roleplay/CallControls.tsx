
import React from 'react';
import { Button } from "@/components/ui/button";
import { Award, Phone } from "lucide-react";

interface CallControlsProps {
  showScoreButton: boolean;
  isGettingScore: boolean;
  isLoading: boolean;
  onGetScore: () => void;
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  showScoreButton,
  isGettingScore,
  isLoading,
  onGetScore,
  onEndCall,
}) => {
  return (
    <div className="p-8 flex justify-center gap-4">
      {showScoreButton && !isGettingScore && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16"
            onClick={onGetScore}
            disabled={isLoading || isGettingScore}
          >
            <Award className="h-6 w-6" />
          </Button>
          <span className="text-sm font-medium text-gray-600">Get Your Score</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16"
          onClick={onEndCall}
          disabled={isGettingScore}
        >
          <Phone className="w-6 h-6 rotate-135" />
        </Button>
        <span className="text-sm font-medium text-gray-600">End Call</span>
      </div>
    </div>
  );
};
