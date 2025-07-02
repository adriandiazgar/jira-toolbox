import React, { useState, useEffect } from 'react';
import { AddSprintData } from './components/AddSprintData';
import { SprintHistory } from './components/SprintHistory';
import { CapacityForecast } from './components/CapacityForecast';
import { HelpModal } from './components/HelpModal';
import { TeamStats } from './components/TeamStats';
import { CurrentSprintAnalysis } from './components/CurrentSprintAnalysis';
import { HelpCircle, BarChart2, TrendingUp, Github, Activity } from 'lucide-react';

function App() {
    const [sprints, setSprints] = useState(() => {
        try {
            const savedSprints = localStorage.getItem('sprintsData');
            if (savedSprints) {
                return JSON.parse(savedSprints).map(sprint => ({
                    ...sprint,
                    createdAt: new Date(sprint.createdAt),
                }));
            }
            return [];
        } catch (error) {
            console.error("Could not parse sprints from localStorage", error);
            return [];
        }
    });

    const [sprintDetails, setSprintDetails] = useState(() => {
        try {
            const savedDetails = localStorage.getItem('sprintDetails');
            return savedDetails ? JSON.parse(savedDetails) : {};
        } catch (error) { return {}; }
    });

    const [jiraDomain, setJiraDomain] = useState(() => localStorage.getItem('jiraDomain') || '');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('forecaster');

    useEffect(() => {
        localStorage.setItem('sprintsData', JSON.stringify(sprints));
    }, [sprints]);

    useEffect(() => {
        localStorage.setItem('sprintDetails', JSON.stringify(sprintDetails));
    }, [sprintDetails]);

    useEffect(() => {
        localStorage.setItem('jiraDomain', jiraDomain);
    }, [jiraDomain]);


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

    const TabButton = ({ view, label, icon }) => (
        <button 
            onClick={() => setActiveView(view)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === view ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} activeView={activeView} />
            <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
                <main className="p-4 sm:p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">Jira Toolbox & Metrics</h1>
                                    <p className="text-lg text-gray-500 mt-2">Locally-run tool for forecasting and analyzing sprint data.</p>
                                </div>
                                <button 
                                    onClick={() => setIsHelpModalOpen(true)} 
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                >
                                    <HelpCircle size={20} />
                                    <span>How does this work?</span>
                                </button>
                            </div>
                        </header>
                        
                        <div className="mb-6 flex space-x-2 border-b pb-2">
                           <TabButton view="forecaster" label="Forecaster" icon={<TrendingUp size={16}/>} />
                           <TabButton view="stats" label="Team Stats" icon={<BarChart2 size={16}/>} />
                           <TabButton view="current" label="Current Sprint" icon={<Activity size={16}/>} />
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
                            <TeamStats sprints={sprints} />
                        )}

                        {activeView === 'current' && (
                            <CurrentSprintAnalysis jiraDomain={jiraDomain} setJiraDomain={setJiraDomain} />
                        )}
                    </div>
                </main>
                <footer className="text-center py-6 text-sm text-gray-400">
                    <a href="https://github.com/adriandiazgar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 hover:text-gray-700">
                        <Github size={16} />
                        <span>Made with ❤️ by Adrián Díaz in Barcelona</span>
                    </a>
                </footer>
            </div>
        </>
    );
}

export default App;
