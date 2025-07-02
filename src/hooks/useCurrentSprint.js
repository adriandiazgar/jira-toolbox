import { useState, useEffect } from 'react';
import { fetchSprintIssues } from '../services/jiraApi';
import { calculateWeekdays, calculateBusinessDaysSince } from '../utils/dateUtils';

const getStoryPoints = (issue, spFieldId) => {
    if (!issue || !issue.fields) return 0;
    return issue.fields[spFieldId] || 0;
};

export const useCurrentSprint = (selectedSprint, cleanDomain, spFieldId) => {
    const [sprintData, setSprintData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const processSprintDetails = async () => {
            if (!selectedSprint || !cleanDomain) {
                setSprintData(null);
                return;
            };

            setIsLoading(true);
            setError('');
            
            try {
                const data = await fetchSprintIssues(cleanDomain, selectedSprint.id);
                const totalSP = data.issues.reduce((sum, issue) => sum + getStoryPoints(issue, spFieldId), 0);
                
                // --- Analysis Calculations ---
                const performers = {};
                const completedIssues = data.issues.filter(i => i.fields.status.statusCategory.name === 'Done');
                
                completedIssues.forEach(issue => {
                    const assignee = issue.fields.assignee?.displayName;
                    if (!assignee) return;
                    if (!performers[assignee]) {
                        performers[assignee] = { name: assignee, sp: 0, tickets: 0, bugs: 0 };
                    }
                    performers[assignee].sp += getStoryPoints(issue, spFieldId);
                    performers[assignee].tickets += 1;
                    if (issue.fields.issuetype.name.toLowerCase() === 'bug') {
                        performers[assignee].bugs += 1;
                    }
                });

                const memberHighlights = Object.values(performers).sort((a, b) => b.sp - a.sp);
                const topSpPerformer = [...memberHighlights].sort((a, b) => b.sp - a.sp)[0];
                const topTicketPerformer = [...memberHighlights].sort((a, b) => b.tickets - a.tickets)[0];
                const topBugSquasher = [...memberHighlights].sort((a, b) => b.bugs - a.bugs)[0];
                
                const unassignedInProgressIssues = data.issues.filter(i => !i.fields.assignee && i.fields.status.statusCategory.name === 'In Progress');
                
                const scopeCreepIssues = [];
                let totalScopeCreepSP = 0;
                if (selectedSprint && selectedSprint.startDate) {
                    const sprintStartDate = new Date(selectedSprint.startDate);
                    data.issues.forEach(issue => {
                        issue.changelog?.histories.forEach(history => {
                            history.items.forEach(item => {
                                if (item.field === 'Sprint' && item.toString === selectedSprint.name) {
                                    const addedDate = new Date(history.created);
                                    if (addedDate > sprintStartDate) {
                                        scopeCreepIssues.push(issue);
                                        totalScopeCreepSP += getStoryPoints(issue, spFieldId);
                                    }
                                }
                            });
                        });
                    });
                }

                const staleIssues = [];
                data.issues
                    .filter(i => i.fields.status.statusCategory.name === 'In Progress')
                    .forEach(issue => {
                        let lastInProgressDate = null;
                        issue.changelog?.histories.forEach(history => {
                            history.items.forEach(item => {
                                if (item.field === 'status' && item.toString === 'In Progress') {
                                    lastInProgressDate = new Date(history.created);
                                }
                            });
                        });
                        if (lastInProgressDate) {
                            const daysInStatus = calculateBusinessDaysSince(lastInProgressDate);
                            let colorClass = '';
                            if (daysInStatus > 7) colorClass = 'bg-red-100 border-red-200';
                            else if (daysInStatus > 5) colorClass = 'bg-orange-100 border-orange-200';
                            else if (daysInStatus > 3) colorClass = 'bg-yellow-100 border-yellow-200';
                            
                            if (colorClass) {
                                staleIssues.push({ ...issue, daysInStatus: `${daysInStatus} days`, colorClass });
                            }
                        }
                    });

                // --- Burndown Calculation ---
                let todayIndex = null;
                const burndownData = [];
                if (selectedSprint && selectedSprint.startDate && selectedSprint.endDate) {
                    const startDate = new Date(selectedSprint.startDate);
                    const endDate = new Date(selectedSprint.endDate);
                    const sprintDurationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                    const workingDays = calculateWeekdays(selectedSprint.startDate, selectedSprint.endDate);
                    const dailyBurn = workingDays > 0 ? totalSP / workingDays : 0;
                    
                    const dailyCompletions = new Map();
                    data.issues.forEach(issue => {
                        const sp = getStoryPoints(issue, spFieldId);
                        if (sp > 0 && issue.fields.resolutiondate) {
                            const resolutionDate = new Date(issue.fields.resolutiondate);
                            const dateKey = resolutionDate.toISOString().split('T')[0];
                            dailyCompletions.set(dateKey, (dailyCompletions.get(dateKey) || 0) + sp);
                        }
                    });

                    let remainingSP = totalSP;
                    let idealSP = totalSP;
                    let workdaysPassed = 0;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    for (let i = 0; i <= sprintDurationInDays; i++) {
                        const currentDate = new Date(startDate);
                        currentDate.setDate(startDate.getDate() + i);
                        const dateKey = currentDate.toISOString().split('T')[0];
                        const dayOfWeek = currentDate.getDay();

                        remainingSP -= (dailyCompletions.get(dateKey) || 0);
                        
                        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                             burndownData.push({
                                day: `Day ${workdaysPassed}`,
                                ideal: Math.max(0, idealSP),
                                remaining: remainingSP,
                            });
                            
                            const currentDayCheck = new Date(currentDate);
                            currentDayCheck.setHours(0,0,0,0);
                            if (currentDayCheck.getTime() === today.getTime()) {
                                todayIndex = workdaysPassed;
                            }

                            idealSP -= dailyBurn;
                            workdaysPassed++;
                        }
                    }
                }

                setSprintData({
                    totalSP,
                    ticketsByStatus: data.issues.reduce((acc, issue) => {
                        const status = issue.fields.status.statusCategory.name;
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                    }, {}),
                    ticketTypes: data.issues.reduce((acc, issue) => {
                        const type = issue.fields.issuetype.name;
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {}),
                    flaggedIssues: data.issues.filter(issue => issue.fields.flagged),
                    memberHighlights,
                    topSpPerformer,
                    topTicketPerformer,
                    topBugSquasher,
                    staleIssues,
                    scopeCreepIssues,
                    totalScopeCreepSP,
                    unassignedIssues: unassignedInProgressIssues,
                    burndownData,
                    todayIndex,
                });

            } catch (err) {
                setError("Failed to fetch or process sprint details.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        processSprintDetails();
    }, [selectedSprint, cleanDomain, spFieldId]);

    return { sprintData, isLoading, error };
};
