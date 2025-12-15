import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import OpeningsList, { type Opening, type Variation } from '../components/OpeningsList';
import Modal from '../components/Modal';
import OpeningDetails from '../components/OpeningDetails';
import EditOpeningNameForm from '../components/EditOpeningNameForm';
import AddOpeningForm from '../components/AddOpeningForm';
import ImportModal from '../components/ImportModal';

type ViewMode = 'split' | 'toggle';

function FavoritesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<{name: string, data: Variation, openingData: Opening} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // User State
  const [user, setUser] = useState<{username: string} | null>(null);

  // Reused Modal States for basic editing if allowed
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Opening | null>(null);
  const [isEditVarModalOpen, setIsEditVarModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const navigate = useNavigate();
  const isSplit = viewMode === 'split';

  useEffect(() => {
    // Fetch User
    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => {
         if (res.data.authenticated) setUser(res.data.user);
         else navigate('/'); 
      })
      .catch(() => navigate('/'));

    // Fetch Favorites
    fetchFavorites();
  }, [navigate]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/openings?mode=private&favorites=true', { withCredentials: true });
      setOpenings(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
        setLoading(false);
    }
  };

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

  const handleLogout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24">
       {/* --- Header --- */}
       <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Left Side */}
            <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-2">
                    <span className="text-3xl">♟️</span>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                        Chess Openings
                    </h1>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingOpening(null); setEditingVariation(null); setIsEditVarModalOpen(true); }}
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

                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-white text-slate-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-slate-900 transition-all shadow-sm"
                  >
                    Import
                  </button>
                </div>


                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-1">
                    <Link to="/dashboard" className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-slate-900 rounded-lg hover:bg-gray-100 transition-colors">
                        Dashboard
                    </Link>
                    <Link to="/favorites" className="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg transition-colors">
                        Favorites
                    </Link>
                </nav>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
                 {/* View Toggles */}
                 <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setViewMode('toggle')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        !isSplit ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Single
                    </button>
                 </div>
                 
                 <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                 {/* User Profile */}
                 <Link to="/profile" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md transition-all">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                        <div className="text-xs text-gray-400 font-medium leading-none mb-0.5">Welcome,</div>
                        <div className="text-sm font-bold text-gray-800 leading-none group-hover:text-blue-600 transition-colors">
                            {user?.username}
                        </div>
                    </div>
                </Link>

                 <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 p-1 transition-colors" title="Logout">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                 </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-4">
        {loading ? <p className="text-center text-gray-500">Loading...</p> : (
             <>
                 {/* Side Toggle Buttons (Only in Single View) */}
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

                 <div className={isSplit ? "flex flex-col lg:flex-row gap-8" : "max-w-3xl mx-auto"}>
                     
                     {/* Dynamic Rendering Loop (Matches Dashboard Logic) */}
                     {(isSplit ? ['white', 'black'] : [activeSide]).map((side) => (
                         <div key={side} className={`flex-1 ${!isSplit ? 'p-8 rounded-2xl shadow-sm border ' + (activeSide === 'white' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-100 border-slate-200') : ''}`}>
                            
                            {/* In Split view, show column headers */}
                            {isSplit && (
                                <div className={`bg-${side === 'white' ? 'amber' : 'slate'}-50/50 p-6 rounded-2xl border border-${side === 'white' ? 'amber' : 'slate'}-${side === 'white' ? '100' : '300'} min-h-[500px]`}>
                                    <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${side === 'white' ? 'text-amber-900' : 'text-slate-800'}`}>
                                        <span className={`w-3 h-3 rounded-full ${side === 'white' ? 'bg-amber-400' : 'bg-slate-700'}`}></span>
                                        {side === 'white' ? 'White Repertoire' : 'Black Repertoire'}
                                    </h2>
                                    <OpeningsList 
                                        side={side as 'white' | 'black'}
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
                            )}

                            {/* In Single view, just show the list (container styled by parent map) */}
                            {!isSplit && (
                                <OpeningsList 
                                    side={side as 'white' | 'black'}
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
                            )}
                         </div>
                     ))}
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
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={fetchFavorites} />
    </div>
  );
}

export default FavoritesPage;
