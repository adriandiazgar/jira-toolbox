import React from 'react';

export const StatCard = ({ icon, title, value, color, subtitle, valueColor = 'text-gray-800' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
            <h3 className="text-lg font-semibold text-gray-500 mt-4">{title}</h3>
            <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
        </div>
        {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
    </div>
);
