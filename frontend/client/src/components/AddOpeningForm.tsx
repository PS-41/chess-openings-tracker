import React, { useState, ClipboardEvent } from 'react';
import axios from 'axios';

interface AddOpeningFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddOpeningForm: React.FC<AddOpeningFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [side, setSide] = useState<'white' | 'black'>('white');
  const [moves, setMoves] = useState('');
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Tutorial Links State
  const [tutorialLinks, setTutorialLinks] = useState<string[]>(['']); // Start with one empty input

  const [loading, setLoading] = useState(false);

  // --- Handle Paste for Image ---
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          setImageFile(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- Handle Dynamic Tutorial Inputs ---
  const handleTutorialChange = (index: number, value: string) => {
    const newLinks = [...tutorialLinks];
    newLinks[index] = value;
    setTutorialLinks(newLinks);
  };

  const addTutorialField = () => {
    setTutorialLinks([...tutorialLinks, '']);
  };

  const removeTutorialField = (index: number) => {
    const newLinks = tutorialLinks.filter((_, i) => i !== index);
    setTutorialLinks(newLinks);
  };

  // --- Submit Logic (FormData) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moves) return alert("Moves are required!");

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('side', side);
    formData.append('moves', moves);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Append each non-empty tutorial link
    tutorialLinks.forEach((link) => {
      if (link.trim()) formData.append('tutorials', link);
    });

    try {
      await axios.post('http://127.0.0.1:5000/api/openings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding opening:", error);
      alert("Failed to add opening.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
      
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Opening Name *</label>
        <input 
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. Sicilian Defense" 
        />
      </div>

      {/* Side */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Side *</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-1 rounded border">
            <input type="radio" name="side" checked={side === 'white'} onChange={() => setSide('white')} />
            <span>White</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-1 rounded border">
            <input type="radio" name="side" checked={side === 'black'} onChange={() => setSide('black')} />
            <span>Black</span>
          </label>
        </div>
      </div>

      {/* Moves (Required) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Moves (PGN) *</label>
        <textarea 
          required
          rows={3}
          value={moves}
          onChange={(e) => setMoves(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
          placeholder="e.g. 1. e4 c5 2. Nf3 d6" 
        />
        <p className="text-xs text-gray-500 mt-1">Lichess link will be auto-generated from this.</p>
      </div>

      {/* Image Upload (Paste Support) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Opening Image (Optional)</label>
        <div 
          onPaste={handlePaste}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        >
            {previewUrl ? (
                <div className="relative inline-block">
                    <img src={previewUrl} alt="Preview" className="h-32 rounded shadow-md object-cover" />
                    <button 
                        type="button" 
                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <p className="text-sm text-gray-500 pointer-events-none">
                        Click to upload or <strong>Ctrl+V</strong> to paste image here
                    </p>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            )}
        </div>
      </div>

      {/* Tutorial Links (Dynamic) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tutorial Links (Optional)</label>
        <div className="space-y-2">
            {tutorialLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                    <input 
                        value={link}
                        onChange={(e) => handleTutorialChange(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="https://youtube.com/..." 
                    />
                    {tutorialLinks.length > 1 && (
                        <button 
                            type="button" 
                            onClick={() => removeTutorialField(index)}
                            className="text-red-500 hover:text-red-700 px-2"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
        </div>
        <button 
            type="button" 
            onClick={addTutorialField}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium flex items-center"
        >
            + Add another link
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-medium"
        >
          {loading ? 'Saving...' : 'Save Opening'}
        </button>
      </div>
    </form>
  );
};

export default AddOpeningForm;
