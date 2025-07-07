import React, { useState, useEffect } from 'react';
import { AddSprintData } from './components/forecaster/AddSprintData';
import { SprintHistory } from './components/forecaster/SprintHistory';
import { CapacityForecast } from './components/forecaster/CapacityForecast';
import { HelpModal } from './components/ui/HelpModal';
import { TeamStats } from './components/team_stats/TeamStats';
import { CurrentSprintAnalysis } from './components/current_sprint/CurrentSprintAnalysis';
import { EpicsAnalysis } from './components/epics/EpicsAnalysis'; // New Component
import { useLocalStorage } from './hooks/useLocalStorage';
import { HelpCircle, BarChart2, TrendingUp, Github, Activity, FolderGit2 } from 'lucide-react';
import { TabButton } from './components/ui/TabButton';
import { ThemeToggle } from './components/ui/ThemeToggle';

function App() {
    const [sprints, setSprints] = useLocalStorage('sprintsData', []);
    const [sprintDetails, setSprintDetails] = useLocalStorage('sprintDetails', {});
    const [jiraDomain, setJiraDomain] = useLocalStorage('jiraDomain', '');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('forecaster');

    useEffect(() => {
        const sprintsWithDates = sprints.map(sprint => ({
            ...sprint,
            createdAt: new Date(sprint.createdAt),
        }));
        if (JSON.stringify(sprints) !== JSON.stringify(sprintsWithDates)) {
            setSprints(sprintsWithDates);
        }
    }, []);

    const addSprints = (newSprints) => {
        const sprintsWithDate = newSprints.map(s => ({ ...s, createdAt: new Date() }));
        const sprintMap = new Map(sprints.map(s => [s.id, s]));
        sprintsWithDate.forEach(s => sprintMap.set(s.id, s));
        const updatedSprints = Array.from(sprintMap.values());
        updatedSprints.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(a.createdAt);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(b.createdAt);
            return dateB - dateA;
        });
        setSprints(updatedSprints);
    };

    const deleteSprint = (sprintId) => {
        setSprints(currentSprints => currentSprints.filter(s => s.id !== sprintId));
        setSprintDetails(currentDetails => {
            const newDetails = { ...currentDetails };
            delete newDetails[sprintId];
            return newDetails;
        });
    };

    const clearAllSprints = () => {
        setSprints([]);
        setSprintDetails({});
    };

    const handleDetailAdded = (sprintId, details) => {
        setSprintDetails(prev => ({ ...prev, [sprintId]: details }));
    };

    return (
        <>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} activeView={activeView} />
            <div className="min-h-screen bg-background font-sans text-foreground">
                <main className="p-4 sm:p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-8 pb-8 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Jira Toolbox & Metrics</h1>
                                    <p className="text-lg text-muted-foreground mt-2">Locally-run tool for forecasting and analyzing sprint data.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                   {/* <ThemeToggle /> */}
                                    <button 
                                        onClick={() => setIsHelpModalOpen(true)} 
                                        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-muted transition-colors text-sm font-medium"
                                    >
                                        <HelpCircle size={16} />
                                        <span>How it works</span>
                                    </button>
                                </div>
                            </div>
                        </header>
                        
                        <div className="mb-8 p-1.5 inline-flex items-center space-x-1 bg-muted rounded-lg">
                           <TabButton view="forecaster" label="Forecaster" icon={<TrendingUp size={16}/>} activeView={activeView} setActiveView={setActiveView} />
                           <TabButton view="stats" label="Team Stats" icon={<BarChart2 size={16}/>} activeView={activeView} setActiveView={setActiveView} />
                           <TabButton view="current" label="Current Sprint" icon={<Activity size={16}/>} activeView={activeView} setActiveView={setActiveView} />
                           <TabButton view="epics" label="Epics" icon={<FolderGit2 size={16}/>} activeView={activeView} setActiveView={setActiveView} />
                        </div>

                        {activeView === 'forecaster' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-8">
                                    <AddSprintData 
                                        onSprintsAdded={addSprints} 
                                        sprintDetails={sprintDetails}
                                        onDetailAdded={handleDetailAdded}
                                        importedSprintIds={sprints.map(s => s.id)}
                                        jiraDomain={jiraDomain}
                                        setJiraDomain={setJiraDomain}
                                    />
                                    <SprintHistory sprints={sprints} onSprintDeleted={deleteSprint} onClearAllSprints={clearAllSprints} jiraDomain={jiraDomain} />
                                </div>
                                <div className="sticky top-8">
                                    <CapacityForecast sprints={sprints} />
                                </div>
                            </div>
                        )}
                        
                        {activeView === 'stats' && (
                            <TeamStats sprints={sprints} jiraDomain={jiraDomain} />
                        )}

                        {activeView === 'current' && (
                            <CurrentSprintAnalysis jiraDomain={jiraDomain} setJiraDomain={setJiraDomain} />
                        )}

                        {activeView === 'epics' && (
                            <EpicsAnalysis sprints={sprints} jiraDomain={jiraDomain} />
                        )}
                    </div>
                </main>
                <footer className="text-center py-6 text-sm text-muted-foreground border-t">
                    <a href="https://github.com/adriandiazgar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 hover:text-foreground">
                        <Github size={16} />
                        <span>Made with ❤️ by Adrián Díaz in Barcelona</span>
                    </a>
                </footer>
            </div>
        </>
    );
}

export default App;
