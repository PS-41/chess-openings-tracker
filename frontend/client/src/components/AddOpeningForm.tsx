import React, { useState, useRef, useEffect } from 'react';
import type { ClipboardEvent } from 'react';
import axios from 'axios';
import { type Variation } from './OpeningsList';

interface AddOpeningFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialOpeningName?: string;
  initialSide?: 'white' | 'black';
  initialVariationData?: Variation; // If provided, we are in Edit Mode
}

const AddOpeningForm: React.FC<AddOpeningFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialOpeningName, 
  initialSide,
  initialVariationData
}) => {
  const isEditMode = !!initialVariationData;
  const isLocked = !!initialOpeningName; // Opening Name/Side is locked when adding variation or editing variation

  const [name, setName] = useState('');
  const [side, setSide] = useState<'white' | 'black'>('white');
  const [variationName, setVariationName] = useState('');
  const [moves, setMoves] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tutorialLinks, setTutorialLinks] = useState<string[]>(['']); 
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialOpeningName) setName(initialOpeningName);
    if (initialSide) setSide(initialSide);

    if (initialVariationData) {
      setVariationName(initialVariationData.name === 'Default' ? '' : initialVariationData.name);
      setMoves(initialVariationData.moves);
      setNotes(initialVariationData.notes || '');
      if (initialVariationData.tutorials && initialVariationData.tutorials.length > 0) {
        setTutorialLinks(initialVariationData.tutorials);
      }
      if (initialVariationData.image_filename) {
        setPreviewUrl(`/api/uploads/${initialVariationData.image_filename}`);
      }
    }
  }, [initialOpeningName, initialSide, initialVariationData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moves) return alert("Moves are required!");

    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    // Only send Opening Name/Side if CREATING new opening (not locked)
    if (!isLocked) {
        formData.append('name', name);
        formData.append('side', side);
    }
    
    // Always send these
    formData.append('moves', moves);
    formData.append('notes', notes);
    formData.append('variation_name', variationName || 'Default');

    if (imageFile) formData.append('image', imageFile);

    tutorialLinks.forEach((link) => {
      if (link.trim()) formData.append('tutorials', link);
    });

    try {
      if (isEditMode && initialVariationData) {
        // PUT Request
        await axios.put(`/api/variations/${initialVariationData.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
        });
      } else {
        // POST Request
        if (isLocked) {
            formData.append('name', name);
            formData.append('side', side);
        }
        
        await axios.post('/api/openings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving opening:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to save. Please try again.");
      }
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={formTopRef} />

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm mb-4">
          <p className="font-bold">Error saving</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Row: Name and Variation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Name</label>
          <input 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLocked}
            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${
              isLocked 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'
            }`}
            placeholder="e.g. Sicilian Defense" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Variation Name</label>
          <input 
            value={variationName}
            onChange={(e) => setVariationName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            placeholder="e.g. Najdorf Variation" 
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank for "Default"</p>
        </div>
      </div>

      {/* Side */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Playing Side</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            side === 'white' 
              ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-200' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input 
                type="radio" 
                name="side" 
                checked={side === 'white'} 
                onChange={() => setSide('white')} 
                disabled={isLocked}
                className="accent-amber-600"
            />
            <span className="font-medium">White</span>
          </label>
          
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            side === 'black' 
              ? 'bg-slate-100 border-slate-300 text-slate-900 ring-1 ring-slate-200' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input 
                type="radio" 
                name="side" 
                checked={side === 'black'} 
                onChange={() => setSide('black')} 
                disabled={isLocked}
                className="accent-slate-700"
            />
            <span className="font-medium">Black</span>
          </label>
        </div>
      </div>

      {/* Moves (Required) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">PGN Moves *</label>
        <textarea 
          required
          rows={3}
          value={moves}
          onChange={(e) => setMoves(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-sm transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          placeholder="1. e4 c5 2. Nf3 d6 ..." 
        />
        <p className="text-xs text-gray-500 mt-1">Enter moves in PGN format. Lichess link generated automatically.</p>
      </div>

      {/* Personal Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Strategy Notes</label>
        <textarea 
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-yellow-200 bg-yellow-50 rounded-lg outline-none text-sm transition-all focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 text-gray-800"
          placeholder="Key ideas, plans, and traps to remember..." 
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Position Screenshot</label>
        <div 
          onPaste={handlePaste}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all bg-white"
        >
            {previewUrl ? (
                <div className="relative inline-block group">
                    <img src={previewUrl} alt="Preview" className="h-32 rounded-lg shadow-sm border border-gray-200" />
                    <button 
                        type="button" 
                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                    >
                        ✕
                    </button>
                    {!imageFile && isEditMode && <p className="text-xs text-gray-400 mt-2">Current Image</p>}
                </div>
            ) : (
                <div className="relative flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-sm text-gray-500 pointer-events-none">
                        Click to upload or <strong>Ctrl+V</strong> to paste image
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
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resources (YouTube/Blogs)</label>
        <div className="space-y-2">
            {tutorialLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                    <input 
                        value={link}
                        onChange={(e) => handleTutorialChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        placeholder="https://..." 
                    />
                    {tutorialLinks.length > 1 && (
                        <button 
                            type="button" 
                            onClick={() => removeTutorialField(index)}
                            className="text-gray-400 hover:text-red-500 p-2 transition-colors"
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
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium flex items-center gap-1"
        >
            <span>+</span> Add another link
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-5 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md font-medium transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (isEditMode ? 'Update Variation' : 'Save Opening')}
        </button>
      </div>
    </form>
  );
};

export default AddOpeningForm;
