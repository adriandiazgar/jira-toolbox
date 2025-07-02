import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTeamStats } from '../../hooks/useTeamStats';
import { StatsFilters } from './StatsFilters';
import { MemberStatCard } from './MemberStatCard';
import { Section } from '../ui/Section';

export function TeamStats({ sprints, jiraDomain }) {
    const { memberStats, filters, setFilters, clearFilters } = useTeamStats(sprints);

    if (sprints.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800">Team Statistics</h2>
                <p className="text-gray-500 mt-2">Import some sprint data to see team member statistics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <StatsFilters sprints={sprints} filters={filters} setFilters={setFilters} clearFilters={clearFilters} />
            
            <Section title="Team Performance Overview">
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={memberStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                color: '#1f2937'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="totalSP" fill="#8884d8" name="Story Points" />
                        <Bar dataKey="totalTickets" fill="#82ca9d" name="Tickets" />
                    </BarChart>
                </ResponsiveContainer>
            </Section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberStats.map((member) => (
                    <MemberStatCard key={member.name} member={member} jiraDomain={jiraDomain} />
                ))}
            </div>
        </div>
    );
}
