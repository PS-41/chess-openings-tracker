import { useState, useEffect } from 'react';
import axios from 'axios';
import OpeningsList, { type Opening, type Variation } from './components/OpeningsList';
import Modal from './components/Modal';
import AddOpeningForm from './components/AddOpeningForm';
import OpeningDetails from './components/OpeningDetails';
import EditOpeningNameForm from './components/EditOpeningNameForm';

type ViewMode = 'split' | 'toggle';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');
  
  // Data State
  const [openings, setOpenings] = useState<Opening[]>([]);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOpeningIds, setSelectedOpeningIds] = useState<Set<number>>(new Set());
  const [selectedVariationIds, setSelectedVariationIds] = useState<Set<number>>(new Set());

  // Modal State for Adding/Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  
  // Modal State for Rename Opening
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Opening | null>(null);

  // Details Modal State
  const [selectedVariation, setSelectedVariation] = useState<{name: string, data: Variation, openingData: Opening} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Delete Warning Modal
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<{openings: number[], variations: number[]} | null>(null);

  const isSplit = viewMode === 'split';

  const fetchOpenings = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/openings');
      setOpenings(response.data);
    } catch (error) {
      console.error("Error fetching openings:", error);
    }
  };

  useEffect(() => {
    fetchOpenings();
  }, []);

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    setEditingOpening(null);
    setEditingVariation(null);
    fetchOpenings(); 
  };
  
  const handleRenameSuccess = () => {
      setIsRenameModalOpen(false);
      setRenameTarget(null);
      fetchOpenings();
  };

  // --- Modal Helpers ---
  const openAddModal = (openingToAddTo: Opening | null = null) => {
    setEditingOpening(openingToAddTo);
    setEditingVariation(null); // Ensure no variation edit
    setIsModalOpen(true);
  };

  const openEditVariationModal = (opening: Opening, variation: Variation) => {
      setEditingOpening(opening);
      setEditingVariation(variation);
      setIsModalOpen(true);
  };
  
  const openRenameModal = (opening: Opening) => {
      setRenameTarget(opening);
      setIsRenameModalOpen(true);
  };

  const handleVariationClick = (openingName: string, variation: Variation) => {
    // Find parent opening object for context
    const parent = openings.find(o => o.variations.some(v => v.id === variation.id));
    if (parent) {
        setSelectedVariation({ name: openingName, data: variation, openingData: parent });
        setIsDetailsOpen(true);
    }
  };

  // --- Deletion Logic ---
  const requestDeleteOpening = (opening: Opening) => {
      setItemsToDelete({ openings: [opening.id], variations: [] });
      setIsDeleteWarningOpen(true);
  };

  const requestDeleteVariation = (openingName: string, variation: Variation) => {
      setItemsToDelete({ openings: [], variations: [variation.id] });
      setIsDeleteWarningOpen(true);
  };

  const requestBatchDelete = () => {
      setItemsToDelete({
          openings: Array.from(selectedOpeningIds),
          variations: Array.from(selectedVariationIds)
      });
      setIsDeleteWarningOpen(true);
  };

  const confirmDelete = async () => {
      if (!itemsToDelete) return;

      try {
          if (itemsToDelete.openings.length === 1 && itemsToDelete.variations.length === 0) {
              await axios.delete(`http://127.0.0.1:5000/api/openings/${itemsToDelete.openings[0]}`);
          } else if (itemsToDelete.openings.length === 0 && itemsToDelete.variations.length === 1) {
               await axios.delete(`http://127.0.0.1:5000/api/variations/${itemsToDelete.variations[0]}`);
          } else {
              // Batch Delete
              await axios.post('http://127.0.0.1:5000/api/batch-delete', itemsToDelete);
          }
          
          // Cleanup UI
          setIsDeleteWarningOpen(false);
          setItemsToDelete(null);
          setIsDetailsOpen(false); // Close details if open
          
          // Reset Selection
          setIsSelectionMode(false);
          setSelectedOpeningIds(new Set());
          setSelectedVariationIds(new Set());
          
          fetchOpenings();
      } catch (error) {
          console.error("Delete failed", error);
          alert("Failed to delete items. Please try again.");
      }
  };

  // --- Selection Logic ---
  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          // Cancel Selection
          setIsSelectionMode(false);
          setSelectedOpeningIds(new Set());
          setSelectedVariationIds(new Set());
      } else {
          setIsSelectionMode(true);
      }
  };

  const toggleOpeningSelection = (id: number) => {
      const newSet = new Set(selectedOpeningIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedOpeningIds(newSet);
  };

  const toggleVariationSelection = (id: number) => {
      const newSet = new Set(selectedVariationIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedVariationIds(newSet);
  };

  const totalSelected = selectedOpeningIds.size + selectedVariationIds.size;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24">
      
      {/* --- Header --- */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">♟️</span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Chess Openings
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-end">
             
             {/* Select / Edit Mode Toggle */}
             <button
                onClick={toggleSelectionMode}
                className={`
                    px-4 py-2 text-sm font-semibold rounded-lg transition-all
                    ${isSelectionMode 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}
                `}
             >
                 {isSelectionMode ? 'Cancel Selection' : 'Select / Manage'}
             </button>

             {/* View Toggle (Segmented Control) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('toggle')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  !isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Single
              </button>
            </div>

             {/* Add Button */}
             <button 
                onClick={() => openAddModal(null)}
                className="
                  flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white 
                  px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md 
                  hover:shadow-lg active:scale-95
                "
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                New Opening
             </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        
        {!isSplit && (
          <div className="flex justify-center mb-8">
            <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
              <button
                onClick={() => setActiveSide('white')}
                className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSide === 'white' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setActiveSide('black')}
                className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSide === 'black' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Black
              </button>
            </div>
          </div>
        )}

        {isSplit ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* White Column */}
            <div className="flex-1">
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 min-h-[500px]">
                <h2 className="text-xl font-bold mb-6 text-amber-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  White
                </h2>
                <OpeningsList 
                  side="white" 
                  openings={openings} 
                  onVariationClick={handleVariationClick}
                  onAddVariation={(op) => openAddModal(op)}
                  onEditOpening={openRenameModal}
                  onDeleteOpening={requestDeleteOpening}
                  onEditVariation={openEditVariationModal}
                  onDeleteVariation={requestDeleteVariation}
                  selectionMode={isSelectionMode}
                  selectedOpenings={selectedOpeningIds}
                  selectedVariations={selectedVariationIds}
                  onToggleOpeningSelection={toggleOpeningSelection}
                  onToggleVariationSelection={toggleVariationSelection}
                />
              </div>
            </div>

            {/* Black Column */}
            <div className="flex-1">
              <div className="bg-slate-200/50 p-6 rounded-2xl border border-slate-300 min-h-[500px]">
                <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                  Black
                </h2>
                <OpeningsList 
                  side="black" 
                  openings={openings} 
                  onVariationClick={handleVariationClick}
                  onAddVariation={(op) => openAddModal(op)}
                  onEditOpening={openRenameModal}
                  onDeleteOpening={requestDeleteOpening}
                  onEditVariation={openEditVariationModal}
                  onDeleteVariation={requestDeleteVariation}
                  selectionMode={isSelectionMode}
                  selectedOpenings={selectedOpeningIds}
                  selectedVariations={selectedVariationIds}
                  onToggleOpeningSelection={toggleOpeningSelection}
                  onToggleVariationSelection={toggleVariationSelection}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
             <div className={`p-8 rounded-2xl shadow-sm border transition-colors duration-500 ${
               activeSide === 'white' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-100 border-slate-200'
             }`}>
               <OpeningsList 
                 side={activeSide} 
                 openings={openings} 
                 onVariationClick={handleVariationClick}
                 onAddVariation={(op) => openAddModal(op)}
                 onEditOpening={openRenameModal}
                 onDeleteOpening={requestDeleteOpening}
                 onEditVariation={openEditVariationModal}
                 onDeleteVariation={requestDeleteVariation}
                 selectionMode={isSelectionMode}
                 selectedOpenings={selectedOpeningIds}
                 selectedVariations={selectedVariationIds}
                 onToggleOpeningSelection={toggleOpeningSelection}
                 onToggleVariationSelection={toggleVariationSelection}
               />
             </div>
          </div>
        )}
      </main>

      {/* --- Batch Delete Action Bar --- */}
      {isSelectionMode && totalSelected > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-30 animate-fade-in-up">
              <div className="text-sm font-medium">
                  {totalSelected} item{totalSelected !== 1 && 's'} selected
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <button 
                onClick={requestBatchDelete}
                className="flex items-center gap-2 text-red-300 hover:text-red-200 font-semibold transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete Selected
              </button>
          </div>
      )}

      {/* --- Modal for Adding/Editing Opening/Variation --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={
            editingVariation 
                ? `Edit ${editingVariation.name}` 
                : editingOpening 
                    ? `Add Variation to ${editingOpening.name}` 
                    : "Create New Opening"
        }
      >
        <AddOpeningForm 
          onSuccess={handleAddSuccess} 
          onCancel={() => setIsModalOpen(false)} 
          initialOpeningName={editingOpening?.name}
          initialSide={editingOpening?.side}
          initialVariationData={editingVariation || undefined}
        />
      </Modal>

      {/* --- Modal for Renaming Opening --- */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Opening"
      >
        {renameTarget && (
            <EditOpeningNameForm
                openingId={renameTarget.id}
                currentName={renameTarget.name}
                onSuccess={handleRenameSuccess}
                onCancel={() => setIsRenameModalOpen(false)}
            />
        )}
      </Modal>

      {/* --- Modal for Viewing Details --- */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedVariation?.name || 'Details'}
      >
        {selectedVariation && (
            <OpeningDetails 
                openingName={selectedVariation.name} 
                variation={selectedVariation.data} 
                onEdit={(v) => {
                    // Close details and open edit form
                    setIsDetailsOpen(false);
                    openEditVariationModal(selectedVariation.openingData, v);
                }}
                onDelete={(v) => {
                    // Close details and prompt delete
                    setIsDetailsOpen(false);
                    requestDeleteVariation(selectedVariation.name, v);
                }}
            />
        )}
      </Modal>

      {/* --- Delete Confirmation Modal --- */}
      <Modal
          isOpen={isDeleteWarningOpen}
          onClose={() => setIsDeleteWarningOpen(false)}
          title="Confirm Deletion"
      >
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 text-red-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                      <h4 className="font-bold">Warning: Permanent Action</h4>
                      <p className="text-sm mt-1 opacity-90">
                          This action cannot be undone. 
                          {itemsToDelete?.openings.length ? ' Deleting an opening will also delete ALL its variations.' : ''}
                      </p>
                  </div>
              </div>
              
              <p className="text-gray-600">
                  Are you sure you want to delete 
                  <span className="font-bold text-gray-900">
                      {itemsToDelete ? (
                           ` ${itemsToDelete.openings.length + itemsToDelete.variations.length} item(s)`
                      ) : ''}
                  </span>?
              </p>

              <div className="flex justify-end gap-3 pt-4">
                  <button 
                      onClick={() => setIsDeleteWarningOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={confirmDelete}
                      className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm font-medium transition-colors"
                  >
                      Yes, Delete
                  </button>
              </div>
          </div>
      </Modal>

    </div>
  );
}

export default App;
