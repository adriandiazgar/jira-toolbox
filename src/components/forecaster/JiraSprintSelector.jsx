import React, { useState, useMemo } from 'react';
import { CheckCircle, Edit, Loader2, RefreshCw, Zap } from 'lucide-react';

const inputStyle = "w-full p-3 bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition border border-gray-200";

export function JiraSprintSelector({ fetchedSprints, sprintDetails, importedSprintIds, onStartOver, onFetchDetails, onBulkFetch, onImport, isBulkFetching, detailLoading, fetchStatus }) {
    const [selectedSprints, setSelectedSprints] = useState({});
    const [filterText, setFilterText] = useState('');

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

    const handleCheckboxChange = (sprintId) => {
        setSelectedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
    };

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredSprints.map(s => s.id);
        const newSelected = { ...selectedSprints };
        const allSelected = filteredIds.every(id => selectedSprints[id]);
        filteredIds.forEach(id => { newSelected[id] = !allSelected; });
        setSelectedSprints(newSelected);
    };

    const selectedCount = Object.values(selectedSprints).filter(Boolean).length;
    const selectedSprintsWithDetails = Object.keys(selectedSprints).filter(id => selectedSprints[id] && sprintDetails[id]).length;
    const isImportDisabled = selectedCount === 0 || selectedCount !== selectedSprintsWithDetails;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Select Sprints to Import</h3>
                <button onClick={onStartOver} className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center"><RefreshCw size={14} className="mr-1"/> Start Over</button>
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
                        <button onClick={() => onFetchDetails(sprint)} disabled={detailLoading[sprint.id]} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center disabled:text-gray-400">
                            {detailLoading[sprint.id] ? <Loader2 size={14} className="animate-spin mr-1" /> : <Edit size={14} className="mr-1" />}
                            {detailLoading[sprint.id] ? 'Fetching...' : 'Add Details'}
                        </button>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                 <button onClick={() => onBulkFetch(Object.keys(selectedSprints).filter(id => selectedSprints[id]))} disabled={isBulkFetching || selectedCount === 0} className="w-full bg-teal-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center">
                    <Zap size={16} className="mr-2" />
                    {isBulkFetching ? 'Fetching All...' : `Fetch Details for Selected (${selectedCount})`}
                </button>
                {fetchStatus && <p className="text-sm text-center text-gray-600">{fetchStatus}</p>}
                <button onClick={() => onImport(selectedSprints)} disabled={isImportDisabled} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed" title={isImportDisabled ? 'Please select sprints and add details for all selected sprints before importing.' : 'Import selected sprints'}>
                    Import Selected ({selectedSprintsWithDetails}/{selectedCount})
                </button>
            </div>
        </div>
    );
}
