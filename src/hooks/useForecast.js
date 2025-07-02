import { useState, useMemo, useEffect } from 'react';
import { calculateWeekdays } from '../utils/dateUtils';

const getNextMonday = () => {
    const date = new Date();
    const today = date.getDay(); // Sunday - 0, Monday - 1, ...
    const offset = today === 0 ? 1 : (today === 6 ? 2 : (8 - today) % 7);
    date.setDate(date.getDate() + offset);
    return date;
};

export const useForecast = (sprints) => {
    // --- STATE MANAGEMENT ---
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [futureStartDate, setFutureStartDate] = useState(() => getNextMonday().toISOString().split('T')[0]);
    const [futureEndDate, setFutureEndDate] = useState(() => {
        const startDate = getNextMonday();
        const endDate = new Date(startDate.getTime() + 11 * 24 * 60 * 60 * 1000); 
        return endDate.toISOString().split('T')[0];
    });
    const [confidenceInterval, setConfidenceInterval] = useState(15);
    const [simpleTeamMembers, setSimpleTeamMembers] = useState(5);
    const [simpleDaysOff, setSimpleDaysOff] = useState(0);
    const [advancedDaysOff, setAdvancedDaysOff] = useState({});
    const [memberSelection, setMemberSelection] = useState({});

    // --- MEMOIZED CALCULATIONS ---
    const memberStats = useMemo(() => {
        const stats = {};
        sprints.forEach(sprint => {
            sprint.completedIssues?.forEach(issue => {
                const assignee = issue.assigneeName;
                if (!assignee) return;
                if (!stats[assignee]) {
                    stats[assignee] = { name: assignee, totalSP: 0, totalWorkDays: 0 };
                }
                stats[assignee].totalSP += (issue.estimateStatistic?.statFieldValue?.value) || 0;
            });
            sprint.memberNames?.forEach(name => {
                if (!stats[name]) {
                    stats[name] = { name: name, totalSP: 0, totalWorkDays: 0 };
                }
                stats[name].totalWorkDays += sprint.sprintDays;
            });
        });

        return Object.values(stats).map(member => ({
            ...member,
            avgVelocity: member.totalWorkDays > 0 ? (member.totalSP / member.totalWorkDays) : 0,
        })).sort((a,b) => b.avgVelocity - a.avgVelocity);
    }, [sprints]);

    // --- EFFECTS ---
    useEffect(() => {
        const initialSelection = {};
        const initialDaysOff = {};
        memberStats.forEach(member => {
            initialSelection[member.name] = true;
            initialDaysOff[member.name] = 0;
        });
        setMemberSelection(initialSelection);
        setAdvancedDaysOff(initialDaysOff);
    }, [memberStats]);

    // --- HANDLER FUNCTIONS ---
    const handleAdvancedDaysOffChange = (memberName, days) => {
        setAdvancedDaysOff(prev => ({ ...prev, [memberName]: Number(days) }));
    };

    const handleMemberSelectionChange = (memberName) => {
        setMemberSelection(prev => ({ ...prev, [memberName]: !prev[memberName] }));
    };

    const totalPlannedDaysOff = useMemo(() => {
        if (isAdvancedMode) {
            return Object.entries(advancedDaysOff).reduce((sum, [name, days]) => memberSelection[name] ? sum + days : sum, 0);
        }
        return simpleDaysOff;
    }, [isAdvancedMode, simpleDaysOff, advancedDaysOff, memberSelection]);

    const forecastData = useMemo(() => {
        if (sprints.length === 0) {
            return { averageVelocity: 0, forecast: 0, forecastRange: '0 - 0', risk: { text: 'N/A', subtitle: 'No data' }};
        }
        
        const { totalEffectiveDays, totalSpCompleted, totalSpNotCompleted } = sprints.reduce((acc, s) => {
            const effective = ((s.teamMembers || s.memberNames?.length) * s.sprintDays) - s.daysOff;
            if (effective > 0) { 
                acc.totalEffectiveDays += effective;
                acc.totalSpCompleted += s.storyPointsCompleted; 
                acc.totalSpNotCompleted += s.storyPointsNotCompleted;
            }
            return acc;
        }, { totalEffectiveDays: 0, totalSpCompleted: 0, totalSpNotCompleted: 0 });
        
        const avgVelocity = totalEffectiveDays > 0 ? (totalSpCompleted / totalEffectiveDays) : 0;
        const futureWorkingDays = calculateWeekdays(futureStartDate, futureEndDate);
        
        let finalForecast = 0;
        let totalPossibleWorkDays = 0;
        let keyMemberAbsent = false;

        if (isAdvancedMode) {
            const selectedMembers = memberStats.filter(m => memberSelection[m.name]);
            const topPerformers = memberStats.slice(0, Math.ceil(memberStats.length * 0.25));
            keyMemberAbsent = topPerformers.some(performer => !memberSelection[performer.name]);

            let totalCapacity = 0;
            selectedMembers.forEach(member => {
                const memberDaysOff = advancedDaysOff[member.name] || 0;
                const memberEffectiveDays = futureWorkingDays - memberDaysOff;
                totalCapacity += member.avgVelocity * memberEffectiveDays;
            });
            finalForecast = Math.round(totalCapacity);
            totalPossibleWorkDays = selectedMembers.length * futureWorkingDays;
        } else {
            const futureEffectiveDays = (simpleTeamMembers * futureWorkingDays) - simpleDaysOff;
            finalForecast = Math.round(avgVelocity * futureEffectiveDays);
            totalPossibleWorkDays = simpleTeamMembers * futureWorkingDays;
        }
        
        finalForecast = finalForecast > 0 ? finalForecast : 0;
        const rangePercent = confidenceInterval / 100;
        const forecastLow = Math.round(finalForecast * (1 - rangePercent));
        const forecastHigh = Math.round(finalForecast * (1 + rangePercent));
        const range = `${forecastLow} - ${forecastHigh}`;

        let riskScore = 0;
        const riskFactors = [];
        const offDaysRatio = totalPossibleWorkDays > 0 ? totalPlannedDaysOff / totalPossibleWorkDays : 0;
        if (offDaysRatio > 0.1) {
            riskScore += 1;
            riskFactors.push("Time off");
        }
        if (offDaysRatio > 0.25) riskScore += 1;

        const totalCommittedSP = totalSpCompleted + totalSpNotCompleted;
        const carryOverRate = totalCommittedSP > 0 ? totalSpNotCompleted / totalCommittedSP : 0;
        if (carryOverRate > 0.15) {
            riskScore += 1;
            riskFactors.push("High carry-over");
        }

        if (isAdvancedMode && keyMemberAbsent) {
            riskScore += 1;
            riskFactors.push("Key member absent");
        }

        let riskIndicator = { level: 'Low', color: 'bg-green-100', textColor: 'text-green-600', text: 'Low Risk', subtitle: 'No major risks detected' };
        if (riskScore >= 2) {
            riskIndicator = { level: 'High', color: 'bg-red-100', textColor: 'text-red-600', text: 'High Risk', subtitle: `Based on: ${riskFactors.join(', ')}` };
        } else if (riskScore === 1) {
            riskIndicator = { level: 'Medium', color: 'bg-yellow-100', textColor: 'text-yellow-600', text: 'Medium Risk', subtitle: `Based on: ${riskFactors.join(', ')}` };
        }
        
        return { averageVelocity: avgVelocity, forecast: finalForecast, forecastRange: range, risk: riskIndicator };
    }, [sprints, futureStartDate, futureEndDate, simpleTeamMembers, simpleDaysOff, confidenceInterval, isAdvancedMode, memberStats, memberSelection, advancedDaysOff, totalPlannedDaysOff]);
    
    // --- RETURN VALUE ---
    return {
        isAdvancedMode, setIsAdvancedMode,
        futureStartDate, setFutureStartDate,
        futureEndDate, setFutureEndDate,
        confidenceInterval, setConfidenceInterval,
        simpleTeamMembers, setSimpleTeamMembers,
        simpleDaysOff, setSimpleDaysOff,
        advancedDaysOff,
        memberSelection,
        memberStats,
        forecastData,
        handleAdvancedDaysOffChange,
        handleMemberSelectionChange,
    };
};
