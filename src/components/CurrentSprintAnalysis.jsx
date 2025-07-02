import React, { useState, useMemo, useEffect } from 'react';
import { Zap, HelpCircle, AlertTriangle, ListTodo, Loader2, PieChart as PieIcon, User, Trophy, Clock, GitCommit, UserX, Bug, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, ReferenceLine, ReferenceArea } from 'recharts';
import { calculateWeekdays } from '../utils/dateUtils';

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#dd84d8'];

const StatCard = ({ title, value, children }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
        <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
        {children}
    </div>
);

const BurndownChart = ({ data, todayIndex }) => {
    if (!data || data.length === 0) return <p className="text-center text-gray-500">Not enough data for burndown chart.</p>;
    
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorAhead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dcfce7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#dcfce7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBehind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fee2e2" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fee2e2" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} domain={[0, 'dataMax + 5']} />
                <Tooltip />
                <Legend />
                {data.map((entry, index) => {
                    if (index === 0) return null;
                    const prevEntry = data[index - 1];
                    const isAhead = prevEntry.remaining <= prevEntry.ideal;
                    return (
                        <ReferenceArea
                            key={`area-${index}`}
                            x1={prevEntry.day}
                            x2={entry.day}
                            y1={0}
                            y2="dataMax + 10"
                            fill={isAhead ? 'url(#colorAhead)' : 'url(#colorBehind)'}
                            stroke="none"
                        />
                    );
                })}
                <Line type="monotone" dataKey="ideal" stroke="#8884d8" strokeDasharray="5 5" name="Ideal Burndown" dot={false} />
                <Line type="monotone" dataKey="remaining" stroke="#16a34a" strokeWidth={2} name="Actual Burndown" />
                {typeof todayIndex === 'number' && todayIndex >= 0 && (
                    <ReferenceLine x={`Day ${todayIndex}`} stroke="red" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTop' }} />
                )}
            </LineChart>
        </ResponsiveContainer>
    );
};

// Helper to get story points, using the user-provided field ID
const getStoryPoints = (issue, spFieldId) => {
    return issue.fields[spFieldId] || 0;
};

