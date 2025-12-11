import React from 'react';
import { type Opening } from './OpeningsList';

interface OpeningDetailsProps {
  opening: Opening;
}

const OpeningDetails: React.FC<OpeningDetailsProps> = ({ opening }) => {
  // Helper to get image URL
  const imageUrl = opening.image_filename 
    ? `http://127.0.0.1:5000/api/uploads/${opening.image_filename}` 
    : null;

  return (
    <div className="space-y-6">
      
      {/* Top Section: Image & Moves */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Image Column (conditionally rendered) */}
        {imageUrl ? (
          <div className="w-full md:w-1/2">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
              <img 
                src={imageUrl} 
                alt={opening.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
           /* Fallback placeholder if no image */
           <div className="w-full md:w-1/3 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300 min-h-[150px]">
             <span className="text-gray-400 text-sm">No image available</span>
           </div>
        )}

        {/* Moves & Actions Column */}
        <div className="flex-1 space-y-4">
           <div>
             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Moves (PGN)</h4>
             <div className="bg-gray-800 text-gray-100 p-3 rounded-lg font-mono text-sm leading-relaxed shadow-inner">
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
                   <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
  );
};

export default OpeningDetails;