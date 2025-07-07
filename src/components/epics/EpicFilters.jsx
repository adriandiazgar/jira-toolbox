import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Section } from '../ui/Section';
import { ChevronsUpDown } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

const inputStyle = "w-full p-3 bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition border border-gray-200";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

export function EpicFilters({ sprints, allEpics, nameFilter, setNameFilter, sprintFilter, setSprintFilter }) {
    const [isSprintOpen, setIsSprintOpen] = useState(false);
    const [isEpicOpen, setIsEpicOpen] = useState(false);
    const sprintDropdownRef = useRef(null);
    const epicDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(event.target)) {
                setIsSprintOpen(false);
            }
            if (epicDropdownRef.current && !epicDropdownRef.current.contains(event.target)) {
                setIsEpicOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSprintSelection = (sprintId) => {
        const id = sprintId.toString();
        if (sprintFilter.includes(id)) {
            setSprintFilter(sprintFilter.filter(s => s !== id));
        } else {
            setSprintFilter([...sprintFilter, id]);
        }
    };

    const filteredAutocompleteEpics = useMemo(() => {
        // --- FIX: Add a guard clause to ensure allEpics is a valid array ---
        if (!nameFilter || !Array.isArray(allEpics)) {
            return [];
        }
        return allEpics.filter(epic => epic.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }, [allEpics, nameFilter]);

    return (
        <Section title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative" ref={epicDropdownRef}>
                    <label htmlFor="epicNameFilter" className={labelStyle}>Filter by Epic Name</label>
                    <input
                        id="epicNameFilter"
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        onFocus={() => setIsEpicOpen(true)}
                        className={inputStyle}
                        placeholder="e.g., User Authentication"
                    />
                    {isEpicOpen && filteredAutocompleteEpics.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {filteredAutocompleteEpics.map(epic => (
                                    <div key={epic.id} onClick={() => { setNameFilter(epic.name); setIsEpicOpen(false); }} className="p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <p className="text-sm font-medium text-gray-800">{epic.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative" ref={sprintDropdownRef}>
                    <label className={labelStyle}>Filter by Sprints</label>
                    <button
                        onClick={() => setIsSprintOpen(!isSprintOpen)}
                        className={`${inputStyle} flex items-center justify-between text-left`}
                    >
                        <span className="truncate text-gray-800">
                            {sprintFilter.length === 0
                                ? "All Sprints"
                                : `${sprintFilter.length} sprint(s) selected`}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </button>
                    {isSprintOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {sprints.map(sprint => (
                                    <div key={sprint.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            id={`sprint-filter-${sprint.id}`}
                                            checked={sprintFilter.includes(sprint.id.toString())}
                                            onChange={() => handleSprintSelection(sprint.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`sprint-filter-${sprint.id}`} className="ml-3 block text-sm font-medium text-gray-800">
                                            {sprint.sprintName}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Section>
    );
}
