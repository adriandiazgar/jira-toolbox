import React, { useState, useMemo, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { calculateWeekdays } from '../utils/dateUtils';

const StatCard = ({ icon, title, value, color, subtitle, valueColor = 'text-gray-800' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
            <h3 className="text-lg font-semibold text-gray-500 mt-4">{title}</h3>
            <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
    </div>
);

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

const getNextMonday = () => {
    const date = new Date();
    const today = date.getDay(); // Sunday - 0, Monday - 1, ...
    const offset = today === 0 ? 1 : (today === 6 ? 2 : (8 - today) % 7);
    date.setDate(date.getDate() + offset);
    return date;
};

export function CapacityForecast({ sprints }) {
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    
    // Common state
    const [futureStartDate, setFutureStartDate] = useState(() => getNextMonday().toISOString().split('T')[0]);
    const [futureEndDate, setFutureEndDate] = useState(() => {
        const startDate = getNextMonday();
        const endDate = new Date(startDate.getTime() + 11 * 24 * 60 * 60 * 1000); 
        return endDate.toISOString().split('T')[0];
    });
    const [confidenceInterval, setConfidenceInterval] = useState(15);

    // State for simple mode
    const [simpleTeamMembers, setSimpleTeamMembers] = useState(5);
    const [simpleDaysOff, setSimpleDaysOff] = useState(0);

    // State for advanced mode
    const [advancedDaysOff, setAdvancedDaysOff] = useState({});
    const [memberSelection, setMemberSelection] = useState({});

    const memberStats = useMemo(() => {
        const stats = {};
        sprints.forEach(sprint => {
            sprint.completedIssues?.forEach(issue => {
                const assignee = issue.assigneeName;
                if (!assignee) return;

                if (!stats[assignee]) {
                    stats[assignee] = { name: assignee, totalSP: 0, sprintCount: 0, totalWorkDays: 0 };
                }
                stats[assignee].totalSP += (issue.estimateStatistic?.statFieldValue?.value) || 0;
            });
            sprint.memberNames?.forEach(name => {
                if (!stats[name]) {
                    stats[name] = { name: name, totalSP: 0, sprintCount: 0, totalWorkDays: 0 };
                }
                stats[name].sprintCount += 1;
                stats[name].totalWorkDays += sprint.sprintDays;
            });
        });

        return Object.values(stats).map(member => ({
            ...member,
            avgVelocity: member.totalWorkDays > 0 ? (member.totalSP / member.totalWorkDays) : 0,
        })).sort((a,b) => b.avgVelocity - a.avgVelocity);
    }, [sprints]);

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

    const { averageVelocity, forecast, forecastRange, risk } = useMemo(() => {
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
            const topPerformers = memberStats.slice(0, Math.ceil(memberStats.length * 0.25)); // Top 25%
            
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

        // --- Enhanced Risk Calculation ---
        let riskScore = 0;
        const riskFactors = [];

        // 1. Time Off Risk
        const offDaysRatio = totalPossibleWorkDays > 0 ? totalPlannedDaysOff / totalPossibleWorkDays : 0;
        if (offDaysRatio > 0.1) {
            riskScore += 1;
            riskFactors.push("Time off");
        }
        if (offDaysRatio > 0.25) {
            riskScore += 1; // Extra point for high time off
        }

        // 2. Historical Carry-over Risk
        const totalCommittedSP = totalSpCompleted + totalSpNotCompleted;
        const carryOverRate = totalCommittedSP > 0 ? totalSpNotCompleted / totalCommittedSP : 0;
        if (carryOverRate > 0.15) {
            riskScore += 1;
            riskFactors.push("High carry-over");
        }

        // 3. Key Member Absence Risk
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

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Forecast Future Capacity</h2>
                <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div><label className={labelStyle}>Start Date</label><input type="date" value={futureStartDate} onChange={(e) => setFutureStartDate(e.target.value)} className={inputStyle} /></div>
                    <div><label className={labelStyle}>End Date</label><input type="date" value={futureEndDate} onChange={(e) => setFutureEndDate(e.target.value)} className={inputStyle} /></div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Planning Mode</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{isAdvancedMode ? 'Advanced' : 'Simple'}</span>
                        <button onClick={() => setIsAdvancedMode(!isAdvancedMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAdvancedMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAdvancedMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                
                {!isAdvancedMode ? (
                    <div className="mt-4 space-y-4">
                        <div><label className={labelStyle}>Team Members</label><input type="number" min="1" value={simpleTeamMembers} onChange={(e) => setSimpleTeamMembers(Number(e.target.value))} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Total Planned Days Off</label><input type="number" min="0" value={simpleDaysOff} onChange={(e) => setSimpleDaysOff(Number(e.target.value))} className={inputStyle} /></div>
                        <p className="text-xs text-gray-500 italic">In Simple Mode, the forecast uses the team's overall average velocity, not individual member velocities.</p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        <h4 className="font-semibold text-gray-600">Team Composition & Days Off</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {memberStats.length > 0 ? memberStats.map(member => (
                                <div key={member.name} className="flex justify-between items-center p-2 rounded-md bg-white border">
                                    <div className="flex items-center">
                                        <input type="checkbox" id={`member-${member.name}`} checked={!!memberSelection[member.name]} onChange={() => handleMemberSelectionChange(member.name)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor={`member-${member.name}`} className="ml-3 block text-sm font-medium text-gray-700">{member.name}</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500" title="Average SP per workday">{member.avgVelocity.toFixed(1)} SP/day</span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="Off"
                                            value={advancedDaysOff[member.name] || 0}
                                            onChange={(e) => handleAdvancedDaysOffChange(member.name, e.target.value)}
                                            className="w-16 p-1 bg-gray-100 border border-gray-300 rounded-md text-center"
                                            disabled={!memberSelection[member.name]}
                                        />
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center">No team members found in sprint history.</p>}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="md:col-span-2">
                <label htmlFor="confidence" className={labelStyle}>Confidence Interval ({confidenceInterval}%)</label>
                <input id="confidence" type="range" min="5" max="30" step="5" value={confidenceInterval} onChange={(e) => setConfidenceInterval(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-center">
                 <StatCard icon={<TrendingUp size={24} className="text-white"/>} title="Historical Velocity" value={averageVelocity.toFixed(2)} color="bg-green-500" subtitle="Avg. SP per effective day" />
                 <StatCard icon={<Target size={24} className="text-white"/>} title="Forecasted Capacity" value={forecast} color="bg-purple-500" subtitle="Estimated SP for next sprint" />
                 <StatCard icon={<SlidersHorizontal size={24} className="text-white"/>} title="Forecast Range" value={forecastRange} color="bg-blue-500" subtitle={`Confidence Interval (±${confidenceInterval}%)`} />
                 <StatCard icon={<AlertTriangle size={24} className="text-white"/>} title="Risk Indicator" value={risk.text} color={risk.color} valueColor={risk.textColor} subtitle={risk.subtitle} />
            </div>
        </div>
    );
}
