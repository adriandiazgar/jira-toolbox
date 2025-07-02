import React from 'react';
import { Zap, HelpCircle } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

const inputStyle = "w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

export function FetchSprintForm({ jiraDomain, setJiraDomain, boardId, setBoardId, spFieldId, setSpFieldId, onFetch, isLoading, error }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Fetch Active Sprint</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <label htmlFor="jiraDomain" className={labelStyle}>Jira Domain</label>
                    <input id="jiraDomain" type="text" value={jiraDomain} onChange={(e) => setJiraDomain(e.target.value)} className={inputStyle} placeholder="your-company.atlassian.net" />
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="boardId" className={labelStyle}>Board ID</label>
                        <Tooltip text="Find this in your Jira board's URL. e.g., .../boards/123"><HelpCircle size={14} className="text-gray-400" /></Tooltip>
                    </div>
                    <input id="boardId" type="text" value={boardId} onChange={(e) => setBoardId(e.target.value)} className={inputStyle} placeholder="123" />
                </div>
                 <div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="spFieldId" className={labelStyle}>Story Point Field ID</label>
                        <Tooltip text="Inspect a Jira issue's JSON to find this. Common ID: customfield_10016"><HelpCircle size={14} className="text-gray-400" /></Tooltip>
                    </div>
                    <input id="spFieldId" type="text" value={spFieldId} onChange={(e) => setSpFieldId(e.target.value)} className={inputStyle} placeholder="customfield_10039" />
                </div>
                <button onClick={onFetch} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                    <Zap size={16} className="mr-2" />
                    {isLoading ? 'Fetching...' : 'Fetch Active Sprints'}
                </button>
            </div>
            {error && <div className="mt-4 text-red-500 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}
        </div>
    );
}
