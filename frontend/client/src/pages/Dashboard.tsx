import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import OpeningsList, { type Opening, type Variation } from '../components/OpeningsList';
import Modal from '../components/Modal';
import AddOpeningForm from '../components/AddOpeningForm';
import OpeningDetails from '../components/OpeningDetails';
import EditOpeningNameForm from '../components/EditOpeningNameForm';
import AdminGuardModal from '../components/AdminGuardModal';
import ImportModal from '../components/ImportModal';

type ViewMode = 'split' | 'toggle';

function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');
  const [openings, setOpenings] = useState<Opening[]>([]);
  
  // Auth State
  const [user, setUser] = useState<{username: string} | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Modals & Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOpeningIds, setSelectedOpeningIds] = useState<Set<number>>(new Set());
  const [selectedVariationIds, setSelectedVariationIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Opening | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<{name: string, data: Variation, openingData: Opening} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<{openings: number[], variations: number[]} | null>(null);

  // New Modals
  const [isAdminGuardOpen, setIsAdminGuardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestMode = searchParams.get('mode') === 'guest';
  const isSplit = viewMode === 'split';

  // Handler for favoriting
  const handleToggleFavorite = async (opening: Opening) => {
      try {
          await axios.post(`/api/openings/${opening.id}/favorite`, {}, { withCredentials: true });
          setOpenings(prev => prev.map(o => o.id === opening.id ? { ...o, is_favorite: !o.is_favorite } : o));
      } catch (e) {
          console.error("Favorite toggle failed", e);
      }
  };

  // Check Auth & Fetch Data
  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await axios.get('/api/auth/me', { withCredentials: true });
        if (authRes.data.authenticated) {
            setUser(authRes.data.user);
            if (isGuestMode) {
               // If logged in but url says guest, remove param to show user dash
               navigate('/dashboard', { replace: true });
            }
        } else {
            // Not logged in
            if (!isGuestMode) {
                // Redirect to landing if trying to access private dash without auth
                navigate('/');
            }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoadingAuth(false);
      }
    };
    init();
  }, [isGuestMode, navigate]);

  const fetchOpenings = async () => {
    try {
      const mode = isGuestMode ? 'public' : 'private';
      const response = await axios.get(`/api/openings?mode=${mode}`, { withCredentials: true });
      setOpenings(response.data);
    } catch (error) {
      console.error("Error fetching openings:", error);
    }
  };

  useEffect(() => {
    if (!loadingAuth) fetchOpenings();
  }, [loadingAuth, isGuestMode]);


  // --- Logic Wrappers for Guest Mode ---
  const requirePermission = (action: () => void) => {
    if (!isGuestMode) {
        // User Mode: Always allow (backend validates ownership)
        action();
    } else {
        // Guest Mode: Check if admin
        if (isAdminMode) {
            action();
        } else {
            setPendingAction(() => action);
            setIsAdminGuardOpen(true);
        }
    }
  };

  const handleAdminSuccess = () => {
      setIsAdminMode(true);
      setIsAdminGuardOpen(false);
      if (pendingAction) {
          pendingAction();
          setPendingAction(null);
      }
  };

  const handleLogout = async () => {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      navigate('/');
  };

  // --- Normal Handlers (wrapped with permission check) ---
  const openAddModal = (openingToAddTo: Opening | null = null) => {
    requirePermission(() => {
        setEditingOpening(openingToAddTo);
        setEditingVariation(null);
        setIsModalOpen(true);
    });
  };

  const openEditVariationModal = (opening: Opening, variation: Variation) => {
      requirePermission(() => {
        setEditingOpening(opening);
        setEditingVariation(variation);
        setIsModalOpen(true);
      });
  };
  
  const openRenameModal = (opening: Opening) => {
      requirePermission(() => {
        setRenameTarget(opening);
        setIsRenameModalOpen(true);
      });
  };

  // --- Deletion Logic ---
  const confirmDelete = async () => {
      if (!itemsToDelete) return;
      try {
          if (itemsToDelete.openings.length === 1 && itemsToDelete.variations.length === 0) {
              await axios.delete(`/api/openings/${itemsToDelete.openings[0]}`, { withCredentials: true });
          } else if (itemsToDelete.openings.length === 0 && itemsToDelete.variations.length === 1) {
               await axios.delete(`/api/variations/${itemsToDelete.variations[0]}`, { withCredentials: true });
          } else {
              await axios.post('/api/batch-delete', itemsToDelete, { withCredentials: true });
          }
          setIsDeleteWarningOpen(false);
          setItemsToDelete(null);
          setIsDetailsOpen(false);
          setIsSelectionMode(false);
          setSelectedOpeningIds(new Set());
          setSelectedVariationIds(new Set());
          fetchOpenings();
      } catch (error) {
          console.error("Delete failed", error);
          alert("Failed to delete items.");
      }
  };

  const requestDeleteOpening = (opening: Opening) => {
      requirePermission(() => {
        setItemsToDelete({ openings: [opening.id], variations: [] });
        setIsDeleteWarningOpen(true);
      });
  };

  const requestDeleteVariation = (openingName: string, variation: Variation) => {
      requirePermission(() => {
        setItemsToDelete({ openings: [], variations: [variation.id] });
        setIsDeleteWarningOpen(true);
      });
  };

  const requestBatchDelete = () => {
      requirePermission(() => {
        setItemsToDelete({
            openings: Array.from(selectedOpeningIds),
            variations: Array.from(selectedVariationIds)
        });
        setIsDeleteWarningOpen(true);
      });
  };

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24">
      
      {/* --- Header --- */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">♟️</span>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                Chess Openings
                </h1>
                <div className="text-xs font-semibold uppercase tracking-widest mt-1 text-blue-600">
                    {isGuestMode ? (isAdminMode ? 'Guest Admin Mode' : 'Guest View') : `Dashboard • ${user?.username}`}
                    {isGuestMode && isAdminMode && (
                        <button
                            onClick={async () => {
                            await axios.post('/api/auth/exit-admin', {}, { withCredentials: true });
                            setIsAdminMode(false);
                            }}
                            className="text-sm font-medium text-gray-600 hover:text-red-600 px-2"
                        >
                            Exit Admin
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
             
             {!isGuestMode && (
                 <>
                    <Link to="/favorites" className="text-sm font-medium text-gray-600 hover:text-amber-600 px-2 flex items-center gap-1">
                        <span>⭐</span> Favorites
                    </Link>
                    <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-blue-600 px-2 flex items-center gap-1">
                        <span>👤</span> Profile
                    </Link>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                 </>
             )}

             <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 mr-2">
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

             {!isGuestMode && (
                 <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 px-2"
                 >
                    Import Public
                 </button>
             )}

             {isGuestMode && !isAdminMode && (
                 <button onClick={() => navigate('/login')} className="text-sm font-medium text-blue-600 hover:underline">
                     Login to create own
                 </button>
             )}

             <button
                onClick={() => {
                     if (isSelectionMode) { setIsSelectionMode(false); setSelectedOpeningIds(new Set()); setSelectedVariationIds(new Set()); }
                     else setIsSelectionMode(true);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isSelectionMode ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
             >
                 {isSelectionMode ? 'Cancel' : 'Select'}
             </button>

             <button 
                onClick={() => openAddModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-all"
             >
                + New Opening
             </button>
             
             {!isGuestMode && (
                 <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 ml-2" title="Logout">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                 </button>
             )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        {/* View Toggle & Side Toggle (Simplified for brevity, logic same as before) */}
        {!isSplit && (
             <div className="flex justify-center mb-8">
                 <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                    {['white', 'black'].map((side) => (
                        <button key={side} onClick={() => setActiveSide(side as any)} className={`px-8 py-2 rounded-lg text-sm font-semibold capitalize ${activeSide === side ? (side === 'white' ? 'bg-amber-100 text-amber-900' : 'bg-slate-800 text-white') : 'text-gray-500'}`}>
                            {side}
                        </button>
                    ))}
                 </div>
             </div>
        )}
        
        {/* Render Lists */}
        <div className={isSplit ? "flex flex-col lg:flex-row gap-8" : "max-w-3xl mx-auto"}>
             {/* Reuse OpeningsList Logic from previous App.tsx here... */}
             {/* I'm condensing the list rendering logic since it's identical to previous, just wrapped in filtered OpeningsList components */}
             {(isSplit ? ['white', 'black'] : [activeSide]).map((side) => (
                 <div key={side} className={`flex-1 ${isSplit ? '' : 'p-8 rounded-2xl shadow-sm border ' + (activeSide === 'white' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-100 border-slate-200')}`}>
                    {isSplit && (
                        <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${side === 'white' ? 'text-amber-900' : 'text-slate-800'}`}>
                            <span className={`w-3 h-3 rounded-full ${side === 'white' ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                            {side.charAt(0).toUpperCase() + side.slice(1)}
                        </h2>
                    )}
                    <div className={isSplit ? (side === 'white' ? 'bg-amber-50/50 p-6 rounded-2xl border border-amber-100' : 'bg-slate-200/50 p-6 rounded-2xl border border-slate-300') : ''}>
                        <OpeningsList 
                            side={side as 'white' | 'black'}
                            openings={openings}
                            onVariationClick={(name, v) => {
                                const parent = openings.find(o => o.variations.some(vary => vary.id === v.id));
                                if(parent) { setSelectedVariation({name, data: v, openingData: parent}); setIsDetailsOpen(true); }
                            }}
                            onAddVariation={openAddModal}
                            onEditOpening={openRenameModal}
                            onDeleteOpening={requestDeleteOpening}
                            onEditVariation={openEditVariationModal}
                            onDeleteVariation={requestDeleteVariation}
                            onToggleFavorite={!isGuestMode ? handleToggleFavorite : undefined}
                            selectionMode={isSelectionMode}
                            selectedOpenings={selectedOpeningIds}
                            selectedVariations={selectedVariationIds}
                            onToggleOpeningSelection={(id) => { const s = new Set(selectedOpeningIds); if(s.has(id)) s.delete(id); else s.add(id); setSelectedOpeningIds(s); }}
                            onToggleVariationSelection={(id) => { const s = new Set(selectedVariationIds); if(s.has(id)) s.delete(id); else s.add(id); setSelectedVariationIds(s); }}
                        />
                    </div>
                 </div>
             ))}
        </div>
      </main>

      {/* --- Batch Delete Bar --- */}
      {isSelectionMode && (selectedOpeningIds.size + selectedVariationIds.size) > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-30 animate-fade-in-up">
              <div className="text-sm font-medium">{selectedOpeningIds.size + selectedVariationIds.size} selected</div>
              <button onClick={requestBatchDelete} className="text-red-300 hover:text-red-200 font-semibold flex items-center gap-2">Delete Selected</button>
          </div>
      )}

      {/* --- Modals --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVariation ? "Edit Variation" : editingOpening ? `Add to ${editingOpening.name}` : "New Opening"}>
        <AddOpeningForm onSuccess={() => { setIsModalOpen(false); fetchOpenings(); }} onCancel={() => setIsModalOpen(false)} initialOpeningName={editingOpening?.name} initialSide={editingOpening?.side} initialVariationData={editingVariation || undefined} />
      </Modal>

      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Opening">
        {renameTarget && <EditOpeningNameForm openingId={renameTarget.id} currentName={renameTarget.name} onSuccess={() => { setIsRenameModalOpen(false); fetchOpenings(); }} onCancel={() => setIsRenameModalOpen(false)} />}
      </Modal>
      
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={selectedVariation?.name || 'Details'}>
        {selectedVariation && <OpeningDetails openingName={selectedVariation.name} variation={selectedVariation.data} onEdit={(v) => { setIsDetailsOpen(false); openEditVariationModal(selectedVariation.openingData, v); }} onDelete={(v) => { setIsDetailsOpen(false); requestDeleteVariation(selectedVariation.name, v); }} />}
      </Modal>

      <Modal isOpen={isDeleteWarningOpen} onClose={() => setIsDeleteWarningOpen(false)} title="Confirm Deletion">
          <div className="space-y-4">
            <p className="text-gray-600">Are you sure you want to delete these items?</p>
            <div className="flex justify-end gap-3"><button onClick={() => setIsDeleteWarningOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white rounded-lg">Yes, Delete</button></div>
          </div>
      </Modal>

      {/* --- New Security Modals --- */}
      <AdminGuardModal isOpen={isAdminGuardOpen} onClose={() => setIsAdminGuardOpen(false)} onSuccess={handleAdminSuccess} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={fetchOpenings} />

    </div>
  );
}

export default Dashboard;
