import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Data Types
export interface Variation {
  id: number;
  name: string;
  moves: string;
  lichess_link: string;
  image_filename?: string;
  tutorials?: string[];
  notes?: string;
  position: number;
  updated_at?: string;
}

export interface Opening {
  id: number;
  name: string;
  side: 'white' | 'black';
  is_favorite: boolean;
  position: number;
  updated_at?: string;
  variations: Variation[];
}

interface OpeningsListProps {
  openings: Opening[];
  side: 'white' | 'black';
  onVariationClick: (openingName: string, variation: Variation) => void;
  onAddVariation: (opening: Opening) => void;
  
  onEditOpening: (opening: Opening) => void;
  onDeleteOpening: (opening: Opening) => void;
  onEditVariation: (opening: Opening, variation: Variation) => void;
  onDeleteVariation: (openingName: string, variation: Variation) => void;
  
  onToggleFavorite?: (opening: Opening) => void;

  selectionMode: boolean;
  selectedOpenings: Set<number>;
  selectedVariations: Set<number>;
  onToggleOpeningSelection: (id: number) => void;
  onToggleVariationSelection: (id: number) => void;

  // New Reordering Props
  onReorderOpenings?: (newOpenings: Opening[]) => void;
  onReorderVariations?: (openingId: number, newVariations: Variation[]) => void;
  canDrag?: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
};

// --- Sortable Components ---

