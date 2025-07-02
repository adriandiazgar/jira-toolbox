import React from 'react';

export const Section = ({ title, children, className = '' }) => (
    <div className={`bg-white p-8 rounded-2xl shadow-lg ${className}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        {children}
    </div>
);
