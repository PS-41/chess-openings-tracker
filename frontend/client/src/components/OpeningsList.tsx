import React from 'react';

// We define what an Opening looks like
interface Opening {
  id: number;
  name: string;
}

interface OpeningsListProps {
  side: 'white' | 'black';
}

// Temporary Dummy Data
const whiteOpenings: Opening[] = [
  { id: 1, name: 'Ruy Lopez' },
  { id: 2, name: 'Italian Game' },
  { id: 3, name: 'London System' },
  { id: 4, name: 'Queen\'s Gambit' },
];

const blackOpenings: Opening[] = [
  { id: 5, name: 'Sicilian Defense' },
  { id: 6, name: 'French Defense' },
  { id: 7, name: 'Caro-Kann' },
  { id: 8, name: 'King\'s Indian Defense' },
];

const OpeningsList: React.FC<OpeningsListProps> = ({ side }) => {
  // Select data based on the prop
  const data = side === 'white' ? whiteOpenings : blackOpenings;
  
  // Dynamic styling based on side
  const hoverColor = side === 'white' ? 'hover:border-white-side' : 'hover:border-black-side';
  const numberBg = side === 'white' ? 'bg-black-side text-white' : 'bg-white-side text-primary-text';

  return (
    <div className="w-full">
      {/* "counter-reset" initializes our CSS counter */}
      <ol className="list-none space-y-4" style={{ counterReset: 'opening-counter' }}>
        {data.map((opening) => (
          <li 
            key={opening.id}
            // "counter-increment" increases the value for every item
            style={{ counterIncrement: 'opening-counter' }}
            className={`
              group flex items-center p-4 bg-white rounded-lg shadow-sm 
              border-l-4 border-transparent ${hoverColor}
              transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-x-1
            `}
            onClick={() => alert(`Clicked on ${opening.name}`)}
          >
            {/* Custom Number Badge */}
            <span 
              className={`
                flex-shrink-0 w-8 h-8 flex items-center justify-center 
                rounded-full font-bold mr-4 text-sm shadow-inner ${numberBg}
              `}
              // This CSS trick grabs the current counter number
              style={{ content: 'counter(opening-counter)' }} 
            >
              {/* Fallback for screen readers, visual number handled by CSS content if needed, 
                  but simpler to just render the index here for React */}
               {data.indexOf(opening) + 1}
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