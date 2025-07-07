import { useState, useMemo } from 'react';

const getStoryPoints = (issue) => {
    return issue.estimateStatistic?.statFieldValue?.value || 0;
};

export const useEpics = (sprints) => {
    const [selectedSprintIds, setSelectedSprintIds] = useState([]);
    const [nameFilter, setNameFilter] = useState('');

    const epicsData = useMemo(() => {
        const epics = {};

        // 1. Determine which sprints to process based on the filter
        const sprintsToProcess = selectedSprintIds.length > 0
            ? sprints.filter(s => selectedSprintIds.includes(s.id.toString()))
            : sprints;

        // 2. Iterate over the selected sprints to aggregate epic data
        sprintsToProcess.forEach(sprint => {
            if (!sprint.completedIssues) return;

            sprint.completedIssues.forEach(issue => {
                const epicField = issue.epicField;
                if (!epicField) return;

                const epicInfo = {
                    id: epicField.issueId,
                    name: epicField.summary,
                    summary: epicField.summary,
                };

                if (!epicInfo || !epicInfo.id) return;

                if (!epics[epicInfo.id]) {
                    epics[epicInfo.id] = {
                        id: epicInfo.id,
                        name: epicInfo.name,
                        summary: epicInfo.summary,
                        totalSP: 0,
                        totalTickets: 0,
                        tickets: [],
                    };
                }

                const sp = getStoryPoints(issue);
                epics[epicInfo.id].totalSP += sp;
                epics[epicInfo.id].totalTickets += 1;
                epics[epicInfo.id].tickets.push({
                    key: issue.key,
                    summary: issue.summary,
                    sp: sp,
                    sprintName: sprint.sprintName,
                    assignee: issue.assigneeName || 'Unassigned',
                });
            });
        });

        // 3. Filter the final list of epics by the name filter
        const allAggregatedEpics = Object.values(epics);
        
        if (!nameFilter) {
            return allAggregatedEpics.sort((a, b) => b.totalSP - a.totalSP);
        }

        return allAggregatedEpics
            .filter(epic => epic.name.toLowerCase().includes(nameFilter.toLowerCase()))
            .sort((a, b) => b.totalSP - a.totalSP);

    }, [sprints, selectedSprintIds, nameFilter]);

    return { 
        epicsData, 
        sprintFilter: selectedSprintIds, 
        setSprintFilter: setSelectedSprintIds,
        nameFilter,
        setNameFilter,
    };
};
