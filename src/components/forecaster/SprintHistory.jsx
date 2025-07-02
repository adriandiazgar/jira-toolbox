import React, { useState } from 'react';
import { SprintHistoryItem } from './SprintHistoryItem';
import { Modal } from '../ui/Modal';
import { Section } from '../ui/Section';

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
            <Modal 
                isOpen={!!sprintToDelete} 
                onClose={() => setSprintToDelete(null)} 
                onConfirm={handleConfirmDelete} 
                title="Delete Sprint Record"
                confirmText="Yes, Delete"
            >
                 Are you sure you want to permanently delete this sprint record?
            </Modal>
            <Modal 
                isOpen={isClearAllModalOpen} 
                onClose={() => setIsClearAllModalOpen(false)} 
                onConfirm={handleConfirmClearAll} 
                title="Clear All Sprint History" 
                confirmText="Yes, Clear Everything"
            >
                 Are you sure you want to permanently delete ALL sprint records? This action cannot be undone.
            </Modal>
            <Section title="Sprint History">
                <div className="flex justify-end mb-4 -mt-12">
                    {sprints.length > 0 && (
                        <button 
                            onClick={() => setIsClearAllModalOpen(true)} 
                            className="text-xs font-semibold text-destructive hover:opacity-80 transition-opacity"
                        >
                            Clear All
                        </button>
                    )}
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {sprints.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No sprint data yet. Add some to get started!</p>
                    ) : (
                        sprints.map(sprint => (
                            <SprintHistoryItem 
                                key={sprint.id} 
                                sprint={sprint} 
                                onDelete={setSprintToDelete} 
                                jiraDomain={jiraDomain} 
                            />
                        ))
                    )}
                </div>
            </Section>
        </>
    );
}
