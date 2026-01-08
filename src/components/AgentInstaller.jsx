import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileArchive } from 'lucide-react';

const AgentInstaller = ({ onClose, onInstalled }) => {
    const [installing, setInstalling] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [zipPath, setZipPath] = useState('');

    const handleInstall = async () => {
        if (!zipPath) return;
        setInstalling(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3001/api/agents/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipPath })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                onInstalled();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Hire New Agent</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    {!success ? (
                        <div className="space-y-6">
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="h-8 w-8 text-indigo-600" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">Select Agent Bundle</p>
                                <p className="text-xs text-slate-400 mt-1">Select a local path to the agent zip</p>

                                <input
                                    type="text"
                                    value={zipPath}
                                    onChange={(e) => setZipPath(e.target.value)}
                                    placeholder="/absolute/path/to/agent.zip"
                                    className="mt-6 w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium animate-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleInstall}
                                disabled={!zipPath || installing}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
                            >
                                {installing ? 'Hiring...' : 'Install Agent Persona'}
                            </button>
                        </div>
                    ) : (
                        <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95">
                            <div className="p-6 bg-green-50 rounded-full mb-6">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Agent Ready!</h3>
                            <p className="text-slate-500 text-sm mb-8">The new agent persona has been added to your foundry.</p>
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentInstaller;
