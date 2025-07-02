import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function ShareButton({ appId }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(appId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
           {/* ... same code as before ... */}
        </div>
    );
}