const SortableVariationItem = ({ 
    variation, 
    openingName, 
    isImplicitlySelected, 
    isSelected, 
    selectionMode, 
    onToggleSelection, 
    onClick, 
    onEdit, 
    onDelete,
    canDrag 
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `var-${variation.id}`, disabled: !canDrag || selectionMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as 'relative',
    };

    return (
        <li 
            ref={setNodeRef} 
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => {
                if (selectionMode) {
                    if (!isImplicitlySelected) onToggleSelection(variation.id);
                } else {
                    onClick(openingName, variation);
                }
            }}
            className={`
                relative flex items-center px-4 py-2.5 pl-16 cursor-grab active:cursor-grabbing
                transition-all duration-200 ease-in-out text-sm font-medium group
                hover:bg-blue-50 hover:text-blue-700 text-slate-600
                ${isImplicitlySelected || isSelected ? 'bg-blue-50/50 text-blue-800' : ''}
                ${selectionMode ? 'cursor-pointer' : ''}
            `}
        >
            <div className={`absolute left-[34px] top-0 bottom-0 w-px ${isImplicitlySelected || isSelected ? 'bg-blue-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>
            <div className={`absolute left-[34px] top-1/2 w-4 h-px ${isImplicitlySelected || isSelected ? 'bg-blue-200' : 'bg-gray-200 group-hover:bg-blue-200'}`}></div>

            {selectionMode && (
                    <div className="mr-3 flex-shrink-0">
                        <input 
                        type="checkbox" 
                        checked={isImplicitlySelected || isSelected}
                        disabled={isImplicitlySelected}
                        readOnly
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        />
                    </div>
            )}

            <div className="flex-1 min-w-0 flex items-center gap-3">
               <span className={`truncate ${isImplicitlySelected || isSelected ? 'font-semibold' : ''}`}>{variation.name}</span>
               {variation.updated_at && (
                   <span className="text-[10px] text-gray-300 group-hover:text-blue-400 font-normal">
                      {formatDate(variation.updated_at)}
                   </span>
               )}
            </div>
            
            {!selectionMode && (
                <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(variation); }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Variation"
                        onPointerDown={(e) => e.stopPropagation()} 
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(variation); }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Variation"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            )}
        </li>
    );
};

const SortableOpeningItem = ({ 
    opening, 
    index, 
    numberBg, 
    accentColor, 
    isExpanded, 
    isSelected, 
    selectionMode, 
    toggleExpand, 
    onToggleSelection, 
    onToggleFavorite, 
    onEdit, 
    onDelete, 
    onAddVariation,
    children,
    canDrag
}: any) => {
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `op-${opening.id}`, disabled: !canDrag || selectionMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as 'relative',
    };
    
    return (
        <li 
            ref={setNodeRef} 
            style={style}
            className={`
                bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 
                ${isSelected ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-100'}
                ${isDragging ? 'shadow-xl scale-[1.02] border-blue-200' : 'hover:shadow-md'}
            `}
        >
             <div 
                {...attributes}
                {...listeners}
                onClick={() => selectionMode ? onToggleSelection(opening.id) : toggleExpand(opening.id)}
                className={`
                  relative flex items-center justify-between p-4 cursor-pointer group
                  border-l-[6px] ${accentColor} bg-white hover:bg-gray-50 transition-colors
                  ${!selectionMode && canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
              >
                <div className="flex items-center gap-4 flex-1">
                  {selectionMode ? (
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                      </div>
                  ) : (
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs tracking-tight ${numberBg}`}>
                        {index + 1}
                    </span>
                  )}

                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="text-base font-semibold text-slate-800 tracking-tight">
                            {opening.name}
                        </span>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                            {opening.variations.length} {opening.variations.length === 1 ? 'variation' : 'variations'}
                        </span>
                      </div>
                      {opening.updated_at && (
                          <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                              Updated: {formatDate(opening.updated_at)}
                          </span>
                      )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  
                  {!selectionMode && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2 border-r border-gray-200 pr-2 space-x-1">
                          
                          {onToggleFavorite && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(opening); }}
                                className={`p-1.5 rounded-full transition-colors ${opening.is_favorite ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}`}
                                title={opening.is_favorite ? "Unfavorite" : "Favorite"}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(opening); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Rename Opening"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                             </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(opening); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Opening"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                             </svg>
                          </button>
                      </div>
                  )}

                  {!selectionMode && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddVariation(opening); }}
                        className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                        title="Add Variation"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                    </button>
                  )}

                  <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50/50 ${isExpanded ? 'max-h-[800px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                   {children}
              </div>
        </li>
    );
};

// --- Main Component ---

const OpeningsList: React.FC<OpeningsListProps> = ({ 
    openings, 
    side, 
    onVariationClick, 
    onAddVariation,
    onEditOpening,
    onDeleteOpening,
    onEditVariation,
    onDeleteVariation,
    onToggleFavorite,
    selectionMode,
    selectedOpenings,
    selectedVariations,
    onToggleOpeningSelection,
    onToggleVariationSelection,
    onReorderOpenings,
    onReorderVariations,
    canDrag = false
}) => {
  const filteredData = openings.filter(o => o.side === side);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) {
          return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);

      // Handle Opening Reorder
      if (activeId.startsWith('op-') && overId.startsWith('op-') && onReorderOpenings) {
          const oldIndex = filteredData.findIndex(o => `op-${o.id}` === activeId);
          const newIndex = filteredData.findIndex(o => `op-${o.id}` === overId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
              const newOrder = arrayMove(filteredData, oldIndex, newIndex);
              onReorderOpenings(newOrder);
          }
      }
      
      // Handle Variation Reorder
      else if (activeId.startsWith('var-') && overId.startsWith('var-') && onReorderVariations) {
          const parentOpening = filteredData.find(o => o.variations.some(v => `var-${v.id}` === activeId));
          
          if (parentOpening) {
               const oldIndex = parentOpening.variations.findIndex(v => `var-${v.id}` === activeId);
               const newIndex = parentOpening.variations.findIndex(v => `var-${v.id}` === overId);

               if (oldIndex !== -1 && newIndex !== -1) {
                   const newVariations = arrayMove(parentOpening.variations, oldIndex, newIndex);
                   onReorderVariations(parentOpening.id, newVariations);
               }
          }
      }
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
      <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
      >
        <SortableContext 
            items={filteredData.map(o => `op-${o.id}`)} 
            strategy={verticalListSortingStrategy}
            disabled={!canDrag || selectionMode}
        >
          <ul className="space-y-3">
            {filteredData.map((opening, index) => {
              const isExpanded = expandedIds.has(opening.id);
              const isOpeningSelected = selectedOpenings.has(opening.id);

              return (
                <SortableOpeningItem
                   key={`op-${opening.id}`}
                   opening={opening}
                   index={index}
                   numberBg={numberBg}
                   accentColor={accentColor}
                   isExpanded={isExpanded}
                   isSelected={isOpeningSelected}
                   selectionMode={selectionMode}
                   toggleExpand={toggleExpand}
                   onToggleSelection={onToggleOpeningSelection}
                   onToggleFavorite={onToggleFavorite}
                   onEdit={onEditOpening}
                   onDelete={onDeleteOpening}
                   onAddVariation={onAddVariation}
                   canDrag={canDrag}
                >
                   {opening.variations.length === 0 ? (
                      <div className="p-4 pl-16 text-sm text-gray-400 italic">No variations added yet.</div>
                   ) : (
                      <SortableContext 
                         items={opening.variations.map(v => `var-${v.id}`)} 
                         strategy={verticalListSortingStrategy}
                         disabled={!canDrag || selectionMode}
                      >
                         <ul className="py-2">
                             {opening.variations.map((v) => (
                                 <SortableVariationItem
                                    key={`var-${v.id}`}
                                    variation={v}
                                    openingName={opening.name}
                                    isImplicitlySelected={isOpeningSelected}
                                    isSelected={selectedVariations.has(v.id)}
                                    selectionMode={selectionMode}
                                    onToggleSelection={onToggleVariationSelection}
                                    onClick={onVariationClick}
                                    onEdit={(vr: any) => onEditVariation(opening, vr)}
                                    onDelete={(vr: any) => onDeleteVariation(opening.name, vr)}
                                    canDrag={canDrag}
                                 />
                             ))}
                         </ul>
                      </SortableContext>
                   )}
                </SortableOpeningItem>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default OpeningsList;
