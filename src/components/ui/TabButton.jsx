import React from 'react';

export const TabButton = ({ view, label, icon, activeView, setActiveView }) => (
    <button 
        onClick={() => setActiveView(view)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeView === view ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);
