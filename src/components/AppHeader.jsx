import React from 'react';
import { Rocket, Settings, PackagePlus, Plus, Layout, Cpu } from 'lucide-react';

const AppHeader = ({ onOpenSettings, onOpenInstaller, onNewProject, onOpenWorkflows, onOpenAgentStudio, showNewProjectBtn = true }) => {
    return (
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 h-16">
            <div className="w-full px-6 h-full flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2 rounded-xl shadow-lg shadow-indigo-200">
                        <Rocket className="text-white h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-800">YABP</span>
                </div>
                <div className="flex items-center space-x-4">
                    {onOpenSettings && (
                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    )}
                    {onOpenWorkflows && (
                        <button
                            onClick={onOpenWorkflows}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Workflow Templates"
                        >
                            <Layout className="h-5 w-5" />
                        </button>
                    )}
                    {onOpenAgentStudio && (
                        <button
                            onClick={onOpenAgentStudio}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Agent Studio"
                        >
                            <Cpu className="h-5 w-5" />
                        </button>
                    )}
                    {showNewProjectBtn && onNewProject && (
                        <button
                            onClick={onNewProject}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold flex items-center shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AppHeader;
