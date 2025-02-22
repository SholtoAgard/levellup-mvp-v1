
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const DescriptionInput = ({
  value,
  onChange,
  isRecording,
  onStartRecording,
  onStopRecording,
}: DescriptionInputProps) => {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">
        Tell me about your role-play situation. What are you looking to achieve?
      </h2>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing here..."
          className="w-full h-48 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent pr-12"
        />
        <Button
          className={`absolute right-2 top-2 ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          } text-white rounded-full p-2`}
          size="icon"
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? (
            <StopCircle className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    </section>
  );
};
