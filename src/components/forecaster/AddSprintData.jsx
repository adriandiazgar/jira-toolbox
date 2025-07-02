import React, { useState, useMemo } from 'react';
import { useJiraImport } from '../../hooks/useJiraImport';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { JiraImportSetup } from './JiraImportSetup';
import { JiraSprintSelector } from './JiraSprintSelector';
import { SprintDetailModal } from './SprintDetailModal';
import { calculateWeekdays } from '../../utils/dateUtils';
import { Section } from '../ui/Section';

export function AddSprintData({ onSprintsAdded, sprintDetails, onDetailAdded, importedSprintIds }) {
    const [jiraDomain, setJiraDomain] = useLocalStorage('jiraDomain', '');
    const [boardId, setBoardId] = useLocalStorage('jiraBoardId', '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSprint, setCurrentSprint] = useState(null);

    const {
        isLoading, isBulkFetching, detailLoading, fetchedSprints, error, fetchStatus,
        cleanDomain, handleAutoFetchSprintsList, handleFetchSprintDetails, 
        handleBulkFetchDetails, handleStartOver
    } = useJiraImport(jiraDomain, boardId, onDetailAdded);

    const handleOpenDetailModal = (sprint) => {
        setCurrentSprint(sprint);
        setIsModalOpen(true);
    };
    
    const handleAttemptFetchDetails = async (sprint) => {
        try {
            await handleFetchSprintDetails(sprint);
        } catch (err) {
            handleOpenDetailModal(sprint);
        }
    };

    const handleBulkFetch = async (selectedIds) => {
        const sprintsToFetch = fetchedSprints.filter(s => 
            selectedIds.includes(s.id.toString()) && !sprintDetails[s.id]
        );
        await handleBulkFetchDetails(sprintsToFetch);
    };

    const handleBulkImport = (selectedIdsMap) => {
        const sprintsToImport = fetchedSprints.filter(s => selectedIdsMap[s.id]);
        
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
                <JiraImportSetup 
                    jiraDomain={jiraDomain}
                    setJiraDomain={setJiraDomain}
                    boardId={boardId}
                    setBoardId={setBoardId}
                    onFetch={handleAutoFetchSprintsList}
                    isLoading={isLoading}
                    error={error}
                />
            ) : (
                <JiraSprintSelector
                    fetchedSprints={fetchedSprints}
                    sprintDetails={sprintDetails}
                    importedSprintIds={importedSprintIds}
                    onStartOver={handleStartOver}
                    onFetchDetails={handleAttemptFetchDetails}
                    onBulkFetch={handleBulkFetch}
                    onImport={handleBulkImport}
                    isBulkFetching={isBulkFetching}
                    detailLoading={detailLoading}
                    fetchStatus={fetchStatus}
                />
            )}
        </Section>
    );
}
