import React, { useState } from 'react';
import { Target, Users, Calendar, AlertCircle, CheckCircle, Trash2, MinusCircle } from 'lucide-react';

const IconButton = ({ icon, onClick, className = '' }) => (
    <button onClick={onClick} className={`p-2 rounded-full transition-colors duration-200 ${className}`}>{icon}</button>
);

const Modal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm Delete", size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        md: 'max-w-md',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                     <IconButton icon={<MinusCircle />} onClick={onClose} className="text-gray-400 hover:text-gray-600" />
                </div>
                <div className="overflow-y-auto pr-2">{children}</div>
                {onConfirm && (
                    <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                            {confirmText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

function TicketListModal({ isOpen, onClose, sprint, jiraDomain }) {
    const cleanDomain = jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');

    const TicketRow = ({ issue }) => (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 gap-4">
            <div className="flex items-center min-w-0">
                <span className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0">{issue.typeName || 'Task'}</span>
                <a href={`https://${cleanDomain}/browse/${issue.key}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold ml-2 flex-shrink-0">{issue.key}</a>
                <p className="ml-4 text-gray-700 truncate min-w-0" title={issue.summary}>{issue.summary}</p>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-2">
                <p className="text-xs text-gray-500">{issue.assigneeName || 'Unassigned'}</p>
                {issue.estimateStatistic && <span className="text-xs font-bold">({(issue.estimateStatistic.statFieldValue && issue.estimateStatistic.statFieldValue.value) || 0} SP)</span>}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ticket Details for ${sprint.sprintName}`} size="4xl">
            <div>
                <h3 className="text-lg font-bold text-green-600 mt-4 mb-2">Completed Issues ({sprint.completedIssues?.length || 0})</h3>
                {sprint.completedIssues && sprint.completedIssues.length > 0 ? sprint.completedIssues.map(issue => <TicketRow key={issue.id} issue={issue} />) : <p className="text-gray-500 text-sm">No issues completed.</p>}
                
                <h3 className="text-lg font-bold text-orange-600 mt-6 mb-2">Issues Not Completed ({sprint.issuesNotCompleted?.length || 0})</h3>
                {sprint.issuesNotCompleted && sprint.issuesNotCompleted.length > 0 ? sprint.issuesNotCompleted.map(issue => <TicketRow key={issue.id} issue={issue} />) : <p className="text-gray-500 text-sm">No issues left uncompleted.</p>}
            </div>
        </Modal>
    );
}

function SprintHistoryItem({ sprint, onDelete, jiraDomain }) {
    const [isTicketsModalOpen, setTicketsModalOpen] = useState(false);
    
    const Tooltip = ({ text, children }) => (
        <div className="relative group flex items-center">
            {children}
            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                {text}
            </div>
        </div>
    );
    
    const ticketTypesTooltip = sprint.ticketTypeCounts ? Object.entries(sprint.ticketTypeCounts).map(([type, count]) => `${type}: ${count}`).join(' | ') : 'No type breakdown';

    return (
        <>
            <TicketListModal isOpen={isTicketsModalOpen} onClose={() => setTicketsModalOpen(false)} sprint={sprint} jiraDomain={jiraDomain} />
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <h3 className="font-bold text-gray-700">{sprint.sprintName}</h3>
                        <div className="flex flex-wrap text-sm text-gray-500 mt-2 gap-x-4 gap-y-2">
                            <Tooltip text={sprint.memberNames && sprint.memberNames.length > 0 ? sprint.memberNames.join(', ') : 'No names entered'}>
                               <Users size={14} className="inline mr-1" />{sprint.teamMembers || sprint.memberNames?.length || 0}
                            </Tooltip>
                             <Tooltip text={`Start: ${sprint.startDate || 'N/A'} | End: ${sprint.endDate || 'N/A'}`}>
                                <Calendar size={14} className="inline mr-1" />{sprint.sprintDays} workdays
                            </Tooltip>
                            <Tooltip text={ticketTypesTooltip}>
                                <button onClick={() => setTicketsModalOpen(true)} className="flex items-center hover:text-blue-600">
                                    <Target size={14} className="inline mr-1 text-blue-500" />{sprint.ticketsCompleted} tickets
                                </button>
                            </Tooltip>
                            <span className="flex items-center"><CheckCircle size={14} className="inline mr-1 text-green-500" />{sprint.storyPointsCompleted} SP done</span>
                            {sprint.storyPointsNotCompleted > 0 && 
                                <span className="flex items-center"><AlertCircle size={14} className="inline mr-1 text-orange-500" />{sprint.storyPointsNotCompleted} SP left</span>
                            }
                        </div>
                    </div>
                    <IconButton icon={<Trash2 size={18} />} onClick={() => onDelete(sprint.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-100" />
                </div>
            </div>
        </>
    );
}

export function SprintHistory({ sprints, onSprintDeleted, onClearAllSprints, jiraDomain }) {
    const [sprintToDelete, setSprintToDelete] = useState(null);
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

    const handleConfirmDelete = () => {
        if (!sprintToDelete) return;
        onSprintDeleted(sprintToDelete);
        setSprintToDelete(null);
    };

    const handleConfirmClearAll = () => {
        onClearAllSprints();
        setIsClearAllModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={!!sprintToDelete} onClose={() => setSprintToDelete(null)} onConfirm={handleConfirmDelete} title="Delete Sprint Record">
                 Are you sure you want to permanently delete this sprint record?
            </Modal>
            <Modal isOpen={isClearAllModalOpen} onClose={() => setIsClearAllModalOpen(false)} onConfirm={handleConfirmClearAll} title="Clear All Sprint History" confirmText="Yes, Clear Everything">
                 Are you sure you want to permanently delete ALL sprint records? This action cannot be undone.
            </Modal>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Sprint History</h2>
                    {sprints.length > 0 && (
                        <button onClick={() => setIsClearAllModalOpen(true)} className="text-xs font-semibold text-red-500 hover:text-red-700">Clear All</button>
                    )}
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {sprints.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No sprint data yet. Add some to get started!</p>
                    ) : (
                        sprints.map(sprint => (
                            <SprintHistoryItem key={sprint.id} sprint={sprint} onDelete={setSprintToDelete} jiraDomain={jiraDomain} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
