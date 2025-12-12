import { useState, useEffect } from 'react';
import axios from 'axios';
import OpeningsList, { type Opening, type Variation } from './components/OpeningsList';
import Modal from './components/Modal';
import AddOpeningForm from './components/AddOpeningForm';
import OpeningDetails from './components/OpeningDetails';

type ViewMode = 'split' | 'toggle';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');
  
  // Data State
  const [openings, setOpenings] = useState<Opening[]>([]);
  
  // Modal State for Adding
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);

  // Details Modal State
  const [selectedVariation, setSelectedVariation] = useState<{name: string, data: Variation} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
    fetchOpenings(); 
  };

  const openAddModal = (openingToAddTo: Opening | null = null) => {
    setEditingOpening(openingToAddTo);
    setIsModalOpen(true);
  };

  const handleVariationClick = (openingName: string, variation: Variation) => {
    setSelectedVariation({ name: openingName, data: variation });
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-20">
      
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
          /* Single View Toggle Side Selector */
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
               />
             </div>
          </div>
        )}
      </main>

      {/* --- Modal for Adding Opening/Variation --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingOpening ? `Add Variation to ${editingOpening.name}` : "Create New Opening"}
      >
        <AddOpeningForm 
          onSuccess={handleAddSuccess} 
          onCancel={() => setIsModalOpen(false)} 
          initialOpeningName={editingOpening?.name}
          initialSide={editingOpening?.side}
        />
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
            />
        )}
      </Modal>

    </div>
  );
}

export default App;
