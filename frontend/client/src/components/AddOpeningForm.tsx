import React, { useState, useRef, ClipboardEvent, useEffect } from 'react';
import axios from 'axios';

interface AddOpeningFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  // Optional props for "Add Variation" mode
  initialOpeningName?: string;
  initialSide?: 'white' | 'black';
}

const AddOpeningForm: React.FC<AddOpeningFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialOpeningName, 
  initialSide 
}) => {
  const [name, setName] = useState('');
  const [side, setSide] = useState<'white' | 'black'>('white');
  
  // New: Variation Name
  const [variationName, setVariationName] = useState('');

  const [moves, setMoves] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tutorialLinks, setTutorialLinks] = useState<string[]>(['']); 
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref for scrolling to top
  const formTopRef = useRef<HTMLDivElement>(null);

  // Initialize form if props passed (Add Variation Mode)
  useEffect(() => {
    if (initialOpeningName) {
      setName(initialOpeningName);
    }
    if (initialSide) {
      setSide(initialSide);
    }
  }, [initialOpeningName, initialSide]);

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
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('side', side);
    formData.append('moves', moves);
    formData.append('notes', notes);
    formData.append('variation_name', variationName); // Send variation name

    if (imageFile) {
      formData.append('image', imageFile);
    }

    tutorialLinks.forEach((link) => {
      if (link.trim()) formData.append('tutorials', link);
    });

    try {
      await axios.post('http://127.0.0.1:5000/api/openings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error adding opening:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to add opening. Please try again.");
      }
      // Scroll to top on error
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = !!initialOpeningName; // Are we in "Add Variation" mode?

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div ref={formTopRef} />

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm mb-4 animate-pulse">
          <p className="font-bold">Error</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Row: Name and Variation */}
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Name *</label>
          <input 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLocked}
            className={`w-full p-2 border rounded-lg outline-none ${
              isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 border-gray-300'
            }`}
            placeholder="e.g. Sicilian Defense" 
          />
        </div>

        {/* Variation Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variation Name</label>
          <input 
            value={variationName}
            onChange={(e) => setVariationName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Default" 
          />
        </div>
      </div>

      {/* Side */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Side *</label>
        <div className="flex space-x-4">
          <label className={`flex items-center space-x-2 px-3 py-1 rounded border ${isLocked ? 'opacity-70' : 'cursor-pointer bg-gray-50'}`}>
            <input 
                type="radio" 
                name="side" 
                checked={side === 'white'} 
                onChange={() => setSide('white')} 
                disabled={isLocked}
            />
            <span>White</span>
          </label>
          <label className={`flex items-center space-x-2 px-3 py-1 rounded border ${isLocked ? 'opacity-70' : 'cursor-pointer bg-gray-50'}`}>
            <input 
                type="radio" 
                name="side" 
                checked={side === 'black'} 
                onChange={() => setSide('black')} 
                disabled={isLocked}
            />
            <span>Black</span>
          </label>
        </div>
        {isLocked && <p className="text-xs text-gray-400 mt-1">Side is fixed for existing openings.</p>}
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
      </div>

      {/* Personal Notes Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Personal Notes (Optional)</label>
        <textarea 
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-yellow-50/50"
          placeholder="e.g. Watch out for the knight sacrifice on f7..." 
        />
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
                        Click to upload or <strong>Ctrl+V</strong> to paste
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

      {/* Tutorial Links */}
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
