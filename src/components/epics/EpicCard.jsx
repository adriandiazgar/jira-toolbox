import React, { useState } from 'react';
import { FolderGit2, List } from 'lucide-react';
import { EpicTicketListModal } from './EpicTicketListModal';

export function EpicCard({ epic, jiraDomain }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <EpicTicketListModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                epic={epic} 
                jiraDomain={jiraDomain} 
            />
            <div className="bg-card p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 min-w-0">
                        <FolderGit2 className="text-primary flex-shrink-0" size={24} />
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg truncate" title={epic.name}>{epic.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{epic.summary}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 text-right flex-shrink-0">
                        <div>
                            <p className="font-bold text-xl">{epic.totalSP}</p>
                            <p className="text-xs text-muted-foreground">Story Points</p>
                        </div>
                        <div>
                            <p className="font-bold text-xl">{epic.totalTickets}</p>
                            <p className="text-xs text-muted-foreground">Tickets</p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="flex items-center space-x-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-muted transition-colors text-sm font-medium"
                        >
                            <List size={16} />
                            <span>View Tickets</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
