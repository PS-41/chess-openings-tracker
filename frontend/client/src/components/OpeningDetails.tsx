import React, { useState } from 'react';
import { type Opening } from './OpeningsList';

interface OpeningDetailsProps {
  opening: Opening;
}

const OpeningDetails: React.FC<OpeningDetailsProps> = ({ opening }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Helper to get image URL
  const imageUrl = opening.image_filename 
    ? `http://127.0.0.1:5000/api/uploads/${opening.image_filename}` 
    : null;

  return (
    <>
      <div className="space-y-6">
        
        {/* Top Section: Image & Moves */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Image Column */}
          {imageUrl ? (
            <div className="w-full md:w-1/2">
              <div 
                className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner cursor-zoom-in group relative"
                onClick={() => setIsZoomed(true)}
                title="Click to expand"
              >
                <img 
                  src={imageUrl} 
                  alt={opening.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/50 px-2 py-1 rounded text-sm">
                        🔍 View Full
                    </span>
                </div>
              </div>
            </div>
          ) : (
             /* Fallback placeholder */
             <div className="w-full md:w-1/3 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300 min-h-[150px]">
               <span className="text-gray-400 text-sm">No image available</span>
             </div>
          )}

          {/* Moves & Actions Column */}
          <div className="flex-1 space-y-4 min-w-0"> {/* min-w-0 prevents flex items from overflowing */}
             <div>
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Moves (PGN)</h4>
               
               {/* SCROLLABLE PGN BOX */}
               {/* max-h-32 limits height to ~8rem, overflow-y-auto enables scrolling */}
               <div className="bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-sm leading-relaxed shadow-inner max-h-32 overflow-y-auto border border-gray-700">
                 {opening.moves}
               </div>
             </div>

             {/* Lichess Action Button */}
             <a 
               href={opening.lichess_link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:-translate-y-0.5"
             >
               Analyze on Lichess ⬈
             </a>
          </div>
        </div>

        {/* --- NOTES SECTION (New) --- */}
        {opening.notes && (
          <div className="border-t pt-4 border-gray-100">
            <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <span>📝 My Notes</span>
            </h4>
            <div className="bg-yellow-50 text-gray-800 p-4 rounded-lg shadow-sm border border-yellow-100 text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {opening.notes}
            </div>
          </div>
        )}

        {/* Tutorial Links Section */}
        {opening.tutorials && opening.tutorials.length > 0 && (
          <div className="border-t pt-4 border-gray-100">
             <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
               <span>📚 Tutorial Resources</span>
             </h4>
             <ul className="space-y-2">
               {opening.tutorials.map((link, idx) => (
                 <li key={idx}>
                   <a 
                     href={link} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center p-2 rounded hover:bg-blue-50 text-blue-600 transition-colors group"
                   >
                     <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                       {idx + 1}
                     </span>
                     <span className="truncate underline decoration-blue-300 underline-offset-2">
                       {link}
                     </span>
                   </a>
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>

      {/* --- LIGHTBOX (Full Screen Image Overlay) --- */}
      {isZoomed && imageUrl && (
        <div 
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
            onClick={() => setIsZoomed(false)}
        >
            <img 
                src={imageUrl} 
                alt={opening.name} 
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            />
            <button className="absolute top-4 right-4 text-white text-4xl opacity-70 hover:opacity-100">
                &times;
            </button>
        </div>
      )}
    </>
  );
};

export default OpeningDetails;