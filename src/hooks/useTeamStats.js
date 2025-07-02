import { useState, useMemo } from 'react';

export const useTeamStats = (sprints) => {
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [sprintFilter, setSprintFilter] = useState('all');

    const memberStats = useMemo(() => {
        const stats = {};

        const filteredSprints = sprints.filter(sprint => {
            if (sprintFilter !== 'all' && sprint.id.toString() !== sprintFilter) {
                return false;
            }
            if (startDateFilter && new Date(sprint.startDate) < new Date(startDateFilter)) {
                return false;
            }
            if (endDateFilter && new Date(sprint.endDate) > new Date(endDateFilter)) {
                return false;
            }
            return true;
        });

        filteredSprints.forEach(sprint => {
            sprint.completedIssues?.forEach(issue => {
                const assignee = issue.assigneeName;
                if (!assignee) return;

                if (!stats[assignee]) {
                    stats[assignee] = {
                        name: assignee,
                        totalSP: 0,
                        totalTickets: 0,
                        ticketTypes: {},
                        tickets: [],
                    };
                }
                
                const sp = (issue.estimateStatistic?.statFieldValue?.value) || 0;
                stats[assignee].totalSP += sp;
                stats[assignee].totalTickets += 1;
                
                const type = issue.typeName || 'Unknown';
                stats[assignee].ticketTypes[type] = (stats[assignee].ticketTypes[type] || 0) + 1;
                
                stats[assignee].tickets.push({
                    key: issue.key,
                    summary: issue.summary,
                    sp: sp,
                    sprintName: sprint.sprintName
                });
            });
        });

        return Object.values(stats).sort((a, b) => b.totalSP - a.totalSP);
    }, [sprints, startDateFilter, endDateFilter, sprintFilter]);

    const clearFilters = () => {
        setStartDateFilter('');
        setEndDateFilter('');
        setSprintFilter('all');
    };

    return {
        memberStats,
        filters: {
            startDate: startDateFilter,
            endDate: endDateFilter,
            sprint: sprintFilter,
        },
        setFilters: {
            setStartDate: setStartDateFilter,
            setEndDate: setEndDateFilter,
            setSprint: setSprintFilter,
        },
        clearFilters,
    };
};
