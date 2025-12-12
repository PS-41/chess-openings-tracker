import React, { useState } from 'react';

// Data Types
export interface Variation {
  id: number;
  name: string;
  moves: string;
  lichess_link: string;
  image_filename?: string;
  tutorials?: string[];
  notes?: string;
}

export interface Opening {
  id: number;
  name: string;
  side: 'white' | 'black';
  variations: Variation[];
}

interface OpeningsListProps {
  openings: Opening[];
  side: 'white' | 'black';
  onVariationClick: (openingName: string, variation: Variation) => void;
  onAddVariation: (opening: Opening) => void;
}

const OpeningsList: React.FC<OpeningsListProps> = ({ openings, side, onVariationClick, onAddVariation }) => {
  const filteredData = openings.filter(o => o.side === side);
  
  // State to track expanded openings (by ID)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  if (filteredData.length === 0) {
    return <div className="text-gray-400 italic p-4 text-center">No openings added yet.</div>;
  }

  const hoverColor = side === 'white' ? 'hover:border-white-side' : 'hover:border-black-side';
  const numberBg = side === 'white' ? 'bg-black-side text-white' : 'bg-white-side text-primary-text';

  return (
    <div className="w-full">
      <ol className="list-none space-y-4" style={{ counterReset: 'opening-counter' }}>
        {filteredData.map((opening, index) => {
          const isExpanded = expandedIds.has(opening.id);

          return (
            <li 
              key={opening.id}
              style={{ counterIncrement: 'opening-counter' }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Header Row */}
              <div 
                className={`
                  flex items-center justify-between p-4 
                  border-l-4 border-transparent ${hoverColor}
                  transition-colors duration-200
                `}
              >
                <div className="flex items-center flex-1">
                  {/* Number Badge */}
                  <span 
                    className={`
                      flex-shrink-0 w-8 h-8 flex items-center justify-center 
                      rounded-full font-bold mr-4 text-sm shadow-inner ${numberBg}
                    `}
                    style={{ content: 'counter(opening-counter)' }} 
                  >
                     {index + 1}
                  </span>

                  {/* Opening Name - Clicking toggles expand too for better UX */}
                  <span 
                    className="text-lg font-medium text-gray-800 mr-2 cursor-pointer hover:text-black"
                    onClick={() => toggleExpand(opening.id)}
                  >
                    {opening.name}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {/* Add Variation Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddVariation(opening);
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded border border-gray-300 transition-colors"
                    title="Add a new variation to this opening"
                  >
                    + Variation
                  </button>

                  {/* Expand Toggle (Always visible) */}
                  <button
                    onClick={() => toggleExpand(opening.id)}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-full 
                      hover:bg-gray-100 transition-transform duration-300
                      ${isExpanded ? 'rotate-180' : 'rotate-0'}
                    `}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Variations List - Hidden unless expanded */}
              <div className={`bg-gray-50 border-t border-gray-100 ${isExpanded ? 'block' : 'hidden'}`}>
                  {opening.variations.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 italic">No variations added yet.</div>
                  ) : (
                    opening.variations.map((v) => (
                      <div 
                        key={v.id}
                        onClick={() => onVariationClick(opening.name, v)}
                        className="
                          flex items-center px-4 py-3 pl-16 
                          cursor-pointer hover:bg-blue-50 hover:text-blue-700
                          transition-colors border-b border-gray-100 last:border-0
                          text-gray-600 group
                        "
                      >
                         {/* Small bullet */}
                         <span className="w-2 h-2 rounded-full bg-gray-300 mr-3 group-hover:bg-blue-400"></span>
                         <span className="font-medium text-sm">
                            {v.name}
                         </span>
                      </div>
                    ))
                  )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default OpeningsList;