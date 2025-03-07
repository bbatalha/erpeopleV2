import React from "react";

interface RatingSelectorProps {
  value: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  labels?: string[];
}

export function RatingSelector({ 
  value = 3, 
  readOnly = true, 
  onChange, 
  labels = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] 
}: RatingSelectorProps) {
  return (
    <div className="flex flex-col items-start space-y-3 w-full">
      <div className="flex space-x-2 w-full">
        {labels.map((label, index) => (
          <button
            key={index}
            onClick={() => !readOnly && onChange?.(index + 1)}
            disabled={readOnly}
            className={`px-4 py-2 text-sm rounded-lg border flex-1 transition-colors
              ${value === index + 1 
                ? "bg-blue-600 text-white border-blue-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}