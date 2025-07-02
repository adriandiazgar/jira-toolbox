import React from 'react';
import { Zap, HelpCircle } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

const inputStyle = "w-full p-3 bg-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition border border-gray-200";
const labelStyle = "block text-sm font-medium text-gray-600 mb-1";

export function JiraImportSetup({ jiraDomain, setJiraDomain, boardId, setBoardId, onFetch, isLoading, error, generatedUrl, jsonInput, setJsonInput, onParse }) {
    return (
        <div className="space-y-4">
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
            {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}
            <button onClick={onFetch} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                <Zap size={16} className="mr-2" />
                {isLoading ? 'Fetching...' : 'Auto-Fetch Sprints'}
            </button>
            {generatedUrl && (
                 <div className="space-y-4 mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-center text-gray-600">Manual Fallback:</p>
                    <p className="text-sm font-medium">Step 1: Visit this URL and copy the JSON content.</p>
                    <input type="text" readOnly value={generatedUrl} className={`${inputStyle} font-mono text-xs`} />
                    <p className="text-sm font-medium">Step 2: Paste the JSON content here.</p>
                    <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className={`${inputStyle} min-h-24 font-mono text-xs`} placeholder="Paste JSON here..."></textarea>
                    <button onClick={onParse} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700">
                        Parse Sprints from JSON
                    </button>
                </div>
            )}
        </div>
    );
}
