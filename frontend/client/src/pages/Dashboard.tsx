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
               navigate('/dashboard', { replace: true });
            }
        } else {
            if (!isGuestMode) {
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
        action();
    } else {
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

  // --- Normal Handlers ---
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
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left Side: Brand -> Actions -> Nav */}
          <div className="flex items-center gap-6 w-full md:w-auto">
              
              {/* Brand */}
              <div className="flex items-center gap-2">
                <span className="text-3xl">♟️</span>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                   Chess Openings
                </h1>
              </div>

              {/* Primary Actions (New & Import) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddModal(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 ring-1 ring-white/25"
                    aria-hidden="true"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 4.75a.75.75 0 01.75.75v3.75h3.75a.75.75 0 010 1.5h-3.75v3.75a.75.75 0 01-1.5 0v-3.75H5.5a.75.75 0 010-1.5h3.75V5.5a.75.75 0 01.75-.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  New
                </button>

                {!isGuestMode && (
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-white text-slate-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-slate-900 transition-all shadow-sm"
                  >
                    Import
                  </button>
                )}
              </div>
              
              {/* Navigation Divider */}
              {!isGuestMode && <div className="h-6 w-px bg-gray-200 hidden md:block"></div>}

              {/* Navigation Links */}
              {!isGuestMode && (
                  <nav className="hidden md:flex items-center gap-1">
                      <Link 
                        to="/dashboard" 
                        className="px-3 py-2 text-sm font-semibold text-slate-900 bg-gray-100 rounded-lg transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/favorites" 
                        className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-amber-600 rounded-lg hover:bg-white transition-colors"
                      >
                        Favorites
                      </Link>
                  </nav>
              )}
          </div>

          {/* Right Side: View Controls -> Select -> Profile -> Logout */}
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
             
             {/* Guest Admin Controls */}
             {isGuestMode && (
                 <div className="flex items-center gap-2 mr-2">
                     <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                        {isAdminMode ? 'Admin Mode' : 'Guest View'}
                     </span>
                     {isAdminMode ? (
                        <button onClick={async () => { await axios.post('/api/auth/exit-admin', {}, { withCredentials: true }); setIsAdminMode(false); }} className="text-xs text-red-500 hover:underline">Exit</button>
                     ) : (
                        <button onClick={() => navigate('/login')} className="text-xs text-blue-600 hover:underline">Login</button>
                     )}
                 </div>
             )}

             {/* View Toggles */}
             <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button onClick={() => setViewMode('split')} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Split</button>
                <button onClick={() => setViewMode('toggle')} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${!isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Single</button>
             </div>

             {/* Select Button */}
             <button
                onClick={() => {
                     if (isSelectionMode) { setIsSelectionMode(false); setSelectedOpeningIds(new Set()); setSelectedVariationIds(new Set()); }
                     else setIsSelectionMode(true);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
             >
                 {isSelectionMode ? 'Done' : 'Select'}
             </button>

             {/* User Profile Section */}
             {!isGuestMode && (
                 <>
                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                    
                    <Link to="/profile" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md transition-all">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="hidden md:block text-left">
                            <div className="text-xs text-gray-400 font-medium leading-none mb-0.5">
                              Welcome,
                            </div>
                            <div className="text-sm font-bold text-gray-800 uppercase tracking-wide leading-none group-hover:text-blue-600 transition-colors">
                              {user?.username}
                            </div>
                        </div>
                    </Link>

                    <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Logout">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                    </button>
                 </>
             )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        {/* Side Toggle (Only for Single View) */}
        {!isSplit && (
             <div className="flex justify-center mb-8">
                 <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                    {['white', 'black'].map((side) => (
                        <button key={side} onClick={() => setActiveSide(side as any)} className={`px-8 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeSide === side ? (side === 'white' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm') : 'text-gray-500 hover:text-gray-700'}`}>
                            {side}
                        </button>
                    ))}
                 </div>
             </div>
        )}
        
        {/* Render Lists */}
        <div className={isSplit ? "flex flex-col lg:flex-row gap-8" : "max-w-3xl mx-auto"}>
             {(isSplit ? ['white', 'black'] : [activeSide]).map((side) => (
                 <div key={side} className={`flex-1 ${!isSplit ? 'p-8 rounded-2xl shadow-sm border ' + (activeSide === 'white' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-100 border-slate-200') : ''}`}>
                    {isSplit && (
                        <div className={`p-6 rounded-2xl border min-h-[500px] ${side === 'white' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-200/50 border-slate-300'}`}>
                            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${side === 'white' ? 'text-amber-900' : 'text-slate-800'}`}>
                                <span className={`w-3 h-3 rounded-full ${side === 'white' ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                                {side.charAt(0).toUpperCase() + side.slice(1)}
                            </h2>
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
                    )}

                    {!isSplit && (
                        <OpeningsList 
                            side={activeSide as 'white' | 'black'}
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
                    )}
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
