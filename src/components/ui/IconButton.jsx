import React from 'react';

export const IconButton = ({ icon, onClick, className = '' }) => (
    <button onClick={onClick} className={`p-2 rounded-full transition-colors duration-200 ${className}`}>{icon}</button>
);
