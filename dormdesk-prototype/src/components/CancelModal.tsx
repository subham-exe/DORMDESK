import React, { useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface CancelModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  ticketId,
  ticketTitle,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('Issue resolved by resident self-action');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote ? `${reason}: ${customNote}` : reason;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 flex-shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-slate-900">
            Cancel Request <span className="font-mono-code font-normal text-slate-500">#{ticketId}</span>?
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            "{ticketTitle}"
          </p>
          <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
            Cancelling this ticket will de-allocate any scheduled field technicians or workshop dispatch queue slots. This audit record will remain archived.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Cancellation Reason
            </label>
            <select
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Issue resolved by resident self-action">Issue resolved by resident self-action</option>
              <option value="Duplicate ticket filed inadvertently">Duplicate ticket filed inadvertently</option>
              <option value="Work performed by room-mate">Work performed by room-mate</option>
              <option value="No longer required / Vacated">No longer required / Vacated</option>
              <option value="Other administrative reason">Other administrative reason</option>
            </select>
          </div>

          <div>
            <label htmlFor="cancel-memo" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Additional Memo (Optional)
            </label>
            <input
              id="cancel-memo"
              type="text"
              placeholder="e.g. Swapped power cord from spare kit"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Keep Request
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
