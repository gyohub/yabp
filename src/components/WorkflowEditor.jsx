import React, { useState } from 'react';
import {
    Sparkles, Layout, Terminal as TerminalIcon, Shield, Database, Users,
    MessageSquare, Play, CheckCircle2, Circle, Plus, Trash2, MoveUp, MoveDown, Save, X, Edit3
} from 'lucide-react';

const ICON_OPTIONS = {
    Sparkles, Layout, TerminalIcon, Shield, Database, Users, MessageSquare, Play, CheckCircle2, Circle
};

const WorkflowEditor = ({ initialPhases, availableAgents = [], onSave, onCancel }) => {
    const [phases, setPhases] = useState(initialPhases || []);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [tempPhase, setTempPhase] = useState(null);

    const handleAddPhase = () => {
        setTempPhase({
            id: `phase-${Date.now()}`,
            label: 'New Phase',
            description: 'Phase description...',
            icon: 'Circle',
            allowedAgents: [],
            requiredArtifacts: []
        });
        setEditingIndex(phases.length); // New item index
    };

    const handleEditPhase = (index) => {
        setTempPhase({ ...phases[index] });
        setEditingIndex(index);
    };

    const handleDeletePhase = (index) => {
        const newPhases = phases.filter((_, i) => i !== index);
        setPhases(newPhases);
    };

    const handleMovePhase = (index, direction) => {
        if (direction === 'up' && index > 0) {
            const newPhases = [...phases];
            [newPhases[index], newPhases[index - 1]] = [newPhases[index - 1], newPhases[index]];
            setPhases(newPhases);
        }
        if (direction === 'down' && index < phases.length - 1) {
            const newPhases = [...phases];
            [newPhases[index], newPhases[index + 1]] = [newPhases[index + 1], newPhases[index]];
            setPhases(newPhases);
        }
    };

    const saveTempPhase = () => {
        if (editingIndex >= phases.length) {
            // Adding new
            setPhases([...phases, tempPhase]);
        } else {
            // Updating existing
            const newPhases = [...phases];
            newPhases[editingIndex] = tempPhase;
            setPhases(newPhases);
        }
        setEditingIndex(-1);
        setTempPhase(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Customize Workflow</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {phases.map((phase, index) => {
                        const Icon = ICON_OPTIONS[phase.icon] || Circle;
                        const isEditing = editingIndex === index;

                        return (
                            <div key={phase.id} className={`border rounded-xl p-4 transition-all ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Phase Name</label>
                                                <input
                                                    type="text"
                                                    value={tempPhase.label}
                                                    onChange={e => setTempPhase({ ...tempPhase, label: e.target.value, id: e.target.value.replace(/\s+/g, '-') })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Icon</label>
                                                <select
                                                    value={tempPhase.icon}
                                                    onChange={e => setTempPhase({ ...tempPhase, icon: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    {Object.keys(ICON_OPTIONS).map(iconName => (
                                                        <option key={iconName} value={iconName}>{iconName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                            <textarea
                                                value={tempPhase.description}
                                                onChange={e => setTempPhase({ ...tempPhase, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Allowed Agents</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                                                {availableAgents.map(agent => (
                                                    <label key={agent.id} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(tempPhase.allowedAgents || []).includes(agent.id)}
                                                            onChange={e => {
                                                                const current = tempPhase.allowedAgents || []; // Fallback to empty
                                                                // Use legacy logic (legacy phases might store agent assigned to phase via agent.phase property, but here we explicitly store allowedAgents on phase)
                                                                // Actually for NEW phases we store allowedAgents.
                                                                if (e.target.checked) {
                                                                    setTempPhase({ ...tempPhase, allowedAgents: [...current, agent.id] });
                                                                } else {
                                                                    setTempPhase({ ...tempPhase, allowedAgents: current.filter(id => id !== agent.id) });
                                                                }
                                                            }}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-xs text-slate-700 truncate">{agent.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Required Artifacts (comma separated)</label>
                                            <input
                                                type="text"
                                                value={(tempPhase.requiredArtifacts || []).join(', ')}
                                                onChange={e => setTempPhase({ ...tempPhase, requiredArtifacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g. implementation_plan.md, design.md"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => setEditingIndex(-1)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                            <button onClick={saveTempPhase} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{phase.label}</h3>
                                                <p className="text-xs text-slate-500">{phase.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button onClick={() => handleMovePhase(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30">
                                                <MoveUp className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleMovePhase(index, 'down')} disabled={index === phases.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30">
                                                <MoveDown className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-4 bg-slate-200 mx-1" />
                                            <button onClick={() => handleEditPhase(index)} className="p-1.5 hover:bg-indigo-50 rounded text-indigo-600">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeletePhase(index)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {editingIndex === phases.length && (
                        <div className="border border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 rounded-xl p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Phase Name</label>
                                    <input
                                        type="text"
                                        value={tempPhase?.label || ''}
                                        onChange={e => setTempPhase({ ...tempPhase, label: e.target.value, id: e.target.value.replace(/\s+/g, '-') })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Icon</label>
                                    <select
                                        value={tempPhase?.icon || 'Circle'}
                                        onChange={e => setTempPhase({ ...tempPhase, icon: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {Object.keys(ICON_OPTIONS).map(iconName => (
                                            <option key={iconName} value={iconName}>{iconName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                <textarea
                                    value={tempPhase?.description || ''}
                                    onChange={e => setTempPhase({ ...tempPhase, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Allowed Agents</label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                                    {availableAgents.map(agent => (
                                        <label key={agent.id} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(tempPhase?.allowedAgents || []).includes(agent.id)}
                                                onChange={e => {
                                                    const current = tempPhase?.allowedAgents || [];
                                                    if (e.target.checked) {
                                                        setTempPhase({ ...tempPhase, allowedAgents: [...current, agent.id] });
                                                    } else {
                                                        setTempPhase({ ...tempPhase, allowedAgents: current.filter(id => id !== agent.id) });
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs text-slate-700 truncate">{agent.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Required Artifacts (comma separated)</label>
                                <input
                                    type="text"
                                    value={(tempPhase?.requiredArtifacts || []).join(', ')}
                                    onChange={e => setTempPhase({ ...tempPhase, requiredArtifacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. implementation_plan.md, design.md"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => { setEditingIndex(-1); setTempPhase(null); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                <button onClick={saveTempPhase} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Phase</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
                    <button
                        onClick={handleAddPhase}
                        disabled={editingIndex !== -1}
                        className="flex items-center space-x-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Phase</span>
                    </button>
                    <div className="flex space-x-3">
                        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button onClick={() => onSave(phases)} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center space-x-2">
                            <Save className="w-4 h-4" />
                            <span>Save Workflow</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowEditor;
