import React, { useState, useMemo } from 'react';
import {
    CheckCircle2, Circle, ArrowRight, Play,
    Layout, Database, Terminal as TerminalIcon,
    Shield, Users, Sparkles, MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PHASES = [
    { id: 'Inception', icon: Sparkles, label: 'Inception', description: 'Define scope & requirements' },
    { id: 'Design', icon: Layout, label: 'Design', description: 'Architecture & Schemas' },
    { id: 'Implementation', icon: TerminalIcon, label: 'Implementation', description: 'Code Construction' },
    { id: 'Verification', icon: Shield, label: 'Verification', description: 'Testing & Security' }
];

const WorkflowOrchestrator = ({ agents, project, onRunPrompt, onConsultAgent }) => {
    const [activePhase, setActivePhase] = useState('Inception');

    const phaseAgents = useMemo(() => {
        return agents.filter(a => (a.phase || 'Implementation') === activePhase);
    }, [agents, activePhase]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Phase Stepper */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                {PHASES.map((phase, index) => {
                    const Icon = phase.icon;
                    const isActive = activePhase === phase.id;
                    const isPast = PHASES.findIndex(p => p.id === activePhase) > index;

                    return (
                        <button
                            key={phase.id}
                            onClick={() => setActivePhase(phase.id)}
                            className={`flex flex-col items-center group relative min-w-[100px] ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all
                                ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                                    isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}
                            `}>
                                {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs font-bold ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>{phase.label}</span>
                            {index < PHASES.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-100 -z-10 transform translate-x-1/2" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Phase Header */}
                    <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h2 className="text-2xl font-bold mb-2 relative z-10">{PHASES.find(p => p.id === activePhase).label} Phase</h2>
                        <p className="text-indigo-200 text-sm relative z-10 max-w-lg">
                            {PHASES.find(p => p.id === activePhase).description}. Assign tasks to the specialized agents below to advance your project.
                        </p>
                    </div>

                    {/* Agents Grid */}
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                        {phaseAgents.map(agent => (
                            <div key={agent.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-200 transition-all hover:shadow-md group flex flex-col h-full">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{agent.name}</h3>
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-medium inline-block mt-0.5">
                                                {agent.phase}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onConsultAgent(agent)}
                                        className="p-1.5 hover:bg-indigo-50 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2 h-8">
                                    {agent.description}
                                </p>

                                <div className="pt-3 border-t border-slate-50 mt-auto flex space-x-2">
                                    {activePhase === 'Inception' && agent.id === 'pm-framework' ? (
                                        <button
                                            onClick={() => onConsultAgent(agent, "I need you to define the project scope. Please analyze the requirements and generate a detailed project briefing including objectives, key features, and user personas.")}
                                            className="flex-1 bg-indigo-600 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1.5 active:scale-95 shadow-md shadow-indigo-100"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            <span>Define Scope</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onConsultAgent(agent)}
                                            className="flex-1 bg-slate-900 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            <span>Consult</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {phaseAgents.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-slate-900 font-bold mb-1">No Agents Assigned</h3>
                            <p className="text-slate-500 text-xs">There are no agents in your team for this phase yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowOrchestrator;
