const callJiraApi = async (url) => {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`Jira API request failed: ${response.status}`);
    }
    return response.json();
};

export const fetchActiveSprints = (domain, boardId) => {
    const url = `https://${domain}/rest/agile/1.0/board/${boardId}/sprint?state=active`;
    return callJiraApi(url);
};

export const fetchSprintIssues = (domain, sprintId) => {
    const url = `https://${domain}/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog`;
    return callJiraApi(url);
};

export const fetchClosedSprints = (domain, boardId) => {
    const url = `https://${domain}/rest/agile/1.0/board/${boardId}/sprint?state=closed`;
    return callJiraApi(url);
};

export const fetchSprintReport = (domain, boardId, sprintId) => {
    const url = `https://${domain}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`;
    return callJiraApi(url);
};
