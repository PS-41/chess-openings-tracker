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
  
  // New Props for Edit/Delete
  onEditOpening: (opening: Opening) => void;
  onDeleteOpening: (opening: Opening) => void;
  onEditVariation: (opening: Opening, variation: Variation) => void;
  onDeleteVariation: (openingName: string, variation: Variation) => void;

  // New Props for Selection Mode
  selectionMode: boolean;
  selectedOpenings: Set<number>;
  selectedVariations: Set<number>;
  onToggleOpeningSelection: (id: number) => void;
  onToggleVariationSelection: (id: number) => void;
}

const OpeningsList: React.FC<OpeningsListProps> = ({ 
    openings, 
    side, 
    onVariationClick, 
    onAddVariation,
    onEditOpening,
    onDeleteOpening,
    onEditVariation,
    onDeleteVariation,
    selectionMode,
    selectedOpenings,
    selectedVariations,
    onToggleOpeningSelection,
    onToggleVariationSelection
}) => {
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
          const isOpeningSelected = selectedOpenings.has(opening.id);

          return (
            <li 
              key={opening.id}
              className={`
                bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md
                ${isOpeningSelected ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-100'}
              `}
            >
              {/* Parent Row - Clickable to Expand */}
              <div 
                onClick={() => {
                    if (selectionMode) {
                        onToggleOpeningSelection(opening.id);
                    } else {
                        toggleExpand(opening.id);
                    }
                }}
                className={`
                  relative flex items-center justify-between p-4 cursor-pointer group
                  border-l-[6px] ${accentColor} bg-white hover:bg-gray-50 transition-colors
                `}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Selection Checkbox or Number Badge */}
                  {selectionMode ? (
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={isOpeningSelected}
                            readOnly
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                      </div>
                  ) : (
                    <span 
                        className={`
                        flex-shrink-0 w-8 h-8 flex items-center justify-center 
                        rounded-full font-bold text-xs tracking-tight ${numberBg}
                        `}
                    >
                        {index + 1}
                    </span>
                  )}

                  {/* Opening Name */}
                  <span className="text-base font-semibold text-slate-800 tracking-tight">
                    {opening.name}
                  </span>
                  
                  {/* Variation Count Badge */}
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {opening.variations.length} {opening.variations.length === 1 ? 'variation' : 'variations'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  
                  {!selectionMode && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2 border-r border-gray-200 pr-2 space-x-1">
                          {/* Edit Opening Name */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditOpening(opening); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Rename Opening"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                             </svg>
                          </button>
                          {/* Delete Opening */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteOpening(opening); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Opening"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                             </svg>
                          </button>
                      </div>
                  )}

                  {/* Add Variation Button (Hidden in selection mode) */}
                  {!selectionMode && (
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
                  )}

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
                      {opening.variations.map((v) => {
                          const isVarSelected = selectedVariations.has(v.id);
                          // If parent is selected, variation is implicitly selected visually
                          const isImplicitlySelected = isOpeningSelected;

                          return (
                            <li 
                            key={v.id}
                            onClick={() => {
                                if (selectionMode) {
                                    if (!isOpeningSelected) {
                                        onToggleVariationSelection(v.id);
                                    }
                                } else {
                                    onVariationClick(opening.name, v);
                                }
                            }}
                            className={`
                                relative flex items-center px-4 py-2.5 pl-16 
                                cursor-pointer 
                                transition-all duration-200 ease-in-out text-sm font-medium group
                                /* Updated Hover Styles */
                                hover:bg-blue-50 hover:text-blue-700 hover:pl-[4.25rem]
                                text-slate-600
                                ${isImplicitlySelected || isVarSelected ? 'bg-blue-50/50 text-blue-800' : ''}
                            `}
                            >
                                {/* Decorative connector line style */}
                                <div className={`absolute left-[34px] top-0 bottom-0 w-px ${isImplicitlySelected || isVarSelected ? 'bg-blue-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
                                <div className={`absolute left-[34px] top-1/2 w-4 h-px ${isImplicitlySelected || isVarSelected ? 'bg-blue-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>

                                {selectionMode && (
                                     <div className="mr-3 flex-shrink-0">
                                         <input 
                                            type="checkbox" 
                                            checked={isImplicitlySelected || isVarSelected}
                                            disabled={isOpeningSelected} // Disable if parent selected
                                            readOnly
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                          />
                                     </div>
                                )}

                                <span className={`truncate ${isImplicitlySelected || isVarSelected ? 'font-semibold' : ''}`}>{v.name}</span>
                                
                                {/* Actions for Variation (Hidden in Select Mode) */}
                                {!selectionMode && (
                                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditVariation(opening, v); }}
                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Edit Variation"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteVariation(opening.name, v); }}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Delete Variation"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </li>
                          );
                      })}
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
