import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const ProfilePage = () => {
    const [username, setUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/auth/me', { withCredentials: true })
            .then(res => {
                if(res.data.authenticated) setUsername(res.data.user.username);
                else navigate('/');
            })
            .catch(() => navigate('/'));
    }, [navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            await axios.put('/api/auth/profile', {
                username,
                currentPassword,
                newPassword: newPassword || undefined
            }, { withCredentials: true });
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 font-sans px-4">
             <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                    <Link to="/dashboard" className="text-sm text-gray-500 hover:text-blue-600">Back to Dashboard</Link>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <input 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    
                    <hr className="border-gray-100" />
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Leave blank to keep current"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                        <input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                            placeholder="Required to save changes"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-70"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
             </div>
        </div>
    );
};

export default ProfilePage;