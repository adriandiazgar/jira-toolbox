import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";

export function SprintDetailModal({ isOpen, onClose, sprint, boardId, jiraDomain, onSave, onAutoFetch }) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setJsonInput('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const detailUrl = `https://${jiraDomain}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprint.id}`;

    const handleAutoFetchDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            await onAutoFetch(sprint);
            onClose();
        } catch (err) {
            setError('Auto-fetch failed. Please use the manual copy-paste method.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSave = () => {
        if (!jsonInput) {
            setError('Please paste the detailed JSON report.');
            return;
        }
        try {
            const data = JSON.parse(jsonInput);
            if (!data.contents) throw new Error("Invalid JSON. Missing 'contents' field.");
            onSave(sprint.id, data.contents);
            onClose();
        } catch (e) {
            setError('Invalid JSON format.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Details for: ${sprint.name}`} size="2xl">
            <div className="space-y-4">
                <button onClick={handleAutoFetchDetails} disabled={isLoading} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center">
                    <Zap size={16} className="mr-2" />
                    {isLoading ? 'Fetching...' : 'Auto-Fetch Details'}
                </button>
                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <p className="text-sm font-medium">Manually paste the JSON from this URL:</p>
                <input type="text" readOnly value={detailUrl} className={`${inputStyle} font-mono text-xs`} />
                <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className={`${inputStyle} min-h-40 font-mono text-xs`} placeholder="Paste detailed sprint report JSON here..."></textarea>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end">
                    <button onClick={handleManualSave} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Save Manually</button>
                </div>
            </div>
        </Modal>
    );
}
