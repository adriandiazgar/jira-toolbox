import React from 'react';
import { MinusCircle } from 'lucide-react';
import { IconButton } from './IconButton';

export const Modal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        md: 'max-w-md',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white text-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold">{title}</h2>
                     <IconButton icon={<MinusCircle />} onClick={onClose} className="text-gray-400 hover:text-gray-600" />
                </div>
                <div className="overflow-y-auto pr-2">{children}</div>
                {onConfirm && (
                    <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-opacity">
                            {confirmText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
