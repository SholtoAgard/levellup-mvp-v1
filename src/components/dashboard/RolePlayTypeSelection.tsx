
import { ForwardedRef, forwardRef } from "react";

interface RolePlayTypeSelectionProps {
  types: string[];
  selectedType: string;
  onSelect: (type: string) => void;
}

export const RolePlayTypeSelection = forwardRef(
  ({ types, selectedType, onSelect }: RolePlayTypeSelectionProps, ref: ForwardedRef<HTMLDivElement>) => {
    const handleTypeSelect = (type: string) => {
      onSelect(type);
      // Scroll to the Start Role Play button
      const startButton = document.querySelector('[data-start-roleplay]');
      if (startButton) {
        startButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    return (
      <section ref={ref}>
        <h2 className="text-2xl font-semibold mb-6">Type of role play:</h2>
        <div className="flex gap-4 flex-wrap">
          {types.map((type) => (
            <button
              key={type}
              className={`px-6 py-3 rounded-lg border ${
                selectedType === type 
                  ? 'border-[#1E90FF] text-[#1E90FF]' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTypeSelect(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </section>
    );
  }
);

RolePlayTypeSelection.displayName = "RolePlayTypeSelection";
