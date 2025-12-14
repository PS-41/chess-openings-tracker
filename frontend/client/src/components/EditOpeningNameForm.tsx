import React, { useState } from 'react';
import axios from 'axios';

interface EditOpeningNameFormProps {
    openingId: number;
    currentName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const EditOpeningNameForm: React.FC<EditOpeningNameFormProps> = ({ openingId, currentName, onSuccess, onCancel }) => {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            await axios.put(
                `/api/openings/${openingId}`,
                { name },
                { withCredentials: true }
                );
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to update name");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}
            
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Name</label>
                <input 
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading || !name.trim() || name === currentName}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                    {loading ? 'Saving...' : 'Update Name'}
                </button>
            </div>
        </form>
    );
};

export default EditOpeningNameForm;