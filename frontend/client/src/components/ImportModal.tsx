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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Public Openings">
      <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-4">
        {publicOpenings.map(op => (
          <div key={op.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => toggleSelect(op.id)}>
            <input 
              type="checkbox" 
              checked={selectedIds.has(op.id)} 
              readOnly 
              className="w-5 h-5 accent-blue-600"
            />
            <div>
              <div className="font-bold text-gray-800">{op.name}</div>
              <div className="text-xs text-gray-500 uppercase">{op.side} • {op.variations.length} variations</div>
            </div>
          </div>
        ))}
        {publicOpenings.length === 0 && <p className="text-center text-gray-500 py-4">No public openings found.</p>}
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