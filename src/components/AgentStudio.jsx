import React, { useState, useEffect } from 'react';
import {
    X, Search, Plus, Save, Trash2, Cpu, Eye, Code, Copy, Layout,
    CheckCircle2, AlertCircle, Loader2, Power, PowerOff,
    FileText, ChevronRight, LayoutGrid, User, Settings as SettingsIcon,
    Download, Upload
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ToggleSwitch = ({ active, onToggle }) => (
    <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'} shadow-sm`} />
    </button>
);

const AgentStudio = ({ onClose }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // UX & Feedback State (Phase 59)
    const [dialog, setDialog] = useState(null); // { title, message, type, confirmText, resolve, reject, input? }

    // Editor State
    const [metadata, setMetadata] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [promptContent, setPromptContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState('edit'); // edit, preview
    const [activeTab, setActiveTab] = useState('metadata'); // metadata, prompts

    // Esc Key Listener (Phase 59)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        fetchAgents();
    }, []);

    // Custom Dialog Helper (Phase 59)
    const ask = ({ title, message, type = 'info', confirmText = 'Confirm', input = false, defaultValue = '' }) => {
        return new Promise((resolve) => {
            setDialog({ title, message, type, confirmText, input, defaultValue, resolve });
        });
    };

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/agents');
            const data = await res.json();
            setAgents(data);
            if (data.length > 0 && !selectedAgentId) {
                handleSelectAgent(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAgent = async (id) => {
        setSelectedAgentId(id);
        setSelectedPrompt(null);
        setPromptContent('');
        setActiveTab('metadata');

        // Load metadata
        const agent = agents.find(a => a.id === id);
        if (agent) {
            // Normalize sections/options (Phase 59 legacy support)
            const normalizedSections = (agent.sections || []).map(section => {
                let normalizedOptions = [];
                // Handle new format (array of {id, label})
                if (Array.isArray(section.options)) {
                    normalizedOptions = section.options;
                }
                // Handle legacy format (options object with items array)
                else if (section.options && Array.isArray(section.options.items)) {
                    normalizedOptions = section.options.items.map(item => ({
                        id: item.id || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'option'),
                        label: item.label || item.name || 'Unnamed Option'
                    }));
                }

                return {
                    ...section,
                    id: section.id || (section.name ? section.name.toLowerCase().replace(/\s+/g, '-') : 'section'),
                    title: section.title || section.name || 'Unnamed Section',
                    type: section.type || (section.options && section.options.type) || 'single',
                    options: normalizedOptions
                };
            });

            setMetadata({
                ...agent,
                id: id, // Ensure ID is exactly the folder name, regardless of what's in YAML
                expertise: Array.isArray(agent.expertise) ? agent.expertise : [],
                goals: Array.isArray(agent.goals) ? agent.goals : [],
                sections: normalizedSections,
                docs_folder: agent.docs_folder || '',
                category: agent.category || '',
                phase: agent.phase || 'Implementation',
                language: agent.language || 'English'
            });
        }

        // Load prompts
        try {
            const res = await fetch(`http://localhost:3001/api/agents/${id}/prompts`);
            const data = await res.json();
            setPrompts(data);
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        }
    };

    const handleSelectPrompt = async (prompt) => {
        setSelectedPrompt(prompt);
        setActiveTab('prompts');
        setViewMode('edit');
        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}/prompts/${prompt.filename}`);
            const data = await res.json();
            setPromptContent(data.content);
        } catch (error) {
            console.error('Failed to fetch prompt content:', error);
        }
    };

    const handleSaveMetadata = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}/metadata`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata)
            });
            const result = await res.json();
            if (res.ok) {
                // Refresh local agents list
                const updatedAgents = agents.map(a => a.id === selectedAgentId ? result : a);
                setAgents(updatedAgents);

                // Update selected ID if it changed
                if (result.id !== selectedAgentId) {
                    setSelectedAgentId(result.id);
                }

                await ask({ title: 'Success', message: 'Agent metadata saved successfully.', type: 'success' });
            }
        } catch (error) {
            console.error('Failed to save metadata:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAgentActive = () => {
        const newMetadata = { ...metadata, active: !metadata.active };
        setMetadata(newMetadata);

        // Optimistic update for sidebar
        setAgents(agents.map(a => a.id === selectedAgentId ? { ...a, active: newMetadata.active } : a));
    };

    const handleSavePrompt = async () => {
        if (!selectedPrompt) return;
        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}/prompts/${selectedPrompt.filename}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: promptContent })
            });
            if (res.ok) {
                await ask({ title: 'Success', message: 'Prompt saved successfully.', type: 'success' });
            }
        } catch (error) {
            console.error('Failed to save prompt:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloneAgent = async () => {
        if (!selectedAgentId) return;
        const confirm = await ask({
            title: 'Clone Agent',
            message: `Are you sure you want to clone "${metadata.name}"?`,
            type: 'info',
            confirmText: 'Yes, Clone'
        });
        if (!confirm) return;

        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}/clone`, {
                method: 'POST'
            });
            const newAgent = await res.json();
            setAgents([...agents, newAgent]);
            handleSelectAgent(newAgent.id);
            await ask({ title: 'Success', message: 'Agent cloned successfully!', type: 'success' });
        } catch (error) {
            console.error('Failed to clone agent:', error);
            await ask({ title: 'Error', message: 'Failed to clone agent.', type: 'danger' });
        }
    };

    const handleDeleteAgent = async () => {
        if (!selectedAgentId) return;
        const confirm = await ask({
            title: 'Delete Agent',
            message: `Are you sure you want to delete "${metadata.name}"? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Agent'
        });
        if (!confirm) return;

        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const updatedAgents = agents.filter(a => a.id !== selectedAgentId);
                setAgents(updatedAgents);
                setMetadata(null);
                setSelectedAgentId(null);
                await ask({ title: 'Success', message: 'Agent deleted successfully.', type: 'success' });
            }
        } catch (error) {
            console.error('Failed to delete agent:', error);
            await ask({ title: 'Error', message: 'Failed to delete agent.', type: 'danger' });
        }
    };

    const handleAddNewAgent = async () => {
        const name = await ask({ title: 'New Agent', message: 'Enter the name for the new agent:', input: true });
        if (!name) return;

        try {
            const res = await fetch('http://localhost:3001/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, icon: '🤖', role: 'New Agent Role', category: 'General' })
            });
            const newAgent = await res.json();
            setAgents([...agents, newAgent]);
            handleSelectAgent(newAgent.id);
        } catch (error) {
            console.error('Failed to create agent:', error);
        }
    };

    const handleExportAgent = async () => {
        if (!selectedAgentId) return;
        try {
            window.location.href = `http://localhost:3001/api/agents/${selectedAgentId}/export`;
        } catch (error) {
            console.error('Export failed:', error);
            await ask({ title: 'Error', message: 'Failed to export agent.', type: 'danger' });
        }
    };

    const handleImportAgent = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const res = await fetch('http://localhost:3001/api/agents/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/zip' },
                body: buffer
            });
            const result = await res.json();
            if (res.ok) {
                // Refresh agents list
                const agentsRes = await fetch('http://localhost:3001/api/agents');
                const newAgents = await agentsRes.json();
                setAgents(newAgents);

                // We use the new agents list to select the agent to ensure state consistency
                setTimeout(() => {
                    handleSelectAgent(result.id);
                }, 50);

                await ask({ title: 'Success', message: `Agent "${result.metadata.name}" installed successfully!`, type: 'success' });
            } else {
                await ask({ title: 'Error', message: result.error || 'Import failed.', type: 'danger' });
            }
        } catch (error) {
            console.error('Import failed:', error);
            await ask({ title: 'Error', message: 'Failed to import agent.', type: 'danger' });
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    const handleAddNewPrompt = async () => {
        const title = await ask({ title: 'New Prompt', message: 'Enter the prompt title (e.g. initial_setup):', input: true });
        if (!title) return;
        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}.md`;

        const newPrompt = { filename, id: title.toLowerCase().replace(/\s+/g, '_') };
        setPrompts([...prompts, newPrompt]);
        setSelectedPrompt(newPrompt);
        setPromptContent('# ' + title + '\n\nNew prompt content...');
        setActiveTab('prompts');
    };

    const handleDeletePrompt = async (prompt) => {
        const confirmed = await ask({
            title: 'Delete Prompt',
            message: `Are you sure you want to delete "${prompt.filename}"? This cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete'
        });
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3001/api/agents/${selectedAgentId}/prompts/${prompt.filename}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setPrompts(prompts.filter(p => p.filename !== prompt.filename));
                if (selectedPrompt?.filename === prompt.filename) {
                    setSelectedPrompt(null);
                    setPromptContent('');
                    setActiveTab('metadata');
                }
            }
        } catch (error) {
            console.error('Failed to delete prompt:', error);
        }
    };

    const filteredAgents = agents.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get unique roles for smart suggestions (Phase 59)
    const existingRoles = Array.from(new Set(agents.map(a => a.role))).filter(Boolean);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
            {/* Custom Dialog / Modal (Phase 59) */}
            {dialog && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => { if (dialog.type === 'info' || dialog.type === 'success') { setDialog(null); dialog.resolve(true); } else { setDialog(null); dialog.resolve(false); } }}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center space-x-4 mb-6">
                            <div className={`p-3 rounded-2xl ${dialog.type === 'danger' ? 'bg-red-50 text-red-500' :
                                dialog.type === 'success' ? 'bg-green-50 text-green-500' :
                                    'bg-indigo-50 text-indigo-500'
                                }`}>
                                {dialog.type === 'danger' ? <Trash2 className="h-6 w-6" /> :
                                    dialog.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> :
                                        <AlertCircle className="h-6 w-6" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{dialog.title}</h3>
                                <p className="text-slate-500 text-sm font-medium">{dialog.message}</p>
                            </div>
                        </div>

                        {dialog.input && (
                            <input
                                autoFocus
                                id="dialog-input"
                                defaultValue={dialog.defaultValue}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 mb-8"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value;
                                        setDialog(null);
                                        dialog.resolve(val);
                                    }
                                }}
                            />
                        )}

                        <div className="flex space-x-3">
                            {(dialog.type === 'danger' || dialog.input || dialog.type === 'info') && (
                                <button
                                    onClick={() => { setDialog(null); dialog.resolve(false); }}
                                    className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    const val = dialog.input ? document.getElementById('dialog-input').value : true;
                                    setDialog(null);
                                    dialog.resolve(val);
                                }}
                                className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg ${dialog.type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-100' :
                                    'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                    }`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white w-full h-full max-w-7xl rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-slate-200">
                {/* Sidebar */}
                <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                    <Cpu className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-black text-slate-800 tracking-tight">Agent Studio</h1>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredAgents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => handleSelectAgent(agent.id)}
                                className={`w-full text-left p-3 rounded-2xl transition-all flex items-center space-x-3 group relative ${selectedAgentId === agent.id
                                    ? 'bg-white shadow-md shadow-indigo-500/5 border border-indigo-100 ring-4 ring-indigo-50'
                                    : 'hover:bg-white/60 border border-transparent'
                                    }`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedAgentId === agent.id ? 'bg-indigo-50' : 'bg-slate-100 group-hover:bg-indigo-50'
                                    }`}>
                                    {agent.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-bold text-sm truncate ${selectedAgentId === agent.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {agent.name}
                                        </span>
                                        {agent.active === false && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-bold uppercase tracking-wider">Deactivated</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">{agent.role}</p>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-all ${selectedAgentId === agent.id ? 'text-indigo-500 translate-x-0' : 'text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 flex flex-col space-y-2">
                        <button
                            onClick={handleAddNewAgent}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-98"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create New Agent</span>
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".zip"
                                onChange={handleImportAgent}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                id="agent-import-input"
                            />
                            <button
                                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 transition-all"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Install Agent Package</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {metadata ? (
                        <>
                            {/* Editor Header */}
                            <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                <div className="flex-1 flex items-center space-x-4 min-w-0">
                                    <div className="text-3xl flex-shrink-0">{metadata.icon}</div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight truncate">{metadata.name}</h2>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{metadata.category}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0"></span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{metadata.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={handleCloneAgent}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Clone Agent"
                                    >
                                        <Copy className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                        onClick={handleDeleteAgent}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Agent"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                    <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                    <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${metadata.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {metadata.active ? 'Active' : 'Inactive'}
                                        </span>
                                        <ToggleSwitch active={metadata.active} onToggle={toggleAgentActive} />
                                    </div>

                                    <button
                                        onClick={handleExportAgent}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Export Agent</span>
                                    </button>
                                    <button
                                        onClick={activeTab === 'metadata' ? handleSaveMetadata : handleSavePrompt}
                                        disabled={isSaving}
                                        className={`flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sub-navigation */}
                            <div className="px-8 mt-6">
                                <div className="flex space-x-6 border-b border-slate-100">
                                    <button
                                        onClick={() => setActiveTab('metadata')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'metadata' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        Agent Metadata
                                        {activeTab === 'metadata' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('prompts')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'prompts' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        Prompts & Documentation ({prompts.length})
                                        {activeTab === 'prompts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
                                    </button>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-y-auto p-8">
                                {activeTab === 'metadata' ? (
                                    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Agent Name</label>
                                                <input
                                                    value={metadata.name}
                                                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 caret-indigo-600"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Icon (Emoji)</label>
                                                <input
                                                    value={metadata.icon}
                                                    onChange={(e) => setMetadata({ ...metadata, icon: e.target.value })}
                                                    placeholder="Example: ⚛️"
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center text-2xl caret-indigo-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Docs Folder</label>
                                                <input
                                                    value={metadata.docs_folder}
                                                    onChange={(e) => setMetadata({ ...metadata, docs_folder: e.target.value })}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 caret-indigo-600"
                                                    placeholder="e.g. frontend"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                                <input
                                                    value={metadata.category}
                                                    onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 caret-indigo-600"
                                                    placeholder="e.g. Development"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phase</label>
                                                <select
                                                    value={metadata.phase}
                                                    onChange={(e) => setMetadata({ ...metadata, phase: e.target.value })}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                                                >
                                                    <option value="Planning">Planning</option>
                                                    <option value="Implementation">Implementation</option>
                                                    <option value="Research">Research</option>
                                                    <option value="Architecture">Architecture</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                                                <input
                                                    value={metadata.language}
                                                    onChange={(e) => setMetadata({ ...metadata, language: e.target.value })}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 caret-indigo-600"
                                                    placeholder="e.g. English"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 relative">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expert Role</label>
                                            <input
                                                list="existing-roles"
                                                value={metadata.role}
                                                onChange={(e) => setMetadata({ ...metadata, role: e.target.value })}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 caret-indigo-600"
                                                placeholder="e.g. Senior Architecture Specialist"
                                            />
                                            <datalist id="existing-roles">
                                                {existingRoles.map(role => <option key={role} value={role} />)}
                                            </datalist>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                            <textarea
                                                value={metadata.description}
                                                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-32 resize-none leading-relaxed font-bold text-slate-800 caret-indigo-600"
                                                placeholder="What does this agent do?"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expertise Areas</label>
                                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[64px]">
                                                {Array.isArray(metadata.expertise) && metadata.expertise.map(tag => (
                                                    <span key={tag} className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 animate-in zoom-in-95">
                                                        <span>{tag}</span>
                                                        <button
                                                            onClick={() => setMetadata({ ...metadata, expertise: metadata.expertise.filter(t => t !== tag) })}
                                                            className="hover:text-indigo-800 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    placeholder="Add expertise..."
                                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300 caret-indigo-600"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                                            const val = e.target.value.trim();
                                                            const current = Array.isArray(metadata.expertise) ? metadata.expertise : [];
                                                            if (!current.includes(val)) {
                                                                setMetadata({ ...metadata, expertise: [...current, val] });
                                                            }
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Agent Goals</label>
                                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[64px]">
                                                {Array.isArray(metadata.goals) && metadata.goals.map(goal => (
                                                    <span key={goal} className="flex items-center space-x-1 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-bold border border-violet-100 animate-in zoom-in-95">
                                                        <span>{goal}</span>
                                                        <button
                                                            onClick={() => setMetadata({ ...metadata, goals: metadata.goals.filter(g => g !== goal) })}
                                                            className="hover:text-violet-800 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    placeholder="Add goal..."
                                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300 caret-indigo-600"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                                            const val = e.target.value.trim();
                                                            const current = Array.isArray(metadata.goals) ? metadata.goals : [];
                                                            if (!current.includes(val)) {
                                                                setMetadata({ ...metadata, goals: [...current, val] });
                                                            }
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                <Cpu className="h-24 w-24 text-indigo-400" />
                                            </div>
                                            <div className="relative z-10 flex items-start space-x-6">
                                                <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                                    <SettingsIcon className="h-6 w-6 text-indigo-300" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-white mb-1">Wizard Configuration</h3>
                                                    <p className="text-indigo-200/60 text-sm mb-4">Configure the custom wizard sections and options this agent presents during project creation.</p>
                                                    <div className="space-y-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.isArray(metadata.sections) && metadata.sections.length > 0 ? (
                                                                metadata.sections.map(s => (
                                                                    <div key={s.id} className="flex items-center space-x-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                                                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{s.title}</span>
                                                                        <button
                                                                            onClick={() => setMetadata({ ...metadata, sections: metadata.sections.filter(sec => sec.id !== s.id) })}
                                                                            className="text-indigo-400 hover:text-white transition-colors"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">No custom sections defined.</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                const title = await ask({ title: 'New Section', message: 'Enter section name (e.g. Database):', input: true });
                                                                if (!title) return;
                                                                const id = title.toLowerCase().replace(/\s+/g, '-');
                                                                const newSection = { id, title, type: 'single', options: [] };
                                                                const current = Array.isArray(metadata.sections) ? metadata.sections : [];
                                                                setMetadata({ ...metadata, sections: [...current, newSection] });
                                                            }}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                                                        >
                                                            Add Wizard Section
                                                        </button>
                                                    </div>

                                                    {Array.isArray(metadata.sections) && metadata.sections.length > 0 && (
                                                        <div className="mt-6 space-y-4 pt-6 border-t border-white/5">
                                                            {metadata.sections.map((section, sIdx) => (
                                                                <div key={section.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-xs font-bold text-white uppercase tracking-widest">{section.title}</span>
                                                                        <select
                                                                            value={section.type}
                                                                            onChange={(e) => {
                                                                                const newSections = [...metadata.sections];
                                                                                newSections[sIdx].type = e.target.value;
                                                                                setMetadata({ ...metadata, sections: newSections });
                                                                            }}
                                                                            className="bg-slate-800 text-[10px] font-bold text-indigo-300 rounded-lg px-2 py-1 outline-none border border-white/10"
                                                                        >
                                                                            <option value="single">Single Select</option>
                                                                            <option value="multiple">Multiple Select</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                                        {Array.isArray(section.options) && section.options.map((opt, oIdx) => (
                                                                            <span key={opt.id} className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg text-[10px] text-white/60">
                                                                                <span>{opt.label}</span>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newSections = [...metadata.sections];
                                                                                        newSections[sIdx].options = newSections[sIdx].options.filter((_, idx) => idx !== oIdx);
                                                                                        setMetadata({ ...metadata, sections: newSections });
                                                                                    }}
                                                                                    className="hover:text-white"
                                                                                >
                                                                                    <X className="h-2.5 w-2.5" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        onClick={async () => {
                                                                            const label = await ask({ title: 'New Option', message: `Add option to ${section.title}:`, input: true });
                                                                            if (!label) return;
                                                                            const id = label.toLowerCase().replace(/\s+/g, '-');
                                                                            const newSections = [...metadata.sections];
                                                                            const currentOpts = Array.isArray(newSections[sIdx].options) ? newSections[sIdx].options : [];
                                                                            newSections[sIdx].options = [...currentOpts, { id, label }];
                                                                            setMetadata({ ...metadata, sections: newSections });
                                                                        }}
                                                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 uppercase tracking-widest"
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                        <span>Add Option</span>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col space-y-6">
                                        <div className="flex items-start space-x-6 min-h-0 h-full">
                                            {/* Sub-sidebar for prompts */}
                                            <div className="w-56 space-y-2 flex-shrink-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Saved Prompts</label>
                                                    <button onClick={handleAddNewPrompt} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-all">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                {prompts.map(p => (
                                                    <div key={p.filename} className="group relative">
                                                        <button
                                                            onClick={() => handleSelectPrompt(p)}
                                                            className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${selectedPrompt?.filename === p.filename ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                                }`}
                                                        >
                                                            <FileText className="h-3.5 w-3.5 opacity-60" />
                                                            <span className="truncate">{p.id}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePrompt(p); }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all rounded"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {prompts.length === 0 && (
                                                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">No prompts created</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prompt Content Area */}
                                            {selectedPrompt ? (
                                                <div className="flex-1 flex flex-col bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden h-full">
                                                    <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4 text-slate-400" />
                                                            <span className="text-sm font-black text-slate-700">{selectedPrompt.filename}</span>
                                                        </div>
                                                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                                            <button
                                                                onClick={() => setViewMode('edit')}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                            >
                                                                <Code className="h-3 w-3" /> <span>Editor</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setViewMode('preview')}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-1.5 ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                            >
                                                                <Eye className="h-3 w-3" /> <span>Preview</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-hidden">
                                                        {viewMode === 'edit' ? (
                                                            <textarea
                                                                value={promptContent}
                                                                onChange={(e) => setPromptContent(e.target.value)}
                                                                className="w-full h-full p-8 bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-700 resize-none placeholder:text-slate-300 caret-indigo-600"
                                                                placeholder="# Enter markdown prompt here..."
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full p-8 overflow-y-auto prose prose-slate prose-sm max-w-none prose-h1:text-indigo-600 bg-white shadow-inner">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptContent}</ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 h-full">
                                                    <div className="text-center">
                                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 inline-block mb-4">
                                                            <FileText className="h-8 w-8 text-slate-200" />
                                                        </div>
                                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Select or create a prompt to start editing</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20">
                            {loading ? (
                                <Loader2 className="h-12 w-12 animate-spin text-slate-200" />
                            ) : (
                                <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                        <Cpu className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">No Agent Selected</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">Select an agent from the sidebar or create a new one to start configuring.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AgentStudio;
