import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import OpeningsList, { type Opening, type Variation } from '../components/OpeningsList';
import Modal from '../components/Modal';
import OpeningDetails from '../components/OpeningDetails';
import EditOpeningNameForm from '../components/EditOpeningNameForm';
import AddOpeningForm from '../components/AddOpeningForm';

type ViewMode = 'split' | 'toggle';

function FavoritesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<{name: string, data: Variation, openingData: Opening} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reused Modal States for basic editing if allowed
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Opening | null>(null);
  const [isEditVarModalOpen, setIsEditVarModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);

  const navigate = useNavigate();
  const isSplit = viewMode === 'split';

  const fetchFavorites = async () => {
    try {
      // Fetch only private favorites
      const response = await axios.get('/api/openings?mode=private&favorites=true', { withCredentials: true });
      setOpenings(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (opening: Opening) => {
      try {
          await axios.post(`/api/openings/${opening.id}/favorite`, {}, { withCredentials: true });
          fetchFavorites(); // Refresh list to remove unfavorited item
      } catch (e) {
          console.error(e);
      }
  };

  const deleteOpening = async (opening: Opening) => {
      if(!confirm(`Delete "${opening.name}"?`)) return;
      try {
          await axios.delete(`/api/openings/${opening.id}`, { withCredentials: true });
          fetchFavorites();
      } catch(e) { console.error(e); }
  };

  const deleteVariation = async (_name: string, variation: Variation) => {
    if(!confirm(`Delete variation "${variation.name}"?`)) return;
    try {
        await axios.delete(`/api/variations/${variation.id}`, { withCredentials: true });
        fetchFavorites();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24">
       <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setViewMode('toggle')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        !isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Single
                    </button>
                 </div>

                <Link to="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-slate-900 flex items-center gap-1">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-4">
        {loading ? <p className="text-center text-gray-500">Loading...</p> : (
             <>
                 {!isSplit && (
                    <div className="flex justify-center mb-8">
                    </div>
                 )}

                 <div className={`flex flex-col ${isSplit ? 'lg:flex-row' : ''} gap-8`}>
                     <div className="flex-1">
                        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                            <h2 className="text-xl font-bold mb-6 text-amber-900">White Repertoire</h2>
                            <OpeningsList 
                                side="white"
                                openings={openings}
                                onVariationClick={(name, v) => {
                                    const parent = openings.find(o => o.variations.some(vary => vary.id === v.id));
                                    if(parent) { setSelectedVariation({name, data: v, openingData: parent}); setIsDetailsOpen(true); }
                                }}
                                onAddVariation={(op) => { setEditingOpening(op); setEditingVariation(null); setIsEditVarModalOpen(true); }}
                                onEditOpening={(op) => { setRenameTarget(op); setIsRenameModalOpen(true); }}
                                onDeleteOpening={deleteOpening}
                                onEditVariation={(op, v) => { setEditingOpening(op); setEditingVariation(v); setIsEditVarModalOpen(true); }}
                                onDeleteVariation={deleteVariation}
                                onToggleFavorite={handleToggleFavorite}
                                selectionMode={false}
                                selectedOpenings={new Set()}
                                selectedVariations={new Set()}
                                onToggleOpeningSelection={() => {}}
                                onToggleVariationSelection={() => {}}
                            />
                        </div>
                     </div>
                     
                     <div className="flex-1">
                        <div className="bg-slate-200/50 p-6 rounded-2xl border border-slate-300">
                            <h2 className="text-xl font-bold mb-6 text-slate-800">Black Repertoire</h2>
                            <OpeningsList 
                                side="black"
                                openings={openings}
                                onVariationClick={(name, v) => {
                                    const parent = openings.find(o => o.variations.some(vary => vary.id === v.id));
                                    if(parent) { setSelectedVariation({name, data: v, openingData: parent}); setIsDetailsOpen(true); }
                                }}
                                onAddVariation={(op) => { setEditingOpening(op); setEditingVariation(null); setIsEditVarModalOpen(true); }}
                                onEditOpening={(op) => { setRenameTarget(op); setIsRenameModalOpen(true); }}
                                onDeleteOpening={deleteOpening}
                                onEditVariation={(op, v) => { setEditingOpening(op); setEditingVariation(v); setIsEditVarModalOpen(true); }}
                                onDeleteVariation={deleteVariation}
                                onToggleFavorite={handleToggleFavorite}
                                selectionMode={false}
                                selectedOpenings={new Set()}
                                selectedVariations={new Set()}
                                onToggleOpeningSelection={() => {}}
                                onToggleVariationSelection={() => {}}
                            />
                        </div>
                     </div>
                 </div>
             </>
        )}
      </main>

       {/* Details Modal */}
       <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={selectedVariation?.name || 'Details'}>
        {selectedVariation && (
            <OpeningDetails 
                openingName={selectedVariation.name} 
                variation={selectedVariation.data} 
            />
        )}
      </Modal>

      {/* Basic Edit Modals to keep consistency */}
      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Opening">
        {renameTarget && <EditOpeningNameForm openingId={renameTarget.id} currentName={renameTarget.name} onSuccess={() => { setIsRenameModalOpen(false); fetchFavorites(); }} onCancel={() => setIsRenameModalOpen(false)} />}
      </Modal>
      <Modal isOpen={isEditVarModalOpen} onClose={() => setIsEditVarModalOpen(false)} title={editingVariation ? "Edit Variation" : "Add Variation"}>
          <AddOpeningForm 
             onSuccess={() => { setIsEditVarModalOpen(false); fetchFavorites(); }} 
             onCancel={() => setIsEditVarModalOpen(false)}
             initialOpeningName={editingOpening?.name}
             initialSide={editingOpening?.side}
             initialVariationData={editingVariation || undefined}
           />
      </Modal>
    </div>
  );
}

export default FavoritesPage;
