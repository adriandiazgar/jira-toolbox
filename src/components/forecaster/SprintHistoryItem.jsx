import React, { useState } from 'react';
import { Target, Users, Calendar, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { TicketListModal } from './TicketListModal';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';

export function SprintHistoryItem({ sprint, onDelete, jiraDomain }) {
    const [isTicketsModalOpen, setTicketsModalOpen] = useState(false);
    
    const ticketTypesTooltip = sprint.ticketTypeCounts ? Object.entries(sprint.ticketTypeCounts).map(([type, count]) => `${type}: ${count}`).join(' | ') : 'No type breakdown';

    return (
        <>
            <TicketListModal isOpen={isTicketsModalOpen} onClose={() => setTicketsModalOpen(false)} sprint={sprint} jiraDomain={jiraDomain} />
            <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <h3 className="font-bold text-card-foreground">{sprint.sprintName}</h3>
                        <div className="flex flex-wrap text-sm text-muted-foreground mt-2 gap-x-4 gap-y-2">
                            <Tooltip text={sprint.memberNames && sprint.memberNames.length > 0 ? sprint.memberNames.join(', ') : 'No names entered'}>
                               <Users size={14} className="inline mr-1" />{sprint.teamMembers || sprint.memberNames?.length || 0}
                            </Tooltip>
                             <Tooltip text={`Start: ${sprint.startDate || 'N/A'} | End: ${sprint.endDate || 'N/A'}`}>
                                <Calendar size={14} className="inline mr-1" />{sprint.sprintDays} workdays
                            </Tooltip>
                            <Tooltip text={ticketTypesTooltip}>
                                <button onClick={() => setTicketsModalOpen(true)} className="flex items-center hover:text-primary">
                                    <Target size={14} className="inline mr-1 text-blue-500" />{sprint.ticketsCompleted} tickets
                                </button>
                            </Tooltip>
                            <span className="flex items-center"><CheckCircle size={14} className="inline mr-1 text-green-500" />{sprint.storyPointsCompleted} SP done</span>
                            {sprint.storyPointsNotCompleted > 0 && 
                                <span className="flex items-center"><AlertCircle size={14} className="inline mr-1 text-orange-500" />{sprint.storyPointsNotCompleted} SP left</span>
                            }
                        </div>
                    </div>
                    <IconButton icon={<Trash2 size={18} />} onClick={() => onDelete(sprint.id)} className="text-muted-foreground hover:text-destructive" />
                </div>
            </div>
        </>
    );
}
