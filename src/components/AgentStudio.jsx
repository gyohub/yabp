import React, { useState, useEffect } from 'react';
import {
    X, Search, Plus, Save, Trash2, Cpu, Eye, Code,
    CheckCircle2, AlertCircle, Loader2, Power, PowerOff,
    FileText, ChevronRight, LayoutGrid, User, Settings as SettingsIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AgentStudio = ({ onClose }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Editor State
    const [metadata, setMetadata] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [promptContent, setPromptContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState('edit'); // edit, preview
    const [activeTab, setActiveTab] = useState('metadata'); // metadata, prompts

    useEffect(() => {
        fetchAgents();
    }, []);

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
            setMetadata({ ...agent });
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
            if (res.ok) {
                // Refresh local agents list
                const updatedAgents = agents.map(a => a.id === selectedAgentId ? { ...metadata, id: a.id } : a);
                setAgents(updatedAgents);
                alert('Metadata saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save metadata:', error);
        } finally {
            setIsSaving(false);
        }
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
                alert('Prompt saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save prompt:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddNewAgent = async () => {
        const name = prompt('Enter agent name:');
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

    const handleAddNewPrompt = () => {
        const title = prompt('Enter prompt title (e.g. initial_setup):');
        if (!title) return;
        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}.md`;

        const newPrompt = { filename, id: title.toLowerCase().replace(/\s+/g, '_') };
        setPrompts([...prompts, newPrompt]);
        setSelectedPrompt(newPrompt);
        setPromptContent('# ' + title + '\n\nNew prompt content...');
        setActiveTab('prompts');
    };

    const handleDeletePrompt = async (prompt) => {
        if (!window.confirm(`Delete prompt ${prompt.filename}?`)) return;

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

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
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

                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleAddNewAgent}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-98"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create New Agent</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {metadata ? (
                        <>
                            {/* Editor Header */}
                            <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="text-3xl">{metadata.icon}</div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{metadata.name}</h2>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{metadata.category}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{metadata.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setMetadata({ ...metadata, active: !metadata.active })}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${metadata.active
                                                ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {metadata.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                                        <span>{metadata.active ? 'Active' : 'Deactivated'}</span>
                                    </button>

                                    <button
                                        onClick={activeTab === 'metadata' ? handleSaveMetadata : handleSavePrompt}
                                        disabled={isSaving}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all flex items-center space-x-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        <span>Save Changes</span>
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
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Icon (Emoji)</label>
                                                <input
                                                    value={metadata.icon}
                                                    onChange={(e) => setMetadata({ ...metadata, icon: e.target.value })}
                                                    placeholder="Example: ⚛️"
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center text-2xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expert Role</label>
                                            <input
                                                value={metadata.role}
                                                onChange={(e) => setMetadata({ ...metadata, role: e.target.value })}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                placeholder="e.g. Senior Architecture Specialist"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                            <textarea
                                                value={metadata.description}
                                                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-32 resize-none leading-relaxed"
                                                placeholder="What does this agent do?"
                                            />
                                        </div>

                                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                <Cpu className="h-24 w-24 text-indigo-400" />
                                            </div>
                                            <div className="relative z-10 flex items-start space-x-6">
                                                <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                                    <SettingsIcon className="h-6 w-6 text-indigo-300" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-1">Advanced Settings</h3>
                                                    <p className="text-indigo-200/60 text-sm mb-4">Customize how this agent interacts with specific technologies and frameworks.</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['react', 'node', 'python', 'docker'].map(t => (
                                                            <span key={t} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white/80 uppercase tracking-widest">{t}</span>
                                                        ))}
                                                    </div>
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
                                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No prompts created</p>
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
                                                                className="w-full h-full p-8 bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-700 resize-none placeholder:text-slate-300"
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
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentStudio;
