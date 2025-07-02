import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MinusCircle, Filter, XCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                     <button onClick={onClose} className="p-2 rounded-full transition-colors duration-200 text-gray-400 hover:text-gray-600"><MinusCircle/></button>
                </div>
                <div className="overflow-y-auto pr-2">{children}</div>
            </div>
        </div>
    );
};

export function TeamStats({ sprints }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
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
    
    const handleViewTickets = (member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const clearFilters = () => {
        setStartDateFilter('');
        setEndDateFilter('');
        setSprintFilter('all');
    };

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
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Completed Tickets for ${selectedMember?.name}`}>
                <div className="space-y-2">
                    {selectedMember?.tickets.map(ticket => (
                        <div key={ticket.key} className="flex justify-between items-center p-2 border-b">
                            <div>
                                <p className="font-semibold">{ticket.key}: {ticket.summary}</p>
                                <p className="text-xs text-gray-500">{ticket.sprintName}</p>
                            </div>
                            <span className="font-bold text-sm">{ticket.sp} SP</span>
                        </div>
                    ))}
                </div>
            </Modal>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Sprint</label>
                        <select value={sprintFilter} onChange={e => setSprintFilter(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg">
                            <option value="all">All Sprints</option>
                            {sprints.map(s => <option key={s.id} value={s.id}>{s.sprintName}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">Date Range</label>
                        <div className="flex items-center space-x-2">
                            <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg"/>
                            <span>-</span>
                            <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg"/>
                        </div>
                    </div>
                    <button onClick={clearFilters} className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                        <XCircle size={16} />
                        <span>Clear Filters</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Performance Overview</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={memberStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalSP" fill="#8884d8" name="Story Points" />
                        <Bar dataKey="totalTickets" fill="#82ca9d" name="Tickets" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberStats.map((member, index) => (
                    <div key={member.name} className="bg-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                        <div className="mt-4 space-y-2 text-gray-600">
                            <p><strong>Total Story Points:</strong> {member.totalSP}</p>
                            <p><strong>Total Tickets:</strong> {member.totalTickets}</p>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Ticket Types:</h4>
                            <ResponsiveContainer width="100%" height={150}>
                               <PieChart>
                                    <Pie data={Object.entries(member.ticketTypes).map(([name, value])=>({name, value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                                        {Object.entries(member.ticketTypes).map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                         <button onClick={() => handleViewTickets(member)} className="mt-4 w-full text-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                            View All Tickets
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
