import React, { useState, useMemo, useEffect } from 'react';
import { Wifi, CheckCircle, Edit, Zap, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { calculateWeekdays } from '../utils/dateUtils';

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

function SprintDetailModal({ isOpen, onClose, sprint, boardId, jiraDomain, onSave }) {
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
            const response = await fetch(detailUrl, { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!data.contents) throw new Error("Invalid JSON. Missing 'contents' field.");
            onSave(sprint.id, data.contents);
            onClose();
        } catch (err) {
            setError('Auto-fetch failed. Please use the manual copy-paste method.');
            console.error("Auto-fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Add Details for: {sprint.name}</h3>
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
                    <div className="flex justify-end space-x-4">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                        <button onClick={() => {
                            if (!jsonInput) { setError('Please paste the JSON to save manually.'); return; }
                            try {
                                const data = JSON.parse(jsonInput);
                                onSave(sprint.id, data.contents);
                                onClose();
                            } catch (e) { setError('Invalid JSON format.'); }
                        }} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Save Manually</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AddSprintData({ onSprintsAdded, sprintDetails, onDetailAdded, importedSprintIds, jiraDomain, setJiraDomain }) {
    const [boardId, setBoardId] = useState(() => localStorage.getItem('jiraBoardId') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [detailLoading, setDetailLoading] = useState({});
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [fetchedSprints, setFetchedSprints] = useState(() => {
        try {
            const saved = localStorage.getItem('fetchedSprints');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });
    const [selectedSprints, setSelectedSprints] = useState({});
    const [filterText, setFilterText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSprint, setCurrentSprint] = useState(null);
    const [error, setError] = useState('');
    const [fetchStatus, setFetchStatus] = useState('');

    useEffect(() => {
        localStorage.setItem('fetchedSprints', JSON.stringify(fetchedSprints));
    }, [fetchedSprints]);

    const cleanDomain = useMemo(() => jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, ''), [jiraDomain]);

    const handleAutoFetchSprintsList = async () => {
        if (!jiraDomain || !boardId) {
            setError('Please provide your Jira Domain and Board ID.');
            return;
        }
        setError('');
        setIsLoading(true);
        setFetchStatus('');
        localStorage.setItem('jiraBoardId', boardId);
        const url = `https://${cleanDomain}/rest/agile/1.0/board/${boardId}/sprint?state=closed`;
        
        try {
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!data.values) throw new Error("Invalid JSON structure.");
            setFetchedSprints(data.values);
        } catch (err) {
            console.error("Auto-fetch failed, falling back to manual method.", err);
            setError(
                <>
                    Auto-fetch failed (likely due to CORS). You can install a browser extension like{' '}
                    <a href="https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino?hl=en" target="_blank" rel="noopener noreferrer" className="underline font-semibold">CORS Unblock</a>
                    {' '}to fix this, or use the manual method below.
                </>
            );
            setGeneratedUrl(url);
        } finally {
            setIsLoading(false);
        }
    };

    const handleParseSprints = () => {
        if (!jsonInput) {
            setError('Please paste the JSON data from the generated URL.');
            return;
        }
        setError('');
        try {
            const data = JSON.parse(jsonInput);
            if (!data.values) throw new Error("Invalid JSON structure. Expected a 'values' array.");
            setFetchedSprints(data.values);
        } catch (err) {
            console.error(err);
            setError("Parsing failed. Please ensure you copied the entire JSON content.");
        }
    };

    const handleCheckboxChange = (sprintId) => {
        setSelectedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
    };

    const handleFetchSprintDetails = async (sprint) => {
        setDetailLoading(prev => ({ ...prev, [sprint.id]: true }));
        const detailUrl = `https://${cleanDomain}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprint.id}`;
        try {
            const response = await fetch(detailUrl, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch details');
            const data = await response.json();
            if (!data.contents) throw new Error('Invalid detail JSON');
            onDetailAdded(sprint.id, data.contents);
        } catch (err) {
            setCurrentSprint(sprint);
            setIsModalOpen(true);
        } finally {
            setDetailLoading(prev => ({ ...prev, [sprint.id]: false }));
        }
    };

    const handleBulkFetchDetails = async () => {
        const sprintsToFetch = Object.keys(selectedSprints)
            .filter(id => selectedSprints[id] && !sprintDetails[id])
            .map(id => fetchedSprints.find(s => s.id.toString() === id));

        if (sprintsToFetch.length === 0) {
            setFetchStatus("All selected sprints already have details.");
            return;
        }

        setIsBulkFetching(true);
        setFetchStatus(`Fetching details for ${sprintsToFetch.length} sprint(s)...`);

        const promises = sprintsToFetch.map(sprint => {
            const detailUrl = `https://${cleanDomain}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprint.id}`;
            return fetch(detailUrl, { credentials: 'include' })
                .then(res => {
                    if (!res.ok) throw new Error(`Failed for sprint ${sprint.name}`);
                    return res.json();
                })
                .then(data => ({ status: 'fulfilled', sprintId: sprint.id, contents: data.contents }))
                .catch(err => ({ status: 'rejected', sprintId: sprint.id, reason: err }));
        });

        const results = await Promise.all(promises);
        let successCount = 0;
        let failureCount = 0;

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                onDetailAdded(result.sprintId, result.contents);
                successCount++;
            } else {
                failureCount++;
            }
        });
        
        setFetchStatus(`Fetch complete. Success: ${successCount}. Failures: ${failureCount}. Please add details manually for any failed sprints.`);
        setIsBulkFetching(false);
    };

    const handleBulkImport = () => {
        const sprintsToImport = fetchedSprints.filter(s => selectedSprints[s.id]);
        
        const formattedSprints = sprintsToImport.map(sprint => {
            const details = sprintDetails[sprint.id];
            if (details) {
                const completedIssues = details.completedIssues || [];
                const issuesNotCompleted = details.issuesNotCompleted || [];
                const allIssues = [...completedIssues, ...issuesNotCompleted];
                const uniqueNames = [...new Set(allIssues.map(issue => issue.assigneeName).filter(Boolean))];
                const ticketTypeCounts = completedIssues.reduce((acc, issue) => {
                    const type = issue.typeName || 'Unknown';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});
                const startDate = sprint.startDate ? sprint.startDate.split('T')[0] : '';
                const endDate = sprint.endDate ? sprint.endDate.split('T')[0] : '';

                return {
                    id: sprint.id, sprintName: sprint.name, startDate, endDate,
                    sprintDays: calculateWeekdays(startDate, endDate),
                    ticketsCompleted: completedIssues.length,
                    storyPointsCompleted: details.completedIssuesEstimateSum?.value || 0,
                    storyPointsNotCompleted: details.issuesNotCompletedEstimateSum?.value || 0,
                    memberNames: uniqueNames, teamMembers: uniqueNames.length,
                    daysOff: 0,
                    completedIssues, issuesNotCompleted, ticketTypeCounts,
                };
            }
            return null;
        }).filter(Boolean);

        onSprintsAdded(formattedSprints);
    };
    
    const availableSprints = useMemo(() => {
        const importedIds = new Set(importedSprintIds);
        return fetchedSprints.filter(sprint => !importedIds.has(sprint.id));
    }, [fetchedSprints, importedSprintIds]);

    const filteredSprints = useMemo(() => {
        if (!filterText) return availableSprints;
        return availableSprints.filter(sprint => 
            sprint.name.toLowerCase().startsWith(filterText.toLowerCase())
        );
    }, [availableSprints, filterText]);

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredSprints.map(s => s.id);
        const newSelected = { ...selectedSprints };
        const allSelected = filteredIds.every(id => selectedSprints[id]);
        
        filteredIds.forEach(id => {
            newSelected[id] = !allSelected;
        });
        setSelectedSprints(newSelected);
    };
    
    const handleStartOver = () => {
        setFetchedSprints([]);
        setJsonInput('');
        setGeneratedUrl('');
        setError('');
        setFetchStatus('');
        setSelectedSprints({});
        localStorage.removeItem('fetchedSprints');
    };

    const selectedCount = Object.values(selectedSprints).filter(Boolean).length;
    const selectedSprintsWithDetails = Object.keys(selectedSprints).filter(id => selectedSprints[id] && sprintDetails[id]).length;
    const isImportDisabled = selectedCount === 0 || selectedCount !== selectedSprintsWithDetails;

    const Tooltip = ({ text, children }) => (
        <div className="relative group flex items-center">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                {text}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <SprintDetailModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                sprint={currentSprint}
                boardId={boardId}
                jiraDomain={cleanDomain}
                onSave={onDetailAdded}
            />

            {!fetchedSprints.length && (
                <div className="space-y-4">
                    <div><label htmlFor="jiraDomain" className={labelStyle}>Jira Domain</label><input id="jiraDomain" type="text" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} className={inputStyle} placeholder="your-company.atlassian.net" /></div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="boardId" className={labelStyle}>Board ID</label>
                        <Tooltip text="Find this in your Jira board's URL. e.g., .../boards/123">
                            <HelpCircle size={14} className="text-gray-400" />
                        </Tooltip>
                    </div>
                    <input id="boardId" type="text" value={boardId} onChange={(e) => setBoardId(e.target.value)} className={inputStyle} placeholder="123" />
                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}
                    <button onClick={handleAutoFetchSprintsList} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                        <Zap size={16} className="mr-2" />
                        {isLoading ? 'Fetching...' : 'Auto-Fetch Sprints'}
                    </button>
                    {generatedUrl && (
                         <div className="space-y-4 mt-4 border-t pt-4">
                            <p className="text-sm font-medium text-center text-gray-600">Manual Fallback:</p>
                            <p className="text-sm font-medium">Step 1: Visit this URL and copy the JSON content.</p>
                            <input type="text" readOnly value={generatedUrl} className={`${inputStyle} font-mono text-xs`} />
                            <p className="text-sm font-medium">Step 2: Paste the JSON content here.</p>
                            <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className={`${inputStyle} min-h-24 font-mono text-xs`} placeholder="Paste JSON here..."></textarea>
                            <button onClick={handleParseSprints} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700">
                                Parse Sprints from JSON
                            </button>
                        </div>
                    )}
                </div>
            )}

            {fetchedSprints.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Select Sprints to Import</h3>
                        <button onClick={handleStartOver} className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center"><RefreshCw size={14} className="mr-1"/> Start Over</button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input id="filter" type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} className={inputStyle} placeholder="Filter by name (starts with...)" />
                        <button onClick={handleSelectAllFiltered} className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap">Select All</button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-lg">
                        {filteredSprints.map(sprint => (
                            <div key={sprint.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                <div className="flex items-center">
                                    <input type="checkbox" id={`sprint-${sprint.id}`} checked={!!selectedSprints[sprint.id]} onChange={() => handleCheckboxChange(sprint.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor={`sprint-${sprint.id}`} className="ml-3 block text-sm font-medium text-gray-700">{sprint.name}</label>
                                    {sprintDetails[sprint.id] && <CheckCircle size={16} className="ml-2 text-green-500" title="Details added" />}
                                </div>
                                <button onClick={() => handleFetchSprintDetails(sprint)} disabled={detailLoading[sprint.id]} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center disabled:text-gray-400">
                                    {detailLoading[sprint.id] ? <Loader2 size={14} className="animate-spin mr-1" /> : <Edit size={14} className="mr-1" />}
                                    {detailLoading[sprint.id] ? 'Fetching...' : 'Add Details'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                         <button onClick={handleBulkFetchDetails} disabled={isBulkFetching || selectedCount === 0} className="w-full bg-teal-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center">
                            <Zap size={16} className="mr-2" />
                            {isBulkFetching ? 'Fetching All...' : `Fetch Details for Selected (${selectedCount})`}
                        </button>
                        {fetchStatus && <p className="text-sm text-center text-gray-600">{fetchStatus}</p>}
                        <button onClick={handleBulkImport} disabled={isImportDisabled} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed" title={isImportDisabled ? 'Please select sprints and add details for all selected sprints before importing.' : 'Import selected sprints'}>
                            Import Selected ({selectedSprintsWithDetails}/{selectedCount})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
