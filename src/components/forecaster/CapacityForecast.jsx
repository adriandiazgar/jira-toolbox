import React from 'react';
import { Target, TrendingUp, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useForecast } from '../../hooks/useForecast';
import { Section } from '../ui/Section';

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

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

export function CapacityForecast({ sprints }) {
    const {
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
    } = useForecast(sprints);

    return (
        <Section title="Forecast Future Capacity">
            <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div><label className={labelStyle}>Start Date</label><input type="date" value={futureStartDate} onChange={(e) => setFutureStartDate(e.target.value)} className={inputStyle} /></div>
                    <div><label className={labelStyle}>End Date</label><input type="date" value={futureEndDate} onChange={(e) => setFutureEndDate(e.target.value)} className={inputStyle} /></div>
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
                            <p className="text-xs text-gray-500 italic">In Simple Mode, the forecast uses the team's overall average velocity.</p>
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
                                            <input type="number" min="0" placeholder="Off" value={advancedDaysOff[member.name] || 0} onChange={(e) => handleAdvancedDaysOffChange(member.name, e.target.value)} className="w-16 p-1 bg-gray-100 border border-gray-300 rounded-md text-center" disabled={!memberSelection[member.name]}/>
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
                    <StatCard icon={<TrendingUp size={24} className="text-white"/>} title="Historical Velocity" value={forecastData.averageVelocity.toFixed(2)} color="bg-green-500" subtitle="Avg. SP per effective day" />
                    <StatCard icon={<Target size={24} className="text-white"/>} title="Forecasted Capacity" value={forecastData.forecast} color="bg-purple-500" subtitle="Estimated SP for next sprint" />
                    <StatCard icon={<SlidersHorizontal size={24} className="text-white"/>} title="Forecast Range" value={forecastData.forecastRange} color="bg-blue-500" subtitle={`Confidence Interval (±${confidenceInterval}%)`} />
                    <StatCard icon={<AlertTriangle size={24} className="text-white"/>} title="Risk Indicator" value={forecastData.risk.text} color={forecastData.risk.color} valueColor={forecastData.risk.textColor} subtitle={forecastData.risk.subtitle} />
                </div>
            </div>
        </Section>
    );
}
