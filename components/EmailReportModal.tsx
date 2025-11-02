import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string) => void;
}

const EmailReportModal: React.FC<EmailReportModalProps> = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipient) {
      onSend(recipient);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-text">Send Report via Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSend}>
          <div className="p-6">
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email Address
            </label>
            <input
              type="email"
              id="recipient-email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
              placeholder="e.g., stakeholder@example.com"
            />
          </div>
          <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-brand-text font-semibold rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!recipient}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailReportModal;