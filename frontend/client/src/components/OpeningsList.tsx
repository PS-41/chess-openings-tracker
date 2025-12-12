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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <p className="text-sm font-medium">No openings added yet.</p>
      </div>
    );
  }

  const accentColor = side === 'white' ? 'border-amber-200' : 'border-slate-400';
  const numberBg = side === 'white' ? 'bg-amber-100 text-amber-800' : 'bg-slate-700 text-white';

  return (
    <div className="w-full">
      <ul className="space-y-3">
        {filteredData.map((opening, index) => {
          const isExpanded = expandedIds.has(opening.id);

          return (
            <li 
              key={opening.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Parent Row - Clickable to Expand */}
              <div 
                onClick={() => toggleExpand(opening.id)}
                className={`
                  relative flex items-center justify-between p-4 cursor-pointer
                  border-l-[6px] ${accentColor} bg-white hover:bg-gray-50 transition-colors
                `}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Number Badge */}
                  <span 
                    className={`
                      flex-shrink-0 w-8 h-8 flex items-center justify-center 
                      rounded-full font-bold text-xs tracking-tight ${numberBg}
                    `}
                  >
                     {index + 1}
                  </span>

                  {/* Opening Name */}
                  <span className="text-base font-semibold text-slate-800 tracking-tight">
                    {opening.name}
                  </span>
                  
                  {/* Variation Count Badge (Optional nice-to-have) */}
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {opening.variations.length} {opening.variations.length === 1 ? 'variation' : 'variations'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Add Variation Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddVariation(opening);
                    }}
                    className="
                      flex items-center justify-center w-8 h-8 rounded-full 
                      text-gray-400 hover:text-green-600 hover:bg-green-50 
                      transition-all duration-200 group relative
                    "
                    title="Add Variation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </button>

                  {/* Chevron Icon */}
                  <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Variations List */}
              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/50
                  ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}
                `}
              >
                  {opening.variations.length === 0 ? (
                    <div className="p-4 pl-16 text-sm text-gray-400 italic">No variations added yet.</div>
                  ) : (
                    <ul className="py-2">
                      {opening.variations.map((v) => (
                        <li 
                          key={v.id}
                          onClick={() => onVariationClick(opening.name, v)}
                          className="
                            relative flex items-center px-4 py-2.5 pl-16 
                            cursor-pointer hover:bg-white hover:text-blue-600
                            transition-colors text-slate-600 group text-sm font-medium
                          "
                        >
                           {/* Decorative connector line style */}
                           <div className="absolute left-[34px] top-0 bottom-0 w-px bg-gray-200 group-hover:bg-blue-200"></div>
                           <div className="absolute left-[34px] top-1/2 w-4 h-px bg-gray-200 group-hover:bg-blue-200"></div>

                           <span className="truncate">{v.name}</span>
                           
                           {/* Hover hint arrow */}
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity">
                              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                           </svg>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OpeningsList;
