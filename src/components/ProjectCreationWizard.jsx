import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, Plus, ShieldCheck, Folder, Users } from 'lucide-react';

const ProjectCreationWizard = ({ onProjectCreated }) => {
    const [step, setStep] = useState(0);
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [projectCursorKey, setProjectCursorKey] = useState('');
    const [projectPath, setProjectPath] = useState('');
    const [selections, setSelections] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:3001/api/agents')
            .then(res => res.json())
            .then(data => {
                setAgents(data);
                setLoading(false);
            });
    }, []);

    // Dynamic Wizard Steps Calculation
    const [wizardSteps, setWizardSteps] = useState([
        { id: 'project-details', type: 'static', title: 'Start' },
        { id: 'team-selection', type: 'static', title: 'Team' },
        { id: 'summary', type: 'static', title: 'Review' }
    ]);

    // Update steps whenever selected agents change
    useEffect(() => {
        const baseSteps = [
            { id: 'project-details', type: 'static', title: 'Start' },
            { id: 'team-selection', type: 'static', title: 'Team' }
        ];

        // Find agents that actually have configuration sections
        const configurableAgents = agents
            .filter(a => selectedAgents.includes(a.id))
            .filter(a => a.sections && a.sections.length > 0);

        const agentSteps = configurableAgents.map(agent => ({
            id: `config-${agent.id}`,
            type: 'agent-config',
            title: agent.name,
            agent: agent
        }));

        const finalSteps = [
            ...baseSteps,
            ...agentSteps,
            { id: 'summary', type: 'static', title: 'Review' }
        ];

        setWizardSteps(finalSteps);
    }, [selectedAgents, agents]);

    const handleAgentToggle = (agentId) => {
        setSelectedAgents(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const activeAgents = agents.filter(a => selectedAgents.includes(a.id));

    // Agent Filtering & Grouping
    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedAgents = filteredAgents.reduce((acc, agent) => {
        const category = agent.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(agent);
        return acc;
    }, {});


    const handleSelection = (sectionName, value, type) => {
        setSelections(prev => {
            if (type === 'batch') {
                return { ...prev, [sectionName]: value };
            }
            if (type === 'multiple') {
                const current = prev[sectionName] || [];
                const next = current.includes(value)
                    ? current.filter(v => v !== value)
                    : [...current, value];
                return { ...prev, [sectionName]: next };
            }
            return { ...prev, [sectionName]: value };
        });
    };

    const createProject = async () => {
        const response = await fetch('http://localhost:3001/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: projectName,
                config: {
                    agents: selectedAgents,
                    selections: selections,
                    cursorKey: projectCursorKey,
                    projectPath: projectPath || undefined
                }
            })
        });
        if (response.ok) {
            onProjectCreated();
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Preparing agent foundry...</div>;

    const currentStepObj = wizardSteps[step] || wizardSteps[0];

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 h-[800px] flex flex-col transition-all overflow-hidden">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Step {step + 1} of {wizardSteps.length}: <span className="text-indigo-600">{currentStepObj.title}</span>
                    </span>
                </div>
                <div className="flex space-x-1 h-1.5">
                    {wizardSteps.map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-600' : 'bg-slate-100'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Area - Scroll handling moved to individual steps */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {currentStepObj.id === 'project-details' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Let's build something new</h2>
                                <p className="text-slate-600">Start by defining the identity of your project.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-slate-800 placeholder:font-normal"
                                        placeholder="my-next-big-thing"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-400 mt-2 ml-1">This will be the folder name for your project.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cursor API Key <span className="font-normal text-slate-400">(Optional Override)</span></label>
                                    <input
                                        type="password"
                                        value={projectCursorKey}
                                        onChange={(e) => setProjectCursorKey(e.target.value)}
                                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-sm"
                                        placeholder="sk-..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                                        <Folder className="h-4 w-4 mr-2 text-slate-400" />
                                        Custom Storage Path <span className="font-normal text-slate-400 ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={projectPath}
                                        onChange={(e) => setProjectPath(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-xs text-slate-600"
                                        placeholder="/app/projects or host path"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.id === 'team-selection' && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Fixed Header */}
                        <div className="flex-none flex items-end justify-between mb-6 pb-2 border-b border-transparent">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Assemble Your Team</h2>
                                <p className="text-slate-500 mt-1">Select the agents who will build this project.</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search agents..."
                                    className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none w-72 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Plus className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-8 pb-4">
                                {Object.keys(groupedAgents).length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 italic">No agents found matching "{searchTerm}"</div>
                                ) : (
                                    Object.entries(groupedAgents).map(([category, categoryAgents]) => (
                                        <div key={category}>
                                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center sticky top-0 bg-white z-10 py-2">
                                                <span className="bg-slate-100 px-2 py-1 rounded">{category}</span>
                                                <div className="h-px bg-slate-100 flex-1 ml-4"></div>
                                            </h4>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {categoryAgents.map(a => (
                                                    <div
                                                        key={a.id}
                                                        onClick={() => handleAgentToggle(a.id)}
                                                        className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 group relative ${selectedAgents.includes(a.id)
                                                            ? 'border-indigo-600 bg-indigo-50/30'
                                                            : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="text-2xl">{a.icon}</div>
                                                                <div>
                                                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{a.name}</h3>
                                                                </div>
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAgents.includes(a.id)
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'border-slate-200 group-hover:border-slate-400'
                                                                }`}>
                                                                {selectedAgents.includes(a.id) && <Plus className="h-4 w-4 text-white" />}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-relaxed pl-[44px]">{a.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.type === 'agent-config' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                    {currentStepObj.agent.icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Configure <span className="text-indigo-600">{currentStepObj.agent.name}</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm">Set up preferences for {currentStepObj.agent.role}</p>
                                </div>
                            </div>

                            <div className="space-y-8 max-w-3xl">
                                {currentStepObj.agent.sections.map((section) => (
                                    <div key={section.name} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-800 text-lg">{section.name}</h3>
                                            {section.options.type === 'multiple' && (
                                                <button
                                                    onClick={() => {
                                                        const allItems = section.options.items.map(i => i.name);
                                                        const currentlySelected = selections[section.name] || [];
                                                        const isAllSelected = allItems.every(i => currentlySelected.includes(i));
                                                        handleSelection(section.name, isAllSelected ? [] : allItems, 'batch');
                                                    }}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-100/50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {section.options.items.every(i => (selections[section.name] || []).includes(i.name)) ? 'Unselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {section.options.items.map(item => {
                                                const isSelected = section.options.type === 'multiple'
                                                    ? (selections[section.name] || []).includes(item.name)
                                                    : selections[section.name] === item.name;

                                                return (
                                                    <div
                                                        key={item.name}
                                                        onClick={() => handleSelection(section.name, item.name, section.options.type)}
                                                        className={`p-4 border-2 rounded-xl cursor-pointer flex items-center space-x-3 transition-all ${isSelected
                                                            ? 'border-indigo-600 bg-white shadow-md shadow-indigo-100 ring-1 ring-indigo-600'
                                                            : 'border-slate-200 bg-white hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                        </div>
                                                        <div>
                                                            <div className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{item.name}</div>
                                                            {item.description && <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.id === 'summary' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Ready to Launch?</h2>
                                <p className="text-slate-500">Review your project configuration before we start.</p>
                            </div>

                            <div className="bg-white border-2 border-indigo-50 p-8 rounded-3xl shadow-sm space-y-8 max-w-2xl mx-auto">
                                <div className="flex items-center justify-between pb-6 border-b border-indigo-50">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Identity</span>
                                        <div className="text-xl font-bold text-slate-800 mt-1">{projectName}</div>
                                        {projectPath && <div className="text-xs font-mono text-slate-500 mt-1 bg-slate-100 px-2 py-1 rounded inline-block">{projectPath}</div>}
                                    </div>
                                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <Folder className="h-6 w-6" />
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">The Team</span>
                                    <div className="flex flex-wrap gap-3">
                                        {activeAgents.map(a => (
                                            <div key={a.id} className="flex items-center space-x-2 bg-slate-50 border border-slate-100 pr-3 pl-2 py-1.5 rounded-lg">
                                                <span className="text-lg">{a.icon}</span>
                                                <span className="text-xs font-bold text-slate-700">{a.name}</span>
                                            </div>
                                        ))}
                                        {activeAgents.length === 0 && <span className="text-slate-400 italic text-sm">No agents selected</span>}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Technology Stack</span>
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative group">
                                        <div className="absolute top-0 right-0 p-2 opacity-50"><ShieldCheck className="text-slate-700 h-6 w-6" /></div>
                                        <pre className="text-xs text-slate-300 font-mono overflow-x-auto relative z-10 custom-scrollbar">
                                            {JSON.stringify(selections, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${step === 0 ? 'invisible' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </button>

                {step === wizardSteps.length - 1 ? (
                    <button
                        onClick={createProject}
                        disabled={!projectName}
                        className="flex items-center bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Save className="mr-2 h-4 w-4" /> Launch Project
                    </button>
                ) : (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={step === 0 && !projectName}
                        className="flex items-center bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
                    >
                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                    </button>
                )}
            </div>
        </div >
    );
};

export default ProjectCreationWizard;
