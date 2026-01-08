import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, Plus, ShieldCheck, Folder, Users, Layout, Zap, FileText, Cloud, CheckCircle2 } from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../config/workflowTemplates';

const ProjectCreationWizard = ({ onProjectCreated, onCancel }) => {
    const [step, setStep] = useState(0);
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [projectCursorKey, setProjectCursorKey] = useState('');
    const [projectPath, setProjectPath] = useState('');
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
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
        { id: 'workflow-selection', type: 'static', title: 'Workflow' },
        { id: 'team-selection', type: 'static', title: 'Team' },
        { id: 'summary', type: 'static', title: 'Review' }
    ]);

    // Update steps whenever selected agents change
    useEffect(() => {
        const baseSteps = [
            { id: 'project-details', type: 'static', title: 'Start' },
            { id: 'workflow-selection', type: 'static', title: 'Workflow' },
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
    }, [selectedAgents, agents, selectedWorkflow]);

    const handleWorkflowSelect = (template) => {
        setSelectedWorkflow(template);
        if (template) {
            // Pre-select agents
            // We need to match agent IDs.
            // If "Custom" (template is null), we might want to clear or keep?
            // Let's assume selecting a template REPLACES current selection unless customized later.
            setSelectedAgents(template.recommendedAgents);
        } else {
            // Custom - maybe keep clear?
            setSelectedAgents([]);
        }
    };

    const handleAgentToggle = (agentId) => {
        // Prevent deselecting required agents from the workflow
        if (selectedWorkflow && selectedWorkflow.recommendedAgents.includes(agentId)) {
            return;
        }

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
        try {
            console.log('Creating project...', { projectName, selectedAgents, selections, selectedWorkflow });
            const response = await fetch('http://localhost:3001/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: projectName,
                    config: {
                        agents: selectedAgents,
                        selections: selections,
                        cursorKey: projectCursorKey,
                        projectPath: projectPath || undefined,
                        workflow: selectedWorkflow ? { phases: selectedWorkflow.phases } : undefined
                    }
                })
            });

            if (response.ok) {
                console.log('Project created successfully');
                onProjectCreated();
            } else {
                const errorText = await response.text();
                console.error('Failed to create project:', response.status, errorText);
                alert(`Failed to create project: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert(`Error creating project: ${error.message}`);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Preparing agent foundry...</div>;

    const currentStepObj = wizardSteps[step] || wizardSteps[0];

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 h-full max-h-[90vh] flex flex-col transition-all overflow-hidden">
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {currentStepObj.id === 'project-details' && (
                    <div className="flex-1 min-h-0 w-full overflow-y-auto pr-2 custom-scrollbar">
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
                                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg text-slate-800 placeholder:font-normal caret-indigo-600"
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
                                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-sm caret-indigo-600"
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
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-xs text-slate-600 caret-indigo-600"
                                        placeholder="/app/projects or host path"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.id === 'workflow-selection' && (
                    <div className="flex-1 min-h-0 w-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Select a Workflow</h2>
                                <p className="text-slate-500">Choose a development lifecycle template to pre-assemble your team.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {WORKFLOW_TEMPLATES.map(template => {
                                    const isSelected = selectedWorkflow?.id === template.id;
                                    return (
                                        <div
                                            key={template.id}
                                            onClick={() => handleWorkflowSelect(template)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-indigo-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                                    {template.icon === 'Zap' && <Zap className="w-5 h-5 text-amber-500" />}
                                                    {template.icon === 'Layout' && <Layout className="w-5 h-5 text-indigo-500" />}
                                                    {template.icon === 'FileText' && <FileText className="w-5 h-5 text-slate-500" />}
                                                    {template.icon === 'Cloud' && <Cloud className="w-5 h-5 text-sky-500" />}
                                                </div>
                                                {isSelected && <div className="bg-indigo-600 text-white rounded-full p-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 mb-1">{template.name}</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2 h-8">{template.description}</p>

                                            <div className="flex flex-wrap gap-1.5">
                                                {template.recommendedAgents.slice(0, 3).map(a => (
                                                    <span key={a} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{a}</span>
                                                ))}
                                                {template.recommendedAgents.length > 3 && (
                                                    <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">+{template.recommendedAgents.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Custom Option */}
                                <div
                                    onClick={() => handleWorkflowSelect(null)}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group ${selectedWorkflow === null ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-indigo-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Users className="w-5 h-5 text-slate-400" />
                                        </div>
                                        {selectedWorkflow === null && <div className="bg-indigo-600 text-white rounded-full p-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></div>}
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-1">Custom Team</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">Start from scratch and hand-pick your agents one by one.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.id === 'team-selection' && (
                    <div className="flex-1 min-h-0 w-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Fixed Header */}
                        <div className="flex-none flex items-end justify-between mb-6 pb-2 border-b border-transparent">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Assemble Your Team</h2>
                                <p className="text-slate-500 mt-1">Core workflow agents are pre-selected. Feel free to add more specialists to your team.</p>
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
                        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {categoryAgents.map(a => {
                                                    const isRequired = selectedWorkflow && selectedWorkflow.recommendedAgents.includes(a.id);
                                                    const isSelected = selectedAgents.includes(a.id);

                                                    return (
                                                        <div
                                                            key={a.id}
                                                            onClick={() => handleAgentToggle(a.id)}
                                                            className={`p-3 border-2 rounded-xl transition-all duration-200 group relative ${isSelected
                                                                ? 'border-indigo-600 bg-indigo-50/30'
                                                                : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md cursor-pointer'
                                                                } ${isRequired ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="text-lg">{a.icon}</div>
                                                                    <div>
                                                                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{a.name}</h3>
                                                                    </div>
                                                                </div>
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                                                                    ? 'bg-indigo-600 border-indigo-600'
                                                                    : 'border-slate-200 group-hover:border-slate-400'
                                                                    }`}>
                                                                    {isSelected && (isRequired ? <CheckCircle2 className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-white" />)}
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 leading-tight pl-[30px] line-clamp-2">{a.description}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStepObj.type === 'agent-config' && (
                    <div className="flex-1 min-h-0 w-full overflow-y-auto pr-2 custom-scrollbar">
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
                    <div className="flex-1 min-h-0 w-full overflow-y-auto pr-2 custom-scrollbar">
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

                                {selectedWorkflow && (
                                    <div className="border-b border-indigo-50 pb-6">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Workflow</span>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="font-bold text-slate-800">{selectedWorkflow.name}</span>
                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{selectedWorkflow.phases.length} Phases</span>
                                        </div>
                                    </div>
                                )}

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
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-red-500 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${step === 0 ? 'invisible' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </button>
                </div>

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
