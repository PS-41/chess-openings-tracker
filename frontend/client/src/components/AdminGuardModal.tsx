import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { Link } from 'react-router-dom';

interface AdminGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminGuardModal: React.FC<AdminGuardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/verify-admin', { password }, { withCredentials: true });
      onSuccess();
    } catch {
      setError('Incorrect password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restricted Action">
      <div className="space-y-6">
        <div className="text-center space-y-2">
            <p className="text-gray-600">
                You are viewing the <strong>Public Guest Page</strong>.
            </p>
            <p className="text-sm text-gray-500">
                To create your own openings, please <Link to="/signup" className="text-blue-600 font-bold underline">Sign Up</Link>.
            </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-bold text-gray-800 mb-3 text-center">Admin Access Only</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input 
                    type="password"
                    placeholder="Enter Admin Password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">
                    Unlock Admin Editing
                </button>
            </form>
        </div>
      </div>
    </Modal>
  );
};

export default AdminGuardModal;