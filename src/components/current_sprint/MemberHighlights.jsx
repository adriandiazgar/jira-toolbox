import React from 'react';
import { User, Trophy, Award, Bug } from 'lucide-react';
import { Section } from '../ui/Section';

const HighlightCard = ({ member, topSp, topTickets, topBugs }) => {
    const isTopSp = topSp && member.name === topSp.name;
    const isTopTickets = topTickets && member.name === topTickets.name;
    const isTopBugs = topBugs && member.name === topBugs.name;

    return (
        <div className="p-4 rounded-2xl shadow-md bg-white border flex flex-col">
            <div className="flex items-center mb-3">
                <User size={20} className="text-gray-500 mr-3"/>
                <h4 className="font-bold text-lg text-gray-800">{member.name}</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-600 flex-grow">
                <p><strong>Story Points Completed:</strong> {member.sp}</p>
                <p><strong>Tickets Completed:</strong> {member.tickets}</p>
                <p><strong>Bugs Squashed:</strong> {member.bugs}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {isTopSp && <div className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center"><Trophy size={14} className="mr-1"/> Point Master</div>}
                {isTopTickets && <div className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center"><Award size={14} className="mr-1"/> Ticket Titan</div>}
                {isTopBugs && member.bugs > 0 && <div className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center"><Bug size={14} className="mr-1"/> Bug Squasher</div>}
            </div>
        </div>
    );
};

export function MemberHighlights({ data }) {
    return (
        <Section title="Member Highlights">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.memberHighlights.length > 0 ? data.memberHighlights.map(member => (
                    <HighlightCard 
                        key={member.name}
                        member={member}
                        topSp={data.topSpPerformer}
                        topTickets={data.topTicketPerformer}
                        topBugs={data.topBugSquasher}
                    />
                )) : <p className="col-span-full text-center text-gray-500">No completed tickets with assigned members yet.</p>}
            </div>
        </Section>
    );
}
