
import React from 'react';
import { X, CheckCircle2, Circle, Sparkles, Layout, Terminal, Shield, Database, Users, FileText, Cloud, Zap } from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../config/workflowTemplates';

const ICON_MAP = {
    Sparkles, Layout, Terminal, Shield, Database, Users, FileText, Cloud, Zap
};

const WorkflowTemplateViewer = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Workflow Templates</h2>
                        <p className="text-slate-500 font-medium">Explore standard development lifecycles for your projects</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {WORKFLOW_TEMPLATES.map(template => {
                            const Icon = ICON_MAP[template.icon] || Layout;
                            return (
                                <div key={template.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-200 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{template.phases.length} Phases</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed mb-6 h-10 line-clamp-2">
                                        {template.description}
                                    </p>

                                    {/* Phases Preview */}
                                    <div className="space-y-3 mb-6">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phases</div>
                                        <div className="bg-slate-50 rounded-xl p-3 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
                                            {template.phases.map((phase, i) => {
                                                const PhaseIcon = ICON_MAP[phase.icon] || Circle;
                                                return (
                                                    <div key={phase.id} className="flex items-center flex-shrink-0">
                                                        <div className="flex flex-col items-center space-y-1" title={phase.description}>
                                                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                                                <PhaseIcon className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-slate-500">{phase.label}</span>
                                                        </div>
                                                        {i < template.phases.length - 1 && (
                                                            <div className="w-4 h-[2px] bg-slate-200 mx-2 mb-4" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Recommended Agents */}
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recommended Team</div>
                                        <div className="flex flex-wrap gap-2">
                                            {template.recommendedAgents.map(agentId => (
                                                <span key={agentId} className="text-[10px] bg-slate-100/80 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-mono">
                                                    {agentId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowTemplateViewer;
