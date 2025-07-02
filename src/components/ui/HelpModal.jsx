import React from 'react';
import { MinusCircle } from 'lucide-react';
import { IconButton } from './IconButton';
import { Modal } from './Modal';

const Formula = ({ children }) => (
    <div className="bg-gray-100 p-3 rounded-lg text-center font-mono text-sm text-gray-700 my-2">
        {children}
    </div>
);

const ForecasterHelp = () => (
    <>
        <div>
            <h3 className="font-bold text-lg text-gray-800">What is Historical Velocity?</h3>
            <p>Historical Velocity is a measurement of the average amount of work a team can complete during an "effective day" of work, based on past sprints. It's calculated in Story Points per day.</p>
            <h4 className="font-semibold mt-2">How is it Calculated?</h4>
            <p>First, we determine the number of working days (Monday to Friday) in each sprint. Then, we calculate the "Total Effective Days" your team has worked by removing any time the team was unavailable.</p>
            <Formula>(Team Members × Working Days) − Days Off</Formula>
            <p>Finally, we divide the total story points completed across all sprints by the total effective days worked.</p>
            <Formula>Total Story Points Completed / Total Effective Days</Formula>
        </div>
        <div>
            <h3 className="font-bold text-lg text-gray-800">What is Forecasted Capacity?</h3>
            <p>Forecasted Capacity is a projection of how many Story Points your team can likely complete in a future sprint. It uses your team's proven Historical Velocity to make a data-driven estimate.</p>
        </div>
        <div>
            <h3 className="font-bold text-lg text-gray-800">Advanced Planning Mode</h3>
            <p>This mode provides a more granular way to plan by focusing on individual team members, their average velocity, and their specific days off.</p>
        </div>
    </>
);

const TeamStatsHelp = () => (
    <>
        <div>
            <h3 className="font-bold text-lg text-gray-800">Team Statistics View</h3>
            <p>This page provides insights into your team's performance based on the historical sprint data you have imported.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Performance Overview:</strong> A bar chart comparing the total Story Points and Tickets completed by each team member.</li>
                <li><strong>Member Cards:</strong> A detailed breakdown for each member, including a pie chart showing the types of tickets they've completed.</li>
                <li><strong>Filters:</strong> You can filter the entire view by a specific sprint or a date range to analyze performance over different periods.</li>
            </ul>
        </div>
    </>
);

const CurrentSprintHelp = () => (
    <>
        <div>
            <h3 className="font-bold text-lg text-gray-800">Current Sprint Analysis</h3>
            <p>This tab gives you a real-time dashboard for monitoring an active sprint. It helps you identify progress and spot potential issues.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Burndown Chart:</strong> Visualizes the team's progress against the ideal trajectory.</li>
                <li><strong>Sprint Health & Red Flags:</strong> Automatically highlights potential problems like unassigned tickets, scope creep, or stale tickets.</li>
                <li><strong>Member Highlights:</strong> Celebrates individual contributions with fun awards.</li>
            </ul>
        </div>
    </>
);

export function HelpModal({ isOpen, onClose, activeView }) {
    const renderHelpContent = () => {
        switch (activeView) {
            case 'forecaster':
                return <ForecasterHelp />;
            case 'stats':
                return <TeamStatsHelp />;
            case 'current':
                return <CurrentSprintHelp />;
            default:
                return <p>Select a tab to see help information.</p>;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="How This Tool Works" size="2xl">
            <div className="space-y-6 text-gray-600">
                {renderHelpContent()}
            </div>
        </Modal>
    );
}
