import React, { useState, useEffect } from 'react';
import { X, Save, Key, ShieldCheck, Info, Folder } from 'lucide-react';

const SettingsView = ({ onClose }) => {
    const [config, setConfig] = useState({ cursorKey: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to load config', err));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('http://localhost:3001/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Global Settings</h2>
                            <p className="text-slate-500 font-medium mt-1">Configure your environment defaults</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-slate-700">
                                <Key className="h-5 w-5 text-indigo-600" />
                                <span className="font-bold">Cursor API Key</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                This key will be used by default for all projects to run prompts automatically via the Cursor CLI.
                            </p>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={config.cursorKey}
                                    onChange={(e) => setConfig({ ...config, cursorKey: e.target.value })}
                                    placeholder="sk-..."
                                    className="w-full pl-4 pr-12 py-4 border-2 border-slate-100 rounded-2xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-slate-50/50 transition-all font-mono"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <ShieldCheck className={`h-5 w-5 ${config.cursorKey ? 'text-green-500' : 'text-slate-300'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-slate-700">
                                <Folder className="h-5 w-5 text-indigo-600" />
                                <span className="font-bold">Default Project Storage Path</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                Specify where projects should be generated.
                                <span className="text-indigo-600 font-bold ml-1">Tip:</span> Use <code>/app/projects</code> for container volume or a mounted path for the host.
                            </p>
                            <input
                                type="text"
                                value={config.defaultProjectPath}
                                onChange={(e) => setConfig({ ...config, defaultProjectPath: e.target.value })}
                                placeholder="/app/projects"
                                className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-slate-50/50 transition-all font-mono"
                            />
                        </div>

                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start space-x-4">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-indigo-100">
                                <Info className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-800 text-sm">Security Note</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    Your key is stored locally in the `config/global.json` file on the server. Never commit this file to public repositories.
                                </p>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="pt-6 flex justify-end space-x-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
