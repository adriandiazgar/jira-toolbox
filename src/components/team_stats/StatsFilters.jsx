import React from 'react';
import { XCircle } from 'lucide-react';
import { Section } from '../ui/Section';

export function StatsFilters({ sprints, filters, setFilters, clearFilters }) {
    return (
        <Section title="Filters">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="text-sm font-medium text-gray-600">Sprint</label>
                    <select value={filters.sprint} onChange={e => setFilters.setSprint(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg">
                        <option value="all">All Sprints</option>
                        {sprints.map(s => <option key={s.id} value={s.id}>{s.sprintName}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-600">Date Range</label>
                    <div className="flex items-center space-x-2">
                        <input type="date" value={filters.startDate} onChange={e => setFilters.setStartDate(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg"/>
                        <span>-</span>
                        <input type="date" value={filters.endDate} onChange={e => setFilters.setEndDate(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg"/>
                    </div>
                </div>
                <button onClick={clearFilters} className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                    <XCircle size={16} />
                    <span>Clear Filters</span>
                </button>
            </div>
        </Section>
    );
}
