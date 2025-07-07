import React from 'react';
import { Modal } from '../ui/Modal';

export function EpicTicketListModal({ isOpen, onClose, epic, jiraDomain }) {
    const cleanDomain = jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');

    const getStoryPoints = (issue) => {
        // This is a simplified version. In a real app, you might pass spFieldId as a prop.
        return issue.sp || 0;
    };

    const TicketRow = ({ ticket }) => (
        <div className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-x-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <a 
                href={`https://${cleanDomain}/browse/${ticket.key}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline font-semibold"
            >
                {ticket.key}
            </a>
            <p className="text-gray-700 truncate" title={ticket.summary}>{ticket.summary}</p>
            <span className="text-xs text-gray-500 ml-auto mr-4">{ticket.assignee}</span>
            <span className="text-xs font-bold text-gray-600">({getStoryPoints(ticket)} SP)</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tickets for Epic: ${epic.name}`} size="4xl">
            <div className="space-y-2">
                {epic.tickets.map(ticket => <TicketRow key={ticket.key} ticket={ticket} />)}
            </div>
        </Modal>
    );
}
