import { useState } from 'react';
import OpeningsList from './components/OpeningsList';

type ViewMode = 'split' | 'toggle';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<'white' | 'black'>('white');

  const isSplit = viewMode === 'split';

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* --- Header & Navigation --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide mb-4 md:mb-0">
            ♚ Chess Openings
          </h1>

          {/* Controls Container */}
          <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
            
            {/* Split/Toggle Switch */}
            <button
              onClick={() => setViewMode(isSplit ? 'toggle' : 'split')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              {isSplit ? 'Switch to Single View' : 'Switch to Split View'}
            </button>

            {/* Black/White Toggle (Only visible in 'Toggle' mode) */}
            {!isSplit && (
              <div className="flex bg-gray-200 rounded p-1">
                <button
                  onClick={() => setActiveSide('white')}
                  className={`px-4 py-1 rounded text-sm font-medium transition-all ${
                    activeSide === 'white' ? 'bg-white shadow text-black' : 'text-gray-500'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setActiveSide('black')}
                  className={`px-4 py-1 rounded text-sm font-medium transition-all ${
                    activeSide === 'black' ? 'bg-black-side shadow text-white' : 'text-gray-500'
                  }`}
                >
                  Black
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6">
        {isSplit ? (
          // SPLIT VIEW
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-white-side/30 p-6 rounded-xl border border-white-side">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-white-side pb-2">White</h2>
              <OpeningsList side="white" />
            </div>
            <div className="flex-1 bg-black-side/20 p-6 rounded-xl border border-black-side">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-black-side pb-2">Black</h2>
              <OpeningsList side="black" />
            </div>
          </div>
        ) : (
          // TOGGLE VIEW
          <div className="max-w-3xl mx-auto">
             <div className={`p-8 rounded-xl shadow-lg transition-colors duration-500 ${
               activeSide === 'white' ? 'bg-white-side/30' : 'bg-black-side/20'
             }`}>
               <h2 className="text-3xl font-bold mb-8 text-center capitalize">{activeSide} Openings</h2>
               <OpeningsList side={activeSide} />
             </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;