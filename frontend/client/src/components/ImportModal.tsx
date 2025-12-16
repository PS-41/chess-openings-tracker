import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { type Opening } from './OpeningsList';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [publicOpenings, setPublicOpenings] = useState<Opening[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/openings?mode=public')
        .then(res => setPublicOpenings(res.data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const whiteOpenings = publicOpenings.filter(o => o.side === 'white');
  const blackOpenings = publicOpenings.filter(o => o.side === 'black');

  const areAllSelected = (list: Opening[]) => {
      return list.length > 0 && list.every(o => selectedIds.has(o.id));
  };

  const toggleSelectAll = (side: 'white' | 'black') => {
      const targetList = side === 'white' ? whiteOpenings : blackOpenings;
      const allSelected = areAllSelected(targetList);
      
      const newSet = new Set(selectedIds);
      if (allSelected) {
          targetList.forEach(o => newSet.delete(o.id));
      } else {
          targetList.forEach(o => newSet.add(o.id));
      }
      setSelectedIds(newSet);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await axios.post('/api/import', 
        { opening_ids: Array.from(selectedIds) }, 
        { withCredentials: true }
      );
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Import failed");
    } finally {
      setLoading(false);
    }
  };

  const renderSideColumn = (side: 'white' | 'black', list: Opening[]) => (
      <div className="flex-1">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-white p-2 z-10 border-b">
              <h3 className={`font-bold capitalize ${side === 'white' ? 'text-amber-700' : 'text-slate-700'}`}>{side}</h3>
              {list.length > 0 && (
                  <button 
                      onClick={() => toggleSelectAll(side)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                      {areAllSelected(list) ? 'Deselect All' : 'Select All'}
                  </button>
              )}
          </div>
          <div className="space-y-2">
            {list.map(op => (
                <div key={op.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => toggleSelect(op.id)}>
                    <input 
                    type="checkbox" 
                    checked={selectedIds.has(op.id)} 
                    readOnly 
                    className="w-5 h-5 accent-blue-600 flex-shrink-0"
                    />
                    <div>
                        <div className="font-bold text-gray-800 text-sm">{op.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{op.variations.length} vars</div>
                    </div>
                </div>
            ))}
            {list.length === 0 && <p className="text-center text-gray-400 py-4 text-xs italic">No {side} openings.</p>}
          </div>
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Public Openings">
      <div className="max-h-[60vh] overflow-y-auto mb-4">
        {publicOpenings.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No public openings found.</p>
        ) : (
            <div className="flex flex-col md:flex-row gap-4">
                {renderSideColumn('white', whiteOpenings)}
                {renderSideColumn('black', blackOpenings)}
            </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button 
          onClick={handleImport} 
          disabled={selectedIds.size === 0 || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : `Import Selected (${selectedIds.size})`}
        </button>
      </div>
    </Modal>
  );
};

export default ImportModal;
