import { useState, useEffect } from 'react';

// This function safely gets a value from localStorage.
function getStorageValue(key, defaultValue) {
    const saved = localStorage.getItem(key);
    
    // If there's no saved value, return the default.
    if (saved === null) {
        return defaultValue;
    }

    try {
        // Try to parse it as JSON. This works for objects, arrays, and properly quoted strings.
        return JSON.parse(saved);
    } catch (error) {
        // If parsing fails, it's likely a simple string that wasn't stored as JSON.
        // In this case, we return the raw string value.
        // The hook's useEffect will ensure it's stored correctly as JSON next time.
        return saved;
    }
}

export const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        // When saving, we always use JSON.stringify. This ensures that even
        // simple strings are stored in a valid JSON format (e.g., "my-string").
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};
