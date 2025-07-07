import React from 'react';
import { useEpics } from '../../hooks/useEpics';
import { EpicCard } from './EpicCard';
import { EpicFilters } from './EpicFilters';
import { Section } from '../ui/Section';

export function EpicsAnalysis({ sprints, jiraDomain }) {
    const { 
        allEpics,
        epicsData, 
        sprintFilter, 
        setSprintFilter, 
        nameFilter, 
        setNameFilter 
    } = useEpics(sprints);

    if (sprints.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800">Epics Analysis</h2>
                <p className="text-gray-500 mt-2">Import some sprint data to see epic-level statistics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <EpicFilters 
                sprints={sprints}
                allEpics={allEpics}
                nameFilter={nameFilter}
                setNameFilter={setNameFilter}
                sprintFilter={sprintFilter}
                setSprintFilter={setSprintFilter}
            />
            <Section title="Epic Breakdown">
                {epicsData.length > 0 ? (
                    <div className="space-y-4">
                        {epicsData.map(epic => (
                            <EpicCard key={epic.id} epic={epic} jiraDomain={jiraDomain} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No completed issues with associated epics found for the selected filters.</p>
                )}
            </Section>
        </div>
    );
}
