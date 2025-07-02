import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Modal } from '../ui/Modal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function MemberStatCard({ member, jiraDomain }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const cleanDomain = jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Completed Tickets for ${member.name}`} size="4xl">
                <div className="space-y-2">
                    {member.tickets.map(ticket => (
                        <div key={ticket.key} className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-x-3 py-2 border-b border-gray-100">
                            <a href={`https://${cleanDomain}/browse/${ticket.key}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">{ticket.key}</a>
                            <p className="text-gray-700 truncate" title={ticket.summary}>{ticket.summary}</p>
                            <span className="text-xs text-gray-500 ml-auto mr-4">{ticket.sprintName}</span>
                            <span className="text-xs font-bold text-gray-600">({ticket.sp} SP)</span>
                        </div>
                    ))}
                </div>
            </Modal>
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold">{member.name}</h3>
                <div className="mt-4 space-y-2 text-gray-600">
                    <p><strong>Total Story Points:</strong> <span className="font-semibold text-gray-800">{member.totalSP}</span></p>
                    <p><strong>Total Tickets:</strong> <span className="font-semibold text-gray-800">{member.totalTickets}</span></p>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-gray-700">Ticket Types:</h4>
                    <ResponsiveContainer width="100%" height={150}>
                       <PieChart>
                            <Pie data={Object.entries(member.ticketTypes).map(([name, value])=>({name, value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                                {Object.entries(member.ticketTypes).map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#e5e7eb',
                                    borderRadius: '0.75rem',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <button onClick={() => setIsModalOpen(true)} className="mt-4 w-full text-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-semibold">
                    View All Tickets
                </button>
            </div>
        </>
    );
}
