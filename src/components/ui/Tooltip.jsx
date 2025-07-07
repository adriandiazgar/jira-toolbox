import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// This is the actual tooltip element that will be rendered into a portal.
const TooltipContent = ({ text, coords }) => {
    if (!coords) return null;

    // We use inline styles here to position the tooltip dynamically based on the trigger element.
    const style = {
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateX(-50%)',
    };

    return createPortal(
        <div 
            style={style}
            className="fixed w-64 bg-gray-800 text-white text-xs rounded-md py-1.5 px-3 z-50 text-center whitespace-normal shadow-lg transition-opacity duration-200"
        >
            {text}
        </div>,
        document.body // This renders the tooltip at the end of the document body, outside any clipping containers.
    );
};

// This is the main component you'll use in your app.
export const Tooltip = ({ text, children }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState(null);
    const triggerRef = useRef(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipWidth = 256; // Corresponds to w-64 class
            const space = 8; // 8px margin from the edge of the screen

            // Calculate the ideal centered position
            let left = rect.left + rect.width / 2;
            const top = rect.bottom + space;

            // Check if the tooltip would go off the right edge of the screen
            if (left + tooltipWidth / 2 > window.innerWidth) {
                left = window.innerWidth - (tooltipWidth / 2) - space;
            }

            // Check if the tooltip would go off the left edge of the screen
            if (left - tooltipWidth / 2 < 0) {
                left = (tooltipWidth / 2) + space;
            }

            setCoords({ top, left });
            setVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <>
            <div 
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="flex items-center"
            >
                {children}
            </div>
            {/* The TooltipContent is only rendered when the mouse is over the trigger. */}
            {visible && <TooltipContent text={text} coords={coords} />}
        </>
    );
};