// Helper to calculate business days from a start date to now
const calculateBusinessDaysSince = (startDate) => {
    let start = new Date(startDate);
    let now = new Date();
    let count = 0;
    const curDate = new Date(start.getTime());
    while (curDate <= now) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

export function CurrentSprintAnalysis({ jiraDomain, setJiraDomain }) {
    const [boardId, setBoardId] = useState(() => localStorage.getItem('jiraBoardId') || '');
    const [spFieldId, setSpFieldId] = useState(() => localStorage.getItem('jiraSpFieldId') || 'customfield_10039');
    const [activeSprints, setActiveSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState('');
    const [sprintData, setSprintData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const cleanDomain = useMemo(() => jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, ''), [jiraDomain]);

    const handleFetchActiveSprints = async () => {
        if (!jiraDomain || !boardId) {
            setError('Please provide your Jira Domain and Board ID.');
            return;
        }
        setError('');
        setIsLoading(true);
        localStorage.setItem('jiraBoardId', boardId);
        localStorage.setItem('jiraSpFieldId', spFieldId);
        const url = `https://${cleanDomain}/rest/agile/1.0/board/${boardId}/sprint?state=active`;

        try {
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setActiveSprints(data.values || []);
            if (data.values && data.values.length > 0) {
                setSelectedSprintId(data.values[0].id);
            } else {
                setError("No active sprints found for this board.");
            }
        } catch (err) {
            console.error("Fetch active sprints failed:", err);
            setError("Failed to fetch active sprints. Check your CORS extension and Jira details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchSprintDetails = async () => {
            if (!selectedSprintId || !cleanDomain) return;
            
            setIsLoading(true);
            setError('');
            const url = `https://${cleanDomain}/rest/agile/1.0/sprint/${selectedSprintId}/issue?expand=changelog`;

            try {
                const response = await fetch(url, { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                
                const sprintInfo = activeSprints.find(s => s.id === Number(selectedSprintId));
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
                if (sprintInfo && sprintInfo.startDate) {
                    const sprintStartDate = new Date(sprintInfo.startDate);
                    data.issues.forEach(issue => {
                        issue.changelog?.histories.forEach(history => {
                            history.items.forEach(item => {
                                if (item.field === 'Sprint' && item.toString === sprintInfo.name) {
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
                if (sprintInfo && sprintInfo.startDate && sprintInfo.endDate) {
                    const startDate = new Date(sprintInfo.startDate);
                    const endDate = new Date(sprintInfo.endDate);
                    const sprintDurationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                    const workingDays = calculateWeekdays(sprintInfo.startDate, sprintInfo.endDate);
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
                    info: sprintInfo,
                    issues: data.issues,
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
                console.error("Fetch sprint details failed:", err);
                setError("Failed to fetch details for the selected sprint.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSprintDetails();
    }, [selectedSprintId, cleanDomain, activeSprints, spFieldId]);

    const Tooltip = ({ text, children }) => (
        <div className="relative group flex items-center">{children}<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">{text}</div></div>
    );

    const HealthCard = ({ title, issues, icon, color, message, detailKey, spFieldId }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><span className={`mr-3 ${color}`}>{icon}</span> {title}</h3>
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
    );
    
    const HighlightCard = ({ member, topSp, topTickets, topBugs }) => {
        const isTopSp = topSp && member.name === topSp.name;
        const isTopTickets = topTickets && member.name === topTickets.name;
        const isTopBugs = topBugs && member.name === topBugs.name;

        return (
            <div className="p-4 rounded-2xl shadow-md bg-white border flex flex-col">
                <div className="flex items-center mb-3">
                    <User size={20} className="text-gray-500 mr-3"/>
                    <h4 className="font-bold text-lg text-gray-800">{member.name}</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600 flex-grow">
                    <p><strong>Story Points Completed:</strong> {member.sp}</p>
                    <p><strong>Tickets Completed:</strong> {member.tickets}</p>
                    <p><strong>Bugs Squashed:</strong> {member.bugs}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {isTopSp && <div className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center"><Trophy size={14} className="mr-1"/> Point Master</div>}
                    {isTopTickets && <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center"><Award size={14} className="mr-1"/> Ticket Titan</div>}
                    {isTopBugs && member.bugs > 0 && <div className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center"><Bug size={14} className="mr-1"/> Bug Squasher</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Fetch Active Sprint</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div><label htmlFor="jiraDomain" className={labelStyle}>Jira Domain</label><input id="jiraDomain" type="text" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} className={inputStyle} placeholder="your-company.atlassian.net" /></div>
                    <div>
                        <div className="flex items-center space-x-2"><label htmlFor="boardId" className={labelStyle}>Board ID</label><Tooltip text="Find this in your Jira board's URL. e.g., .../boards/123"><HelpCircle size={14} className="text-gray-400" /></Tooltip></div>
                        <input id="boardId" type="text" value={boardId} onChange={(e) => setBoardId(e.target.value)} className={inputStyle} placeholder="123" />
                    </div>
                     <div>
                        <div className="flex items-center space-x-2"><label htmlFor="spFieldId" className={labelStyle}>Story Point Field ID</label><Tooltip text="Inspect a Jira issue's JSON to find this. Common ID: customfield_10016"><HelpCircle size={14} className="text-gray-400" /></Tooltip></div>
                        <input id="spFieldId" type="text" value={spFieldId} onChange={(e) => setSpFieldId(e.target.value)} className={inputStyle} placeholder="customfield_10039" />
                    </div>
                    <button onClick={handleFetchActiveSprints} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                        <Zap size={16} className="mr-2" />
                        {isLoading && !sprintData ? 'Fetching...' : 'Fetch Active Sprints'}
                    </button>
                </div>
                {error && <div className="mt-4 text-red-500 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}
            </div>

            {activeSprints.length > 0 && (
                 <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <label htmlFor="sprintSelect" className={labelStyle}>Select an Active Sprint</label>
                    <select id="sprintSelect" value={selectedSprintId} onChange={e => setSelectedSprintId(e.target.value)} className={inputStyle}>
                        {activeSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
            )}

            {isLoading && sprintData && <div className="text-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>}

            {sprintData && !isLoading && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Committed SP" value={sprintData.totalSP} />
                        <StatCard title="Tickets In Progress" value={sprintData.ticketsByStatus['In Progress'] || 0} />
                        <StatCard title="Tickets Done" value={sprintData.ticketsByStatus['Done'] || 0} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sprint Burndown</h2>
                            <BurndownChart data={sprintData.burndownData} todayIndex={sprintData.todayIndex} />
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ticket Type Distribution</h2>
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
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Sprint Health & Red Flags</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <HealthCard title={`Scope Creep (${sprintData.totalScopeCreepSP} SP)`} issues={sprintData.scopeCreepIssues} icon={<GitCommit/>} color="text-purple-500" message="No scope creep detected." spFieldId={spFieldId} />
                            <HealthCard title="Unassigned 'In Progress' Tickets" issues={sprintData.unassignedIssues} icon={<UserX/>} color="text-red-500" message="All 'In Progress' tickets are assigned." spFieldId={spFieldId} />
                            <HealthCard title="Flagged Issues" issues={sprintData.flaggedIssues} icon={<AlertTriangle/>} color="text-red-500" message="No issues are flagged." spFieldId={spFieldId} />
                            <HealthCard title="Stale 'In Progress' Tickets" issues={sprintData.staleIssues} icon={<Clock/>} color="text-yellow-600" message="No stale tickets found." detailKey="daysInStatus" spFieldId={spFieldId} />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Member Highlights</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sprintData.memberHighlights.length > 0 ? sprintData.memberHighlights.map(member => (
                                <HighlightCard 
                                    key={member.name}
                                    member={member}
                                    topSp={sprintData.topSpPerformer}
                                    topTickets={sprintData.topTicketPerformer}
                                    topBugs={sprintData.topBugSquasher}
                                />
                            )) : <p className="col-span-full text-center text-gray-500">No completed tickets with assigned members yet.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
