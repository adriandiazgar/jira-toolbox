import React, { useState, useMemo, useEffect } from 'react';
import { Wifi, CheckCircle, Edit, Zap, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateWeekdays } from '../../utils/dateUtils';
import { fetchClosedSprints, fetchSprintReport } from '../../services/jiraApi';
import { Section } from '../ui/Section';
import { SprintDetailModal } from './SprintDetailModal';
import { Tooltip } from '../ui/Tooltip';

const inputStyle = "w-full p-3 bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition border border-gray-200";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

export function AddSprintData({ onSprintsAdded, sprintDetails, onDetailAdded, importedSprintIds, jiraDomain, setJiraDomain }) {
    const [boardId, setBoardId] = useLocalStorage('jiraBoardId', '');
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [detailLoading, setDetailLoading] = useState({});
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [fetchedSprints, setFetchedSprints] = useLocalStorage('fetchedSprints', []);
    const [selectedSprints, setSelectedSprints] = useState({});
    const [filterText, setFilterText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSprint, setCurrentSprint] = useState(null);
    const [error, setError] = useState('');
    const [fetchStatus, setFetchStatus] = useState('');

    const cleanDomain = useMemo(() => jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, ''), [jiraDomain]);

    const handleAutoFetchSprintsList = async () => {
        if (!jiraDomain || !boardId) {
            setError('Please provide your Jira Domain and Board ID.');
            return;
        }
        setError('');
        setIsLoading(true);
        setFetchStatus('');
        
        try {
            const data = await fetchClosedSprints(cleanDomain, boardId);
            if (!data.values) throw new Error("Invalid JSON structure.");
            setFetchedSprints(data.values);
        } catch (err) {
            console.error("Auto-fetch failed:", err);
            const url = `https://${cleanDomain}/rest/agile/1.0/board/${boardId}/sprint?state=closed`;
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

    const handleOpenDetailModal = (sprint) => {
        setCurrentSprint(sprint);
        setIsModalOpen(true);
    };

    const handleAttemptFetchDetails = async (sprint) => {
        setDetailLoading(prev => ({ ...prev, [sprint.id]: true }));
        try {
            const data = await fetchSprintReport(cleanDomain, boardId, sprint.id);
            if (!data.contents) throw new Error('Invalid detail JSON');
            onDetailAdded(sprint.id, data.contents);
        } catch (err) {
            handleOpenDetailModal(sprint);
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

        const promises = sprintsToFetch.map(sprint => 
            fetchSprintReport(cleanDomain, boardId, sprint.id)
                .then(data => ({ status: 'fulfilled', sprintId: sprint.id, contents: data.contents }))
                .catch(err => ({ status: 'rejected', sprintId: sprint.id, reason: err }))
        );
        
        const results = await Promise.all(promises);
        let successCount = 0;
        let failureCount = 0;

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.contents) {
                onDetailAdded(result.sprintId, result.contents);
                successCount++;
            } else {
                failureCount++;
            }
        });
        
        setFetchStatus(`Fetch complete. Success: ${successCount}. Failures: ${failureCount}.`);
        setIsBulkFetching(false);
    };

    const handleBulkImport = () => {
        const sprintsToImport = fetchedSprints.filter(s => selectedSprints[s.id]);
        
        const formattedSprints = sprintsToImport.map(sprint => {
            const details = sprintDetails[sprint.id];
            if (details) {
                const completedIssues = details.completedIssues || [];
                // *** FIX: Use the correct field for uncompleted issues ***
                const issuesNotCompleted = details.issuesNotCompletedInCurrentSprint || [];
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
        filteredIds.forEach(id => { newSelected[id] = !allSelected; });
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

    return (
        <Section title="Import from Jira">
            <SprintDetailModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                sprint={currentSprint}
                boardId={boardId}
                jiraDomain={cleanDomain}
                onSave={onDetailAdded}
            />
            {fetchedSprints.length === 0 ? (
                <div className="space-y-4">
                    <div><label htmlFor="jiraDomain" className={labelStyle}>Jira Domain</label><input id="jiraDomain" type="text" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} className={inputStyle} placeholder="your-company.atlassian.net" /></div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="boardId" className={labelStyle}>Board ID</label>
                        <Tooltip text="Find this in your Jira board's URL. e.g., .../boards/123"><HelpCircle size={14} className="text-gray-400" /></Tooltip>
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
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Select Sprints to Import</h3>
                        <button onClick={handleStartOver} className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center"><RefreshCw size={14} className="mr-1"/> Start Over</button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input id="filter" type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} className={inputStyle} placeholder="Filter by name (starts with...)" />
                        <button onClick={handleSelectAllFiltered} className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap">Select All</button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                        {filteredSprints.map(sprint => (
                            <div key={sprint.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                                <div className="flex items-center">
                                    <input type="checkbox" id={`sprint-${sprint.id}`} checked={!!selectedSprints[sprint.id]} onChange={() => handleCheckboxChange(sprint.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <label htmlFor={`sprint-${sprint.id}`} className="ml-3 block text-sm font-medium text-gray-700">{sprint.name}</label>
                                    {sprintDetails[sprint.id] && <CheckCircle size={16} className="ml-2 text-green-500" title="Details added" />}
                                </div>
                                <button onClick={() => handleAttemptFetchDetails(sprint)} disabled={detailLoading[sprint.id]} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center disabled:text-gray-400">
                                    {detailLoading[sprint.id] ? <Loader2 size={14} className="animate-spin mr-1" /> : <Edit size={14} className="mr-1" />}
                                    {detailLoading[sprint.id] ? 'Fetching...' : 'Add Details'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                         <button onClick={() => handleBulkFetchDetails(Object.keys(selectedSprints).filter(id => selectedSprints[id]))} disabled={isBulkFetching || selectedCount === 0} className="w-full bg-teal-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center">
                            <Zap size={16} className="mr-2" />
                            {isBulkFetching ? 'Fetching All...' : `Fetch Details for Selected (${selectedCount})`}
                        </button>
                        {fetchStatus && <p className="text-sm text-center text-gray-600">{fetchStatus}</p>}
                        <button onClick={() => handleBulkImport(selectedSprints)} disabled={isImportDisabled} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed" title={isImportDisabled ? 'Please select sprints and add details for all selected sprints before importing.' : 'Import selected sprints'}>
                            Import Selected ({selectedSprintsWithDetails}/{selectedCount})
                        </button>
                    </div>
                </div>
            )}
        </Section>
    );
}
