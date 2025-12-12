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
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null); // For "Add Variation" mode

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
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* --- Header --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide mb-4 md:mb-0">
            ♚ Chess Openings
          </h1>

          <div className="flex items-center space-x-4">
             {/* Add Button */}
             <button 
                onClick={() => openAddModal(null)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center"
             >
                <span className="mr-2 text-lg font-bold">+</span> New Opening
             </button>

             {/* View Toggle */}
            <div className="flex items-center bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode(isSplit ? 'toggle' : 'split')}
                className="px-3 py-1.5 text-xs md:text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {isSplit ? 'Single View' : 'Split View'}
              </button>

              {!isSplit && (
                <div className="flex bg-gray-200 rounded ml-3">
                  <button
                    onClick={() => setActiveSide('white')}
                    className={`px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${
                      activeSide === 'white' ? 'bg-white shadow text-black' : 'text-gray-500'
                    }`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => setActiveSide('black')}
                    className={`px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${
                      activeSide === 'black' ? 'bg-black-side shadow text-white' : 'text-gray-500'
                    }`}
                  >
                    Black
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6">
        {isSplit ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-white-side/30 p-6 rounded-xl border border-white-side">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-white-side pb-2">White</h2>
              <OpeningsList 
                side="white" 
                openings={openings} 
                onVariationClick={handleVariationClick}
                onAddVariation={(op) => openAddModal(op)}
              />
            </div>
            <div className="flex-1 bg-black-side/20 p-6 rounded-xl border border-black-side">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-black-side pb-2">Black</h2>
              <OpeningsList 
                side="black" 
                openings={openings} 
                onVariationClick={handleVariationClick}
                onAddVariation={(op) => openAddModal(op)}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
             <div className={`p-8 rounded-xl shadow-lg transition-colors duration-500 ${
               activeSide === 'white' ? 'bg-white-side/30' : 'bg-black-side/20'
             }`}>
               <h2 className="text-3xl font-bold mb-8 text-center capitalize">{activeSide} Openings</h2>
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
        title={editingOpening ? `Add Variation to ${editingOpening.name}` : "Add New Opening"}
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
