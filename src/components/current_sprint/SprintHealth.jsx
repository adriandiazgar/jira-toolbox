import React from 'react';
import { GitCommit, UserX, AlertTriangle, Clock } from 'lucide-react';
import { Section } from '../ui/Section';

const getStoryPoints = (issue, spFieldId) => {
    // This helper function can be moved to a utility file if used elsewhere
    return issue.fields[spFieldId] || 0;
};

const HealthCard = ({ title, issues, icon, color, message, detailKey, spFieldId, cleanDomain }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><span className={`mr-3 ${color}`}>{icon}</span> {title}</h3>
        <div className="flex-grow">
            {issues.length > 0 ? (
                <div className="space-y-2">
                    {issues.map(issue => (
                        <div key={issue.key} className={`grid grid-cols-[auto,1fr,auto] items-center gap-x-3 p-2 border rounded-lg ${issue.colorClass || 'bg-gray-50 border-gray-200'}`}>
                            <a href={`https://${cleanDomain}/browse/${issue.key}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">{issue.key}</a>
                            <p className="text-gray-700 truncate" title={issue.fields.summary}>{issue.fields.summary}</p>
                            <div className="flex items-center space-x-2 ml-auto">
                                {detailKey && <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{issue[detailKey]}</span>}
                                <span className="text-xs font-bold text-gray-500">({getStoryPoints(issue, spFieldId)} SP)</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500">{message}</p>}
        </div>
    </div>
);

export function SprintHealth({ data, spFieldId, cleanDomain }) {
    return (
        <Section title="Sprint Health & Red Flags">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthCard 
                    title={`Scope Creep (${data.totalScopeCreepSP} SP)`} 
                    issues={data.scopeCreepIssues} 
                    icon={<GitCommit/>} 
                    color="text-purple-500" 
                    message="No scope creep detected." 
                    spFieldId={spFieldId} 
                    cleanDomain={cleanDomain} 
                />
                <HealthCard 
                    title="Unassigned 'In Progress' Tickets" 
                    issues={data.unassignedIssues} 
                    icon={<UserX/>} 
                    color="text-red-500" 
                    message="All 'In Progress' tickets are assigned." 
                    spFieldId={spFieldId} 
                    cleanDomain={cleanDomain} 
                />
                <HealthCard 
                    title="Flagged Issues" 
                    issues={data.flaggedIssues} 
                    icon={<AlertTriangle/>} 
                    color="text-red-500" 
                    message="No issues are flagged." 
                    spFieldId={spFieldId} 
                    cleanDomain={cleanDomain} 
                />
                <HealthCard 
                    title="Stale 'In Progress' Tickets" 
                    issues={data.staleIssues} 
                    icon={<Clock/>} 
                    color="text-yellow-600" 
                    message="No stale tickets found." 
                    detailKey="daysInStatus" 
                    spFieldId={spFieldId} 
                    cleanDomain={cleanDomain} 
                />
            </div>
        </Section>
    );
}
