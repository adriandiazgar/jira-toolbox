import React, { useState, useMemo } from 'react';
import { useCurrentSprint } from '../../hooks/useCurrentSprint';
import { fetchActiveSprints } from '../../services/jiraApi';
import { StatCard } from '../ui/StatCard';
import { BurndownChart } from '../ui/BurndownChart';
import { FetchSprintForm } from './FetchSprintForm';
import { SprintHealth } from './SprintHealth';
import { MemberHighlights } from './MemberHighlights';
import { Loader2, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Section } from '../ui/Section';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#dd84d8'];
const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

export function CurrentSprintAnalysis({ jiraDomain, setJiraDomain }) {
    const [boardId, setBoardId] = useState(() => localStorage.getItem('jiraBoardId') || '');
    const [spFieldId, setSpFieldId] = useState(() => localStorage.getItem('jiraSpFieldId') || 'customfield_10039');
    const [activeSprints, setActiveSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState('');
    const [isFetchingList, setIsFetchingList] = useState(false);
    const [listError, setListError] = useState('');

    const cleanDomain = useMemo(() => jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, ''), [jiraDomain]);

    const selectedSprint = useMemo(() => 
        activeSprints.find(s => s.id === Number(selectedSprintId)), 
    [activeSprints, selectedSprintId]);

    const { sprintData, isLoading: isLoadingDetails, error: detailsError } = useCurrentSprint(selectedSprint, cleanDomain, spFieldId);

    const handleFetchActiveSprints = async () => {
        if (!jiraDomain || !boardId) {
            setListError('Please provide your Jira Domain and Board ID.');
            return;
        }
        setListError('');
        setIsFetchingList(true);
        localStorage.setItem('jiraBoardId', boardId);
        localStorage.setItem('jiraSpFieldId', spFieldId);

        try {
            const data = await fetchActiveSprints(cleanDomain, boardId);
            setActiveSprints(data.values || []);
            if (data.values && data.values.length > 0) {
                setSelectedSprintId(data.values[0].id);
            } else {
                setListError("No active sprints found for this board.");
            }
        } catch (err) {
            console.error("Fetch active sprints failed:", err);
            setListError("Failed to fetch active sprints. Check your CORS extension and Jira details.");
        } finally {
            setIsFetchingList(false);
        }
    };

    return (
        <div className="space-y-8">
            <FetchSprintForm 
                jiraDomain={jiraDomain}
                setJiraDomain={setJiraDomain}
                boardId={boardId}
                setBoardId={setBoardId}
                spFieldId={spFieldId}
                setSpFieldId={setSpFieldId}
                onFetch={handleFetchActiveSprints}
                isLoading={isFetchingList}
                error={listError}
            />

            {activeSprints.length > 0 && (
                 <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <label htmlFor="sprintSelect" className={labelStyle}>Select an Active Sprint</label>
                    <select id="sprintSelect" value={selectedSprintId} onChange={e => setSelectedSprintId(e.target.value)} className={inputStyle}>
                        {activeSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
            )}

            {(isLoadingDetails || detailsError) && (
                <div className="text-center p-8">
                    {isLoadingDetails && <Loader2 className="animate-spin text-indigo-600" size={32}/>}
                    {detailsError && <p className="text-red-500">{detailsError}</p>}
                </div>
            )}

            {sprintData && !isLoadingDetails && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Committed SP" value={sprintData.totalSP} />
                        <StatCard title="Tickets In Progress" value={sprintData.ticketsByStatus['In Progress'] || 0} />
                        <StatCard title="Tickets Done" value={sprintData.ticketsByStatus['Done'] || 0} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title="Sprint Burndown">
                            <BurndownChart data={sprintData.burndownData} todayIndex={sprintData.todayIndex} />
                        </Section>
                        <Section title="Ticket Type Distribution">
                             <ResponsiveContainer width="100%" height={300}>
                               <PieChart>
                                    <Pie data={Object.entries(sprintData.ticketTypes).map(([name, value])=>({name, value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                        {Object.entries(sprintData.ticketTypes).map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                </PieChart>
                            </ResponsiveContainer>
                        </Section>
                    </div>
                    <SprintHealth data={sprintData} spFieldId={spFieldId} cleanDomain={cleanDomain} />
                    <MemberHighlights data={sprintData} />
                </div>
            )}
        </div>
    );
}
