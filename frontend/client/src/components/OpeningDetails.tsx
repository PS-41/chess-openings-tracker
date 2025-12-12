import React, { useState } from 'react';
import { type Variation } from './OpeningsList';

interface OpeningDetailsProps {
  openingName: string;
  variation: Variation;
  // Passing these optionally to allow managing from details view
  onEdit?: (variation: Variation) => void;
  onDelete?: (variation: Variation) => void;
}

const OpeningDetails: React.FC<OpeningDetailsProps> = ({ openingName, variation, onEdit, onDelete }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const imageUrl = variation.image_filename 
    ? `http://127.0.0.1:5000/api/uploads/${variation.image_filename}` 
    : null;

  return (
    <>
      <div className="space-y-8">
        
        {/* Variation Header & Controls */}
        <div className="flex justify-between items-start pb-3 border-b border-gray-100 -mt-2">
            <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{openingName}</div>
                <div className="text-2xl font-bold text-gray-900">{variation.name}</div>
            </div>
            
            {/* Edit/Delete Controls */}
            <div className="flex gap-2">
                {onEdit && (
                    <button 
                        onClick={() => onEdit(variation)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Variation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                )}
                {onDelete && (
                    <button 
                        onClick={() => onDelete(variation)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Variation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                )}
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Image Column */}
          {imageUrl ? (
            <div className="w-full md:w-1/2">
              <div 
                className="aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-zoom-in group relative"
                onClick={() => setIsZoomed(true)}
                title="Click to expand"
              >
                <img 
                  src={imageUrl} 
                  alt={variation.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-semibold bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        🔍 View Full Board
                    </span>
                </div>
              </div>
            </div>
          ) : (
             <div className="w-full md:w-1/3 bg-gray-50 rounded-xl flex flex-col gap-2 items-center justify-center border border-dashed border-gray-300 min-h-[180px] text-gray-400">
               <span className="text-2xl">♟️</span>
               <span className="text-sm font-medium">No position image</span>
             </div>
          )}

          {/* Moves & Actions Column */}
          <div className="flex-1 space-y-5 min-w-0">
             <div>
               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">PGN Moves</h4>
               <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-sm leading-relaxed shadow-inner max-h-40 overflow-y-auto border border-slate-700 custom-scrollbar">
                 {variation.moves}
               </div>
             </div>

             <a 
               href={variation.lichess_link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="
                 flex items-center justify-center gap-2 w-full text-center 
                 bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                 py-3 px-4 rounded-xl shadow-md transition-all duration-200
                 hover:shadow-lg active:scale-95
               "
             >
               <span>Analyze on Lichess</span>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                 <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
               </svg>
             </a>
          </div>
        </div>

        {/* --- NOTES SECTION --- */}
        {variation.notes && (
          <div className="border-t pt-6 border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              📝 Strategy Notes
            </h4>
            <div className="bg-yellow-50 text-yellow-900/80 p-5 rounded-xl border border-yellow-100 text-sm leading-relaxed whitespace-pre-wrap">
              {variation.notes}
            </div>
          </div>
        )}

        {/* Tutorial Links Section */}
        {variation.tutorials && variation.tutorials.length > 0 && (
          <div className="border-t pt-6 border-gray-100">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               📚 Resources
             </h4>
             <ul className="grid grid-cols-1 gap-2">
               {variation.tutorials.map((link, idx) => (
                 <li key={idx}>
                   <a 
                     href={link} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 text-blue-600 transition-all group bg-white"
                   >
                     <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-3 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                       {idx + 1}
                     </span>
                     <span className="truncate text-sm font-medium underline decoration-blue-200 underline-offset-2 group-hover:decoration-blue-400">
                       {link}
                     </span>
                   </a>
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      {isZoomed && imageUrl && (
        <div 
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out animate-fade-in backdrop-blur-sm"
            onClick={() => setIsZoomed(false)}
        >
            <img 
                src={imageUrl} 
                alt={variation.name} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
      )}
    </>
  );
};

export default OpeningDetails;
