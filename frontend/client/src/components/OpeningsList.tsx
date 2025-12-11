import React from 'react';

// Define the shape of our data (matching the Python model)
export interface Opening {
  id: number;
  name: string;
  side: 'white' | 'black';
  moves?: string;
  lichess_link?: string;
  image_filename?: string;
  tutorials?: string[];
  notes?: string;
}

interface OpeningsListProps {
  openings: Opening[]; // Receive data from parent instead of hardcoding
  side: 'white' | 'black';
  onOpeningClick: (opening: Opening) => void;
}

const OpeningsList: React.FC<OpeningsListProps> = ({ openings, side, onOpeningClick }) => {
  // Filter the full list based on the side prop
  const filteredData = openings.filter(o => o.side === side);
  
  const hoverColor = side === 'white' ? 'hover:border-white-side' : 'hover:border-black-side';
  const numberBg = side === 'white' ? 'bg-black-side text-white' : 'bg-white-side text-primary-text';

  if (filteredData.length === 0) {
    return <div className="text-gray-400 italic p-4 text-center">No openings added yet.</div>;
  }

  return (
    <div className="w-full">
      <ol className="list-none space-y-4" style={{ counterReset: 'opening-counter' }}>
        {filteredData.map((opening, index) => (
          <li 
            key={opening.id}
            style={{ counterIncrement: 'opening-counter' }}
            className={`
              group flex items-center p-4 bg-white rounded-lg shadow-sm 
              border-l-4 border-transparent ${hoverColor}
              transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-x-1
            `}
            onClick={() => onOpeningClick(opening)}
          >
            <span 
              className={`
                flex-shrink-0 w-8 h-8 flex items-center justify-center 
                rounded-full font-bold mr-4 text-sm shadow-inner ${numberBg}
              `}
              style={{ content: 'counter(opening-counter)' }} 
            >
               {index + 1}
            </span>

            <span className="text-lg font-medium text-gray-800 group-hover:text-black">
              {opening.name}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default OpeningsList;