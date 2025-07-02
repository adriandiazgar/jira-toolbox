import { useState, useMemo, useEffect } from 'react';
import { fetchClosedSprints, fetchSprintReport } from '../services/jiraApi';

export const useJiraImport = (jiraDomain, boardId, onDetailAdded) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [detailLoading, setDetailLoading] = useState({});
    const [fetchedSprints, setFetchedSprints] = useState(() => {
        try {
            const saved = localStorage.getItem('fetchedSprints');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });
    const [error, setError] = useState('');
    const [fetchStatus, setFetchStatus] = useState('');

    useEffect(() => {
        localStorage.setItem('fetchedSprints', JSON.stringify(fetchedSprints));
    }, [fetchedSprints]);
    
    const cleanDomain = useMemo(() => jiraDomain.replace(/^(https?:\/\/)?/, '').replace(/\/$/, ''), [jiraDomain]);

    const handleAutoFetchSprintsList = async () => {
        if (!jiraDomain || !boardId) {
            setError('Please provide your Jira Domain and Board ID.');
            return;
        }
        setError('');
        setIsLoading(true);
        setFetchStatus('');
        
        try {
            const data = await fetchClosedSprints(cleanDomain, boardId);
            if (!data.values) throw new Error("Invalid JSON structure.");
            setFetchedSprints(data.values);
        } catch (err) {
            console.error("Auto-fetch failed:", err);
            // Removed JSX from the error message
            setError('Auto-fetch failed (likely due to CORS). You may need a browser extension like CORS Unblock.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchSprintDetails = async (sprint) => {
        setDetailLoading(prev => ({ ...prev, [sprint.id]: true }));
        try {
            const data = await fetchSprintReport(cleanDomain, boardId, sprint.id);
            if (!data.contents) throw new Error('Invalid detail JSON');
            onDetailAdded(sprint.id, data.contents);
        } catch (err) {
            // Return error to be handled by the component (e.g., open manual modal)
            throw err;
        } finally {
            setDetailLoading(prev => ({ ...prev, [sprint.id]: false }));
        }
    };
    
    const handleBulkFetchDetails = async (sprintsToFetch) => {
        if (sprintsToFetch.length === 0) {
            setFetchStatus("All selected sprints already have details.");
            return;
        }
        setIsBulkFetching(true);
        setFetchStatus(`Fetching details for ${sprintsToFetch.length} sprint(s)...`);

        const promises = sprintsToFetch.map(sprint => 
            handleFetchSprintDetails(sprint)
                .then(() => ({ status: 'fulfilled' }))
                .catch(() => ({ status: 'rejected' }))
        );
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.length - successCount;

        setFetchStatus(`Fetch complete. Success: ${successCount}. Failures: ${failureCount}.`);
        setIsBulkFetching(false);
    };

    const handleStartOver = () => {
        setFetchedSprints([]);
        setError('');
        setFetchStatus('');
        localStorage.removeItem('fetchedSprints');
    };

    return {
        isLoading,
        isBulkFetching,
        detailLoading,
        fetchedSprints,
        error,
        fetchStatus,
        handleAutoFetchSprintsList,
        handleFetchSprintDetails,
        handleBulkFetchDetails,
        handleStartOver,
    };
};
