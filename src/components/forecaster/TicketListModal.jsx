import React from 'react';
import { Modal } from '../ui/Modal';

const getStoryPoints = (issue) => {
    // This is a simplified version. In a real app, you might pass spFieldId as a prop.
    return issue.fields?.customfield_10039 || 0;
};

export function TicketListModal({ isOpen, onClose, sprint, jiraDomain }) {
    const cleanDomain = jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');

    const TicketRow = ({ issue }) => (
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-x-3 py-2 border-b border-muted/50">
            <a href={`https://${cleanDomain}/browse/${issue.key}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold">{issue.key}</a>
            <p className="text-muted-foreground truncate" title={issue.summary}>{issue.summary}</p>
            <div className="flex items-center space-x-2 ml-auto">
                <span className="text-xs text-muted-foreground">{issue.assigneeName || 'Unassigned'}</span>
                <span className="text-xs font-bold">({getStoryPoints(issue)} SP)</span>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ticket Details for ${sprint.sprintName}`} size="4xl">
            <div>
                <h3 className="text-lg font-bold text-green-600 mt-4 mb-2">Completed Issues ({sprint.completedIssues?.length || 0})</h3>
                {sprint.completedIssues && sprint.completedIssues.length > 0 ? sprint.completedIssues.map(issue => <TicketRow key={issue.id} issue={issue} />) : <p className="text-muted-foreground text-sm">No issues completed.</p>}
                
                <h3 className="text-lg font-bold text-orange-500 mt-6 mb-2">Issues Not Completed ({sprint.issuesNotCompleted?.length || 0})</h3>
                {sprint.issuesNotCompleted && sprint.issuesNotCompleted.length > 0 ? sprint.issuesNotCompleted.map(issue => <TicketRow key={issue.id} issue={issue} />) : <p className="text-muted-foreground text-sm">No issues left uncompleted.</p>}
            </div>
        </Modal>
    );
}
