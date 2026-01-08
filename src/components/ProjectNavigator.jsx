import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Folder, File, ChevronRight, FileCode, FileText, ArrowLeft, ArrowRight,
    ExternalLink, Play, Terminal as TerminalIcon, Send, Sparkles,
    History, Loader2, CheckCircle2, AlertCircle, Save, Edit3, Eye,
    Bold, Italic, List, Link, Code, Users, MessageSquare, Bot, X, Plus, Layout,
    Trash2, PanelRight, PanelRightClose, MoreHorizontal
} from 'lucide-react';
import AppHeader from './AppHeader';
import WorkflowOrchestrator from './WorkflowOrchestrator';
import WorkflowEditor from './WorkflowEditor';
import MermaidRenderer from './MermaidRenderer';
import ConfirmationDialog from './ConfirmationDialog';

const AgentExecutionVisual = ({ agent, logs }) => {
    const lastLog = logs.length > 0 ? logs[logs.length - 1].text : 'Initializing agent specialized context...';

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-100 rounded-full blur-[120px] opacity-30 animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-100 rounded-full blur-[120px] opacity-30 animate-pulse delay-700" />

            <div className="relative z-10 flex flex-col items-center max-w-2xl px-8 text-center">
                {/* The Core Visual */}
                <div className="relative mb-20">
                    {/* Ring Animations */}
                    <div className="absolute inset-0 scale-[2.5] rounded-full border border-indigo-100 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 scale-[2.2] rounded-full border border-indigo-50 animate-[spin_15s_linear_infinite_reverse]" />

                    {/* The Brain/Agent Core */}
                    <div className="h-32 w-32 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl relative group">
                        <div className="absolute -inset-4 bg-indigo-500/20 rounded-[48px] blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
                        <div className="text-5xl drop-shadow-lg scale-110">
                            {agent?.icon || <TerminalIcon className="h-12 w-12" />}
                        </div>
                    </div>

                    {/* Data Particles */}
                    <div className="absolute -top-4 -right-4 h-4 w-4 bg-indigo-400 rounded-full animate-bounce delay-100" />
                    <div className="absolute -bottom-2 -left-6 h-3 w-3 bg-violet-400 rounded-full animate-bounce delay-300" />
                    <div className="absolute top-1/2 -right-12 h-2 w-2 bg-indigo-300 rounded-full animate-bounce delay-500" />
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Agent Active</span>
                    </div>

                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        {agent?.name || 'Unified Agent'} is <span className="text-indigo-600">Working</span>
                    </h2>
                </div>

                {/* Progress Indicators */}
                <div className="mt-16 w-full max-w-md space-y-6">
                    <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}} />
        </div>
    );
};

const FileTree = ({ items, onFileSelect, onExecuteFile, onDeleteFile, selectedFile, level = 0 }) => {
    const [expanded, setExpanded] = useState({});
    const toggle = (path) => setExpanded(prev => ({ ...prev, [path]: !prev[path] }));

    return (
        <div className="select-none">
            {items.map(item => (
                <div key={item.path}>
                    <div
                        className={`group flex items-center py-1.5 px-3 hover:bg-slate-100 cursor-pointer rounded-xl transition-all text-sm ${item.path === selectedFile
                            ? 'bg-indigo-50 text-indigo-600 font-bold ring-1 ring-indigo-500/10'
                            : item.type === 'file' ? 'text-slate-600' : 'font-bold text-slate-900'
                            }`}
                        style={{ paddingLeft: `${level * 16 + 12}px` }}
                        onClick={() => item.type === 'directory' ? toggle(item.path) : onFileSelect(item.path)}
                    >
                        {item.type === 'directory' ? (
                            <Folder className={`h-4 w-4 mr-2.5 ${expanded[item.path] ? 'text-indigo-500 fill-indigo-50' : 'text-slate-400'}`} />
                        ) : (
                            item.name.endsWith('.md') ? <FileText className="h-4 w-4 mr-2.5 text-blue-500" /> : <FileCode className="h-4 w-4 mr-2.5 text-green-500" />
                        )}
                        <span className="truncate flex-1">{item.name}</span>
                        {item.executable && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onExecuteFile(item.path); }}
                                className="p-1 hover:bg-green-100 rounded-lg text-green-600 transition-all opacity-0 group-hover:opacity-100"
                                title="Execute this artifact as a prompt"
                            >
                                <Play className="h-3 w-3 fill-current" />
                            </button>
                        )}
                        {item.type === 'file' && onDeleteFile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteFile(item.path); }}
                                className="p-1 hover:bg-red-100 rounded-lg text-red-500 transition-all opacity-0 group-hover:opacity-100 mx-1"
                                title="Delete File"
                            >
                                <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                        )}
                        {item.type === 'directory' && (
                            <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform duration-200 ${expanded[item.path] ? 'rotate-90 text-indigo-500' : 'text-slate-300'}`} />
                        )}
                    </div>
                    {item.type === 'directory' && expanded[item.path] && (
                        <FileTree items={item.children} onFileSelect={onFileSelect} onExecuteFile={onExecuteFile} onDeleteFile={onDeleteFile} selectedFile={selectedFile} level={level + 1} />
                    )}
                </div>
            ))}
        </div>
    );
};

const ProjectNavigator = ({ onBack }) => {
    const { projectName } = useParams();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('workflow'); // workflow, explorer, prompts
    const [onTheFlyPrompt, setOnTheFlyPrompt] = useState('');
    const [executing, setExecuting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [generatedPrompts, setGeneratedPrompts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [projectConfig, setProjectConfig] = useState(null);
    const [allAgents, setAllAgents] = useState([]);
    const [selectedAgentForModal, setSelectedAgentForModal] = useState(null);
    const [agentPrompt, setAgentPrompt] = useState('');
    const [executingAgent, setExecutingAgent] = useState(null);
    const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
    const [addingAgent, setAddingAgent] = useState(false);
    const [simulationMode, setSimulationMode] = useState(true);

    // Code Comments Logic (Phase 10)
    const [comments, setComments] = useState({}); // { "src/App.jsx": [{ line: 1, text: "fix this", id: 123 }] }
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [activeCommentLine, setActiveCommentLine] = useState(null); // Line number being commented on
    const [newCommentText, setNewCommentText] = useState('');
    const [replyTexts, setReplyTexts] = useState({}); // { commentId: "text" }
    const [showMdSource, setShowMdSource] = useState(false); // Toggle for MD files
    const [hiddenSystemPrompt, setHiddenSystemPrompt] = useState(''); // Hidden prompt for agent
    const [pendingProcessingComments, setPendingProcessingComments] = useState([]); // IDs of comments to mark processed

    // Navigation History (Phase 23)
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Dialog State
    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isAlert: false,
        onConfirm: null
    });

    const [isWorkflowEditorOpen, setIsWorkflowEditorOpen] = useState(false);

    const handleSaveWorkflow = async (phases) => {
        try {
            const updatedConfig = {
                ...projectConfig,
                workflow: {
                    ...(projectConfig?.workflow || {}),
                    phases
                }
            };

            await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflow: updatedConfig.workflow })
            });

            setProjectConfig(updatedConfig);
            setIsWorkflowEditorOpen(false);
            showAlert('Success', 'Workflow updated successfully!', 'success');
        } catch (e) {
            console.error('Failed to save workflow', e);
            showAlert('Error', 'Failed to save workflow configuration');
        }
    };

    // Helper to close dialog
    const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

    // Helper to show alert
    const showAlert = (title, message, type = 'danger') => {
        setDialogConfig({
            isOpen: true,
            title,
            message,
            type,
            isAlert: true,
            onConfirm: null
        });
    };

    useEffect(() => {
        if (selectedFile && history[historyIndex] !== selectedFile) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(selectedFile);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [selectedFile, history, historyIndex]);

    const handleNavigate = (path) => {
        // Resolve relative paths
        if (!path.startsWith('/') && selectedFile) {
            const currentDir = selectedFile.substring(0, selectedFile.lastIndexOf('/'));
            // Simple path resolution (handling ../ is tricky without path module in browser, but basic relative works)
            // For now, assume simple relative or sibling
            path = currentDir ? `${currentDir}/${path}` : path;
        }
        handleFileSelect(path);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            handleFileSelect(history[prevIndex], false);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            handleFileSelect(history[nextIndex], false);
        }
    };

    const handleLinkClick = (href) => {
        // Prevent default navigation for relative links
        if (href.startsWith('http')) return false; // Let default behavior handle external links

        if (selectedFile) {
            // Resolve relative path
            let currentDir = selectedFile.substring(0, selectedFile.lastIndexOf('/'));
            // Handle ../ resolution manually if complex, but simple join works for now
            // Or better: Use URL constructor hack 
            // const base = 'http://mockroot' + (currentDir ? '/' + currentDir : '');
            // const full = new URL(href, base).pathname.replace('/mockroot/', '');

            // Simple approach:
            let targetPath = href;
            if (!href.startsWith('/')) {
                targetPath = currentDir ? `${currentDir}/${href}` : href;
            }
            // Clean up ./
            targetPath = targetPath.replace(/\.\//g, '');

            handleFileSelect(targetPath);
            return true; // We handled it
        }
        return false;
    };

    useEffect(() => {
        if (projectName) {
            loadComments();
        }
    }, [projectName]);

    const loadComments = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/projects/${projectName}/file?path=.yabp/comments.json`);
            if (res.ok) {
                const data = await res.json();
                setComments(JSON.parse(data.content));
            }
        } catch (e) {
            console.log("No existing comments found or new project.");
        }
    };

    const saveCommentsToBackend = async (newComments) => {
        setComments(newComments);
        try {
            await fetch(`http://localhost:3001/api/projects/${projectName}/file`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: '.yabp/comments.json',
                    content: JSON.stringify(newComments, null, 2)
                })
            });
        } catch (e) {
            console.error("Failed to save comments", e);
        }
    };

    const handleAddComment = (line, text) => {
        if (!text.trim()) return;
        const fileComments = comments[selectedFile] || [];
        const newComment = {
            id: Date.now(),
            line,
            text,
            timestamp: Date.now(),
            status: 'open',
            replies: []
        };
        const updated = { ...comments, [selectedFile]: [...fileComments, newComment] };
        saveCommentsToBackend(updated);
        setNewCommentText('');
        setActiveCommentLine(null);
        setIsRightPanelOpen(true);
    };

    const handleReply = (commentId, text) => {
        if (!text.trim()) return;
        const fileComments = comments[selectedFile] || [];
        const updatedFileComments = fileComments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    replies: [...(c.replies || []), { id: Date.now(), text, timestamp: Date.now() }]
                };
            }
            return c;
        });
        const updated = { ...comments, [selectedFile]: updatedFileComments };
        saveCommentsToBackend(updated);
    };

    const handleApprove = (commentId) => {
        const fileComments = comments[selectedFile] || [];
        const updatedFileComments = fileComments.map(c =>
            c.id === commentId ? { ...c, status: 'locked' } : c
        );
        const updated = { ...comments, [selectedFile]: updatedFileComments };
        saveCommentsToBackend(updated);
    };

    const handleDeleteFileRequest = (filePath) => {
        setDialogConfig({
            isOpen: true,
            title: 'Delete File',
            message: `Are you sure you want to delete ${filePath}? It will be moved to .deleted folder.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: () => performDeleteFile(filePath)
        });
    };

    const performDeleteFile = async (filePath) => {

        try {
            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/file?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                // Remove from local state immediately for snappy feel, or reload
                loadFiles();
                if (selectedFile === filePath) {
                    setSelectedFile(null);
                    setFileContent('');
                }
            } else {
                showAlert('Error', `Error deleting file: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            showAlert('Error', 'Failed to delete file');
        }
    };

    const handleDelete = (commentId, replyId = null) => {
        const fileComments = comments[selectedFile] || [];
        let updatedFileComments;

        if (replyId) {
            // Delete reply
            updatedFileComments = fileComments.map(c => {
                if (c.id === commentId) {
                    return { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) };
                }
                return c;
            });
        } else {
            // Delete top-level comment
            updatedFileComments = fileComments.filter(c => c.id !== commentId);
        }

        const updated = { ...comments, [selectedFile]: updatedFileComments };
        saveCommentsToBackend(updated);
    };
    const consoleEndRef = useRef(null);

    const scrollToBottom = () => consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { if (activeTab === 'console') scrollToBottom(); }, [logs, activeTab]);

    const loadFiles = useCallback(() => {
        fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/files`)
            .then(res => res.json())
            .then(data => { setFiles(data); setLoading(false); });
    }, [projectName]);

    useEffect(() => {
        loadFiles();
        fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}`)
            .then(res => res.json())
            .then(data => setProjectConfig(data.config));

        fetch(`http://localhost:3001/api/agents`)
            .then(res => res.json())
            .then(data => setAllAgents(data));

        fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/prompts`)
            .then(res => res.json())
            .then(data => setGeneratedPrompts(data));
    }, [projectName, loadFiles]);

    // Seamless Real-Time File Sync (Phase 57)
    useEffect(() => {
        // Poll more frequently while executing, slightly slower when idle
        const intervalTime = executing ? 2000 : 5000;

        const interval = setInterval(() => {
            loadFiles();
        }, intervalTime);

        return () => clearInterval(interval);
    }, [executing, loadFiles]);

    const handleFileSelect = async (path, runHistory = true) => {
        if (runHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(path);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        setSelectedFile(path);
        setIsEditing(false);
        const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/file?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        setFileContent(data.content);
        setEditedContent(data.content);
    };

    const handleSaveFile = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/file`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: selectedFile, content: editedContent })
            });
            if (res.ok) {
                setFileContent(editedContent);
                setIsEditing(false);
                loadFiles(); // Refresh after save
            }
        } catch (e) { console.error('Failed to save file', e); }
        finally { setSaving(false); }
    };

    const handleExecuteFile = async (path) => {
        setExecuting(true);
        setActiveTab('explorer');
        try {
            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/file?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            await runPrompt(data.content);
        } catch (e) { console.error('Failed to execute file', e); }
    };

    const applyMarkdown = (prefix, suffix = '') => {
        const textarea = document.getElementById('md-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editedContent;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);
        setEditedContent(`${before}${prefix}${selected}${suffix}${after}`);
        // Refocus after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + suffix.length);
        }, 0);
    };

    const runPrompt = async (promptText) => {
        setExecuting(true);
        setActiveTab('explorer');
        setExecutingAgent({ name: 'Cursor CLI', role: 'Direct Execution', icon: <TerminalIcon className="h-6 w-6" /> });
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type: 'info', text: `[${timestamp}] Initiating Cursor CLI execution (${simulationMode ? 'Simulation' : 'Real'})...`, prompt: promptText }]);

        try {
            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/run-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText, simulationMode })
            });
            const data = await res.json();

            if (data.success) {
                setLogs(prev => [...prev,
                { type: 'success', text: `[${new Date().toLocaleTimeString()}] Interpolated Prompt: ${data.interpolatedPrompt}` },
                { type: 'success', text: `[${new Date().toLocaleTimeString()}] ${data.message}` }
                ]);
                loadFiles(); // REFRESH FILE TREE ON SUCCESS
            } else {
                setLogs(prev => [...prev,
                { type: 'error', text: `[${new Date().toLocaleTimeString()}] Error: ${data.error}` },
                ...(data.output ? [{ type: 'error', text: data.output }] : [])
                ]);
            }
        } catch (e) {
            setLogs(prev => [...prev, { type: 'error', text: `[${new Date().toLocaleTimeString()}] Failed to reach backend: ${e.message}` }]);
        } finally {
            setExecuting(false);
        }
    };



    const handleOpenAgentModal = (agent, initialPrompt = '') => {
        setSelectedAgentForModal(agent);
        setAgentPrompt(initialPrompt);
    };

    // Phase 47: Task Guard
    const handleAssignTaskRequest = () => {
        const fileComments = comments[selectedFile] || [];
        const pendingComments = fileComments.filter(c => !c.processed && c.status === 'open');

        if (pendingComments.length > 0) {
            setDialogConfig({
                isOpen: true,
                title: 'Pending Comments detected',
                message: `There are ${pendingComments.length} pending comments for this file. Are you sure you want to proceed without addressing them?`,
                type: 'warning',
                confirmText: 'Yes, Proceed',
                onConfirm: () => {
                    closeDialog();
                    runAgentSpecificPrompt();
                }
            });
        } else {
            runAgentSpecificPrompt();
        }
    };

    const runAgentSpecificPrompt = async () => {
        if (!selectedAgentForModal) return;
        const promptToRun = `${hiddenSystemPrompt}\n\n${agentPrompt}`;
        const agentId = selectedAgentForModal.id;

        setSelectedAgentForModal(null);
        setAgentPrompt('');
        setHiddenSystemPrompt('');

        setExecuting(true);
        setExecutingAgent(selectedAgentForModal);
        setActiveTab('explorer');
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type: 'info', text: `[${timestamp}] Delegating task to ${selectedAgentForModal.name} (${simulationMode ? 'Simulation' : 'Real'})...`, prompt: promptToRun }]);

        try {
            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/run-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptToRun, agentId: agentId, simulationMode })
            });
            const data = await res.json();

            if (data.success) {
                // Mark comments as processed ONLY if not simulation
                if (!simulationMode && pendingProcessingComments.length > 0) {
                    const fileComments = comments[selectedFile] || [];
                    const updatedFileComments = fileComments.map(c =>
                        pendingProcessingComments.includes(c.id) ? { ...c, processed: true } : c
                    );
                    const updated = { ...comments, [selectedFile]: updatedFileComments };
                    saveCommentsToBackend(updated);
                    setPendingProcessingComments([]); // Reset
                }

                setLogs(prev => [...prev,
                { type: 'success', text: `[${new Date().toLocaleTimeString()}] ${selectedAgentForModal.name} completed the task.` },
                { type: 'success', text: `[${new Date().toLocaleTimeString()}] ${data.message}` }
                ]);
                // Refresh file tree after a short delay to ensure files are written
                setTimeout(() => {
                    loadFiles();
                }, 500);
            } else {
                setLogs(prev => [...prev,
                { type: 'error', text: `[${new Date().toLocaleTimeString()}] ${selectedAgentForModal.name} encountered an error: ${data.error}` }
                ]);
            }
        } catch (e) {
            setLogs(prev => [...prev, { type: 'error', text: `[${new Date().toLocaleTimeString()}] Failed to reach backend: ${e.message}` }]);
        } finally {
            setExecuting(false);
        }
    };

    const handleAddAgent = async (agentId) => {
        setAddingAgent(true);
        try {
            const currentAgents = projectConfig.agents || [];
            const newAgents = [...currentAgents, agentId];

            const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agents: newAgents })
            });

            if (res.ok) {
                // Refresh everything
                fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}`)
                    .then(res => res.json())
                    .then(data => setProjectConfig(data.config));

                fetch(`http://localhost:3001/api/projects/${encodeURIComponent(projectName)}/prompts`)
                    .then(res => res.json())
                    .then(data => setGeneratedPrompts(data));

                loadFiles();
                setIsAddAgentOpen(false);
            }
        } catch (e) {
            console.error('Failed to add agent', e);
        } finally {
            setAddingAgent(false);
        }
    };

    // Find current file object to check for executable flag
    const findItem = (items, path) => {
        for (const item of items) {
            if (item.path === path) return item;
            if (item.children) {
                const found = findItem(item.children, path);
                if (found) return found;
            }
        }
        return null;
    };
    const currentFileItem = selectedFile ? findItem(files, selectedFile) : null;

    // Resize Logic
    const [sidebarWidth, setSidebarWidth] = useState(416);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = mouseMoveEvent.clientX;
            if (newWidth > 150 && newWidth < 800) { // Min and Max width constraints
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);

    // Context-Aware Agent Recommendation Logic
    const getRecommendedAgents = (filePath, agents) => {
        if (!filePath || !agents) return [];
        const lowerPath = filePath.toLowerCase();

        // Define relevant keywords for roles based on file path
        let targetRoles = [];
        if (lowerPath.includes('docs/requirements') || lowerPath.includes('user_stories')) {
            targetRoles = ['architect', 'qa', 'test'];
        } else if (lowerPath.includes('docs/architecture') || lowerPath.includes('design')) {
            targetRoles = ['developer', 'engineer', 'devops'];
        } else if (lowerPath.includes('docs/qa') || lowerPath.includes('test_plan')) {
            targetRoles = ['developer', 'engineer'];
        } else if (lowerPath.includes('infrastructure') || lowerPath.includes('terraform') || lowerPath.includes('docker')) {
            targetRoles = ['devops'];
        } else if (lowerPath.endsWith('.md')) {
            targetRoles = ['product manager', 'analyst', 'architect'];
        } else {
            // Code files
            if (lowerPath.endsWith('.js') || lowerPath.endsWith('.jsx') || lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) targetRoles = ['frontend', 'node', 'react', 'vue', 'angular'];
            if (lowerPath.endsWith('.java')) targetRoles = ['java', 'backend'];
            if (lowerPath.endsWith('.py')) targetRoles = ['python', 'backend'];
            if (lowerPath.endsWith('.go')) targetRoles = ['go', 'backend'];
        }

        return agents.filter(a => {
            const agentText = (a.name + ' ' + (a.category || '') + ' ' + (a.description || '')).toLowerCase();
            return targetRoles.some(r => agentText.includes(r));
        });
    };

    const handleProcessWithAgent = (agent) => {
        setIsProcessMenuOpen(false);
        const docsPath = agent.docs_folder ? `docs/${agent.docs_folder}/` : `docs/`;
        let systemPrompt = `**CRITICAL: LANGUAGE REQUIREMENT**: All output, documentation, comments, and file content MUST be in **ENGLISH**. This is non-negotiable unless the user explicitly asks for another language in their prompt.\n\nI am currently viewing the file \`${selectedFile}\`. \n\nPlease analyze this artifact data and perform your role-specific actions based on its content. \n\n**CRITICAL INSTRUCTION**: You MUST save your analysis, findings, or code changes to the file system. \n- If you are providing a review, audit, or plan: **CREATE A NEW MARKDOWN FILE** inside \`${docsPath}\` with your report. Do not just output text to the console.\n- If you are writing code: Create or update the actual source files.`;

        let commentsToProcess = [];

        // Inject User Comments Context (LOCKED AND UNPROCESSED ONLY)
        if (comments[selectedFile] && comments[selectedFile].length > 0) {
            const lockedComments = comments[selectedFile].filter(c => c.status === 'locked' && !c.processed);
            if (lockedComments.length > 0) {
                systemPrompt += `\n\n### 💬 USER CONTEXT & COMMENTS\nThe user has provided specific APPROVED comments/requirements for this file. You MUST address these notes:\n`;
                lockedComments.sort((a, b) => a.line - b.line).forEach(c => {
                    systemPrompt += `- [Line ${c.line}]: "${c.text}"\n`;
                    if (c.replies && c.replies.length > 0) {
                        c.replies.forEach(r => systemPrompt += `  - Reply: "${r.text}"\n`);
                    }
                    commentsToProcess.push(c.id);
                });
            }
        }

        setHiddenSystemPrompt(systemPrompt);
        setPendingProcessingComments(commentsToProcess);
        handleOpenAgentModal(agent, ''); // Open with empty user prompt, system prompt is hidden
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden font-sans" onMouseUp={stopResizing}>
            {/* Global Header */}
            <AppHeader
                onNewProject={() => { }} // Disabled or navigates away
                showNewProjectBtn={false}
                onOpenSettings={() => { }}
                onOpenInstaller={() => { }}
            />

            <div className="flex-1 flex overflow-hidden pt-16">
                {/* Sidebar */}
                <div
                    className="border-r border-slate-200 bg-white flex flex-col shadow-sm relative group/sidebar"
                    style={{ width: sidebarWidth, minWidth: sidebarWidth }}
                >
                    {/* Resize Handle */}
                    <div
                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 opacity-0 group-hover/sidebar:opacity-100 peer-hover:opacity-100 active:opacity-100 active:bg-indigo-600"
                        onMouseDown={startResizing}
                    />
                    <div className="p-6 border-b border-slate-50 flex items-center space-x-3">
                        <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-90">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-extrabold text-slate-800 truncate text-lg tracking-tight">{projectName}</h2>
                            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 shadow-sm shadow-green-100 animate-pulse" />
                                Active Project
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="p-3 bg-slate-50/50 flex space-x-1 mx-4 mt-4 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setActiveTab('workflow')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${activeTab === 'workflow' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Layout className="h-3.5 w-3.5" /> <span>Workflow</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('explorer')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${activeTab === 'explorer' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Folder className="h-3.5 w-3.5" /> <span>Files</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${activeTab === 'prompts' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <TerminalIcon className="h-3.5 w-3.5" /> <span>Prompts</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar mt-2">
                        {activeTab === 'explorer' ? (
                            loading ? (
                                <div className="animate-pulse space-y-4 px-2">
                                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-8 bg-slate-50 rounded-xl w-full" />)}
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto">
                                        <FileTree items={files} onFileSelect={handleFileSelect} onExecuteFile={handleExecuteFile} onDeleteFile={handleDeleteFileRequest} selectedFile={selectedFile} />
                                    </div>
                                    <button
                                        onClick={loadFiles}
                                        className="mt-4 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 italic"
                                    >
                                        <History className="h-3 w-3" />
                                        <span>Sync File Tree</span>
                                    </button>
                                </div>
                            )
                        ) : activeTab === 'prompts' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                                        <TerminalIcon className="h-3 w-3 mr-1.5" /> On-the-fly execution
                                    </h4>
                                    <textarea
                                        value={onTheFlyPrompt}
                                        onChange={(e) => setOnTheFlyPrompt(e.target.value)}
                                        placeholder="Describe what to do..."
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none min-h-[120px] font-medium resize-none shadow-sm"
                                    />
                                    <button
                                        onClick={() => runPrompt(onTheFlyPrompt)}
                                        disabled={!onTheFlyPrompt || executing}
                                        className="w-full mt-3 bg-slate-900 text-white p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95"
                                    >
                                        {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Play className="h-3.5 w-3.5 mr-2 fill-white" />}
                                        Run Custom Prompt
                                    </button>
                                </div>
                            </div>
                        ) : activeTab === 'workflow' ? (
                            <WorkflowOrchestrator
                                agents={allAgents.filter(a => (projectConfig?.agents || []).includes(a.id))}
                                project={{ name: projectName, config: projectConfig }}
                                files={files}
                                onRunPrompt={runPrompt}
                                onConsultAgent={(agent, prompt) => {
                                    setSelectedAgentForModal(agent);
                                    if (prompt) setHiddenSystemPrompt(prompt); // Only set if prompt provided
                                }}
                                onEditWorkflow={() => setIsWorkflowEditorOpen(true)}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {executing ? (
                        <AgentExecutionVisual agent={executingAgent} logs={logs} />
                    ) : activeTab === 'console' ? (
                        <div className="flex-1 flex flex-col bg-slate-950 text-slate-300 font-mono text-xs overflow-hidden">
                            <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <TerminalIcon className="h-4 w-4 text-slate-500" />
                                    <span className="font-bold text-slate-400">Cursor CLI Console</span>
                                </div>
                                <div className="flex space-x-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 selection:bg-indigo-500/30">
                                {logs.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                                        <TerminalIcon className="h-12 w-12" />
                                        <p className="font-bold uppercase tracking-widest text-[10px]">No execution logs yet</p>
                                    </div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className={`flex items-start space-x-3 p-2 rounded-lg ${log.type === 'error' ? 'bg-red-500/10 text-red-400' : log.type === 'success' ? 'bg-green-500/10 text-green-400' : ''}`}>
                                        <div className="mt-0.5">
                                            {log.type === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : log.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5 opacity-30" />}
                                        </div>
                                        <div className="whitespace-pre-wrap leading-relaxed">{log.text}</div>
                                    </div>
                                ))}
                                <div ref={consoleEndRef} />
                            </div>
                            {executing && (
                                <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center space-x-3 italic text-slate-500 animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Agent is processing project changes...</span>
                                </div>
                            )}
                        </div>
                    ) : selectedFile ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-8 py-3 border-b border-slate-100 flex flex-col bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        {/* Navigation History Controls */}
                                        <div className="flex items-center space-x-0.5 mr-1 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                            <button
                                                onClick={handleBack}
                                                disabled={historyIndex <= 0}
                                                className={`p-1.5 rounded-md transition-all ${historyIndex > 0 ? 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600' : 'text-slate-300 cursor-not-allowed'}`}
                                                title="Go Back"
                                            >
                                                <ArrowLeft className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={handleForward}
                                                disabled={historyIndex >= history.length - 1}
                                                className={`p-1.5 rounded-md transition-all ${historyIndex < history.length - 1 ? 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600' : 'text-slate-300 cursor-not-allowed'}`}
                                                title="Go Forward"
                                            >
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="bg-slate-100 p-2 rounded-xl">
                                            {selectedFile.endsWith('.md') ? <FileText className="h-4 w-4 text-blue-500" /> : <FileCode className="h-4 w-4 text-green-500" />}
                                        </div>

                                        {selectedFile.endsWith('.md') && !isEditing && (
                                            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg ml-4">
                                                <button
                                                    onClick={() => setShowMdSource(false)}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center ${!showMdSource ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <Eye className="h-3 w-3 mr-1.5" /> Preview
                                                </button>
                                                <button
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center ${showMdSource ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    onClick={() => setShowMdSource(true)}
                                                >
                                                    <Code className="h-3 w-3 mr-1.5" /> Source
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Process With Agent Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsProcessMenuOpen(!isProcessMenuOpen)}
                                                className="bg-indigo-50 text-indigo-600 px-4 py-2 h-9 justify-center rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-100 transition-all flex items-center active:scale-95"
                                            >
                                                <Sparkles className="h-3.5 w-3.5 mr-2" />
                                                Process with...
                                            </button>

                                            {isProcessMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-20" onClick={() => setIsProcessMenuOpen(false)}></div>
                                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                            {(() => {
                                                                const projectAgents = allAgents.filter(a => (projectConfig?.agents || []).includes(a.id));
                                                                const recommended = getRecommendedAgents(selectedFile, projectAgents);
                                                                const otherAgents = projectAgents.filter(a => !recommended.find(r => r.id === a.id));

                                                                return (
                                                                    <>
                                                                        {recommended.length > 0 && (
                                                                            <div className="p-2 border-b border-slate-50 bg-indigo-50/30">
                                                                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-2 py-1">Recommended</div>
                                                                                {recommended.map(agent => (
                                                                                    <button
                                                                                        key={agent.id}
                                                                                        onClick={() => handleProcessWithAgent(agent)}
                                                                                        className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-white rounded-lg transition-colors group"
                                                                                    >
                                                                                        <div className="text-lg">{agent.icon}</div>
                                                                                        <div className="flex-1">
                                                                                            <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">{agent.name}</div>
                                                                                            <div className="text-[9px] text-slate-400">{agent.role || agent.category}</div>
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        <div className="p-2">
                                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">Team Members</div>
                                                                            {otherAgents.map(agent => (
                                                                                <button
                                                                                    key={agent.id}
                                                                                    onClick={() => handleProcessWithAgent(agent)}
                                                                                    className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-slate-50 rounded-lg transition-colors group"
                                                                                >
                                                                                    <div className="text-lg opacity-60 group-hover:opacity-100">{agent.icon}</div>
                                                                                    <div className="flex-1">
                                                                                        <div className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{agent.name}</div>
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {currentFileItem?.executable && !isEditing && (
                                            <button
                                                onClick={() => handleExecuteFile(selectedFile)}
                                                disabled={executing}
                                                className="bg-green-600 text-white px-4 py-2 h-9 justify-center rounded-xl text-xs font-bold shadow-sm hover:bg-green-700 transition-all flex items-center active:scale-95 disabled:opacity-50"
                                            >
                                                <Play className="h-3.5 w-3.5 mr-2 fill-white" /> Execute Prompt
                                            </button>
                                        )}
                                        {isEditing ? (
                                            <button
                                                onClick={handleSaveFile}
                                                disabled={saving}
                                                className="bg-indigo-600 text-white px-4 py-2 h-9 justify-center rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center active:scale-95 disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                                Save Changes
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-indigo-600 text-white px-4 py-2 h-9 justify-center rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center active:scale-95"
                                            >
                                                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit File
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                                            className={`px-4 py-2 h-9 justify-center rounded-xl text-xs font-bold transition-all flex items-center shadow-sm ${isRightPanelOpen ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:text-indigo-600'}`}
                                            title="Toggle Code Comments"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                            {(comments[selectedFile] || []).filter(c => !c.processed).length > 0 && (
                                                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full mr-2">
                                                    {(comments[selectedFile] || []).filter(c => !c.processed).length}
                                                </span>
                                            )}
                                            Comments
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 min-w-0">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Source Path {currentFileItem?.executable ? '🔥 Executable' : ''}</div>
                                    <div className="text-xs font-bold text-slate-800 truncate" title={`projects / ${projectName} / ${selectedFile}`}>projects / {projectName} / {selectedFile}</div>
                                </div>
                            </div>

                            {isEditing && selectedFile.endsWith('.md') && (
                                <div className="px-8 py-2 border-b border-slate-100 bg-slate-50 flex items-center space-x-4">
                                    <div className="flex space-x-1">
                                        <button onClick={() => applyMarkdown('**', '**')} title="Bold" className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Bold className="h-4 w-4" /></button>
                                        <button onClick={() => applyMarkdown('_', '_')} title="Italic" className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Italic className="h-4 w-4" /></button>
                                        <button onClick={() => applyMarkdown('\n- ')} title="List" className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><List className="h-4 w-4" /></button>
                                        <button onClick={() => applyMarkdown('[', '](url)')} title="Link" className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Link className="h-4 w-4" /></button>
                                        <button onClick={() => applyMarkdown('```\n', '\n```')} title="Code Block" className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all"><Code className="h-4 w-4" /></button>
                                    </div>
                                    <div className="h-4 w-px bg-slate-200 mx-2" />
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Markdown Toolbar</div>
                                </div>
                            )}

                            <div className="flex-1 overflow-hidden flex relative">
                                <div className="flex-1 overflow-auto p-10 bg-slate-50/20 shadow-inner custom-scrollbar relative">
                                    <div className="max-w-4xl mx-auto h-full">
                                        {isEditing ? (
                                            <div className="h-full flex flex-col">
                                                <div className="flex-1 relative group">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                                    <textarea
                                                        id="md-editor"
                                                        value={editedContent}
                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                        className="relative w-full h-full bg-white border-2 border-slate-100 rounded-[32px] p-8 text-sm focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none font-mono leading-relaxed shadow-2xl resize-none transition-all"
                                                        placeholder="Start typing..."
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            selectedFile.endsWith('.md') && !showMdSource ? (
                                                <div className="max-w-none">
                                                    <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px] relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50" />
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                code({ node, inline, className, children, ...props }) {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    if (!inline && match && match[1] === 'mermaid') {
                                                                        return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
                                                                    }
                                                                    return (
                                                                        <code className={className} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                },
                                                                a({ node, href, children, ...props }) {
                                                                    return (
                                                                        <a
                                                                            href={href}
                                                                            onClick={(e) => {
                                                                                if (handleLinkClick(href)) {
                                                                                    e.preventDefault();
                                                                                }
                                                                            }}
                                                                            className="text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer"
                                                                            target={href.startsWith('http') ? "_blank" : "_self"}
                                                                            rel={href.startsWith('http') ? "noopener noreferrer" : ""}
                                                                            {...props}
                                                                        >
                                                                            {children}
                                                                        </a>
                                                                    );
                                                                }
                                                            }}
                                                            className="prose prose-slate prose-indigo max-w-none font-sans text-slate-700 leading-relaxed text-base"
                                                        >
                                                            {fileContent}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative group min-h-full">
                                                    {/* Line Renderer for Code */}
                                                    <div className="relative text-[13px] font-mono bg-slate-900 text-slate-300 p-8 rounded-[32px] shadow-2xl overflow-visible border border-slate-800 leading-relaxed min-h-[500px]">
                                                        {fileContent.split('\n').map((line, i) => {
                                                            const lineNumber = i + 1;
                                                            const fileComments = comments[selectedFile] || [];
                                                            const hasComment = fileComments.some(c => c.line === lineNumber);

                                                            return (
                                                                <div key={lineNumber} className="group/line flex -mx-4 px-4 hover:bg-slate-800/50 rounded lg:rounded-lg relative transition-colors">
                                                                    <div className="w-8 text-slate-600 select-none text-right mr-6 text-xs pt-[2px] opacity-50">{lineNumber}</div>
                                                                    <div className="flex-1 whitespace-pre overflow-x-auto custom-scrollbar pb-0.5">{line || ' '}</div>

                                                                    {/* Hover Action */}
                                                                    <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 ${hasComment || activeCommentLine === lineNumber ? 'opacity-100' : 'opacity-0 group-hover/line:opacity-100'} transition-opacity`}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (activeCommentLine === lineNumber) {
                                                                                    setActiveCommentLine(null);
                                                                                    setNewCommentText('');
                                                                                } else {
                                                                                    // Always start fresh text to allow multiple threads per line
                                                                                    setNewCommentText('');
                                                                                    setActiveCommentLine(lineNumber);
                                                                                    // If comments exist, simply show sidebar too so valid context is seen
                                                                                    if (hasComment) setIsRightPanelOpen(true);
                                                                                }
                                                                            }}
                                                                            className={`p-1.5 rounded-lg transition-all ${hasComment ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}
                                                                        >
                                                                            <MessageSquare className="h-3 w-3" />
                                                                        </button>
                                                                    </div>

                                                                    {/* Add Comment Popover (Inline) */}
                                                                    {activeCommentLine === lineNumber && (
                                                                        <div className="absolute right-12 top-0 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
                                                                            <div className="bg-white p-3 rounded-2xl shadow-2xl border border-indigo-100 w-72 relative">
                                                                                <div className="absolute top-3 -right-2 w-4 h-4 bg-white transform rotate-45 border-r border-t border-indigo-100"></div>
                                                                                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center">
                                                                                    <MessageSquare className="h-3 w-3 mr-1.5 text-indigo-500" />
                                                                                    Comment on Line {lineNumber}
                                                                                </h4>
                                                                                <textarea
                                                                                    value={newCommentText}
                                                                                    onChange={(e) => setNewCommentText(e.target.value)}
                                                                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 mb-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-700 resize-none h-20"
                                                                                    placeholder="Type your note here..."
                                                                                    autoFocus
                                                                                />
                                                                                <div className="flex justify-end space-x-2">
                                                                                    <button onClick={() => setActiveCommentLine(null)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                                                                                    <button
                                                                                        onClick={() => handleAddComment(lineNumber, newCommentText)}
                                                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700"
                                                                                    >
                                                                                        Save Note
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar (Toolbox) */}
                                {isRightPanelOpen && (
                                    <div className="w-80 bg-white border-l border-slate-100 shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-20">
                                        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center space-x-2 font-bold text-slate-700 text-sm">
                                                <PanelRight className="h-4 w-4 text-indigo-600" />
                                                <span>Context Toolbox</span>
                                            </div>
                                            <button onClick={() => setIsRightPanelOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                <PanelRightClose className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/30">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                <span>Active File Context</span>
                                                <span className="bg-slate-200 text-slate-500 px-1.5 rounded-full">{(comments[selectedFile] || []).length}</span>
                                            </div>

                                            {(comments[selectedFile] || []).length === 0 ? (
                                                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                                                    <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-400 font-medium">No comments yet.</p>
                                                    <p className="text-[10px] text-slate-300 mt-1">Hover over line numbers to add context.</p>
                                                </div>
                                            ) : (
                                                (comments[selectedFile] || [])
                                                    .sort((a, b) => a.line - b.line)
                                                    .map(comment => (
                                                        <div key={comment.id} className={`bg-white rounded-2xl shadow-sm border ${comment.processed ? 'border-slate-100 opacity-60' : comment.status === 'locked' ? 'border-green-200 bg-green-50/30' : 'border-slate-100'} group transition-all relative overflow-hidden`}>
                                                            {/* Status Stripe */}
                                                            {comment.processed && (
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300" />
                                                            )}
                                                            {!comment.processed && comment.status === 'locked' && (
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                                                            )}

                                                            <div className="p-4">
                                                                {/* Header */}
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200">Ln {comment.line}</span>
                                                                        {comment.processed ? (
                                                                            <span className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Processed
                                                                            </span>
                                                                        ) : comment.status === 'locked' && (
                                                                            <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200">
                                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        {!comment.processed && comment.status !== 'locked' && (
                                                                            <button
                                                                                onClick={() => handleApprove(comment.id)}
                                                                                className="text-slate-300 hover:text-green-600 p-1 transition-colors"
                                                                                title="Approve & Lock"
                                                                            >
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleDelete(comment.id)}
                                                                            className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                                                                            title="Delete Thread"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Main Comment */}
                                                                <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">{comment.text}</p>
                                                                <div className="text-[9px] text-slate-300 mb-4">{new Date(comment.timestamp).toLocaleTimeString()}</div>

                                                                {/* Replies */}
                                                                {comment.replies && comment.replies.length > 0 && (
                                                                    <div className="space-y-3 pl-3 border-l-2 border-slate-100 mb-4">
                                                                        {comment.replies.map(reply => (
                                                                            <div key={reply.id} className="relative group/reply">
                                                                                <p className="text-xs text-slate-600 leading-relaxed">{reply.text}</p>
                                                                                <div className="flex items-center justify-between mt-1">
                                                                                    <span className="text-[9px] text-slate-300">{new Date(reply.timestamp).toLocaleTimeString()}</span>
                                                                                    <button
                                                                                        onClick={() => handleDelete(comment.id, reply.id)}
                                                                                        className="text-slate-200 hover:text-red-400 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Reply Input */}
                                                                {comment.status !== 'locked' && (
                                                                    <div className="flex items-center mt-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Reply..."
                                                                            value={replyTexts[comment.id] || ''}
                                                                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    handleReply(comment.id, replyTexts[comment.id]);
                                                                                    setReplyTexts(prev => ({ ...prev, [comment.id]: '' }));
                                                                                }
                                                                            }}
                                                                            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                            )
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a file from the sidebar to view content</p>
                        </div>
                    )}
                    {activeTab === 'prompts' && (
                        <div className="flex-1 overflow-hidden p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <TerminalIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Available Prompts
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {generatedPrompts.map((prompt, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                                        onClick={() => {
                                            setSelectedAgentForModal({ name: 'System', id: 'system' });
                                            setAgentPrompt(prompt.body);
                                        }}
                                    >
                                        <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-600">{prompt.title}</div>
                                        <div className="text-xs text-slate-400">Click to load into Agent console</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {
                        selectedAgentForModal && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 scale-95 animate-in fade-in zoom-in duration-200">
                                <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-indigo-600 p-4 rounded-[28px] shadow-lg shadow-indigo-200">
                                                    <Bot className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedAgentForModal.name}</h2>
                                                    <p className="text-sm font-medium text-slate-400 mt-1 flex items-center">
                                                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                        Active Collaboration Persona
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedAgentForModal(null)}
                                                className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90"
                                            >
                                                <X className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Agent Capability</div>
                                            <p className="text-slate-600 text-sm leading-relaxed italic">
                                                "{selectedAgentForModal.description || 'I am ready to help you evolve your project. Describe what you need me to fulfill.'}"
                                            </p>
                                        </div>

                                        {/* Guarded Assign Task Logic */}
                                        {(() => {
                                            // Helper defined in render scope for simplicity, or could be moved up
                                            const hasPendingComments = (comments[selectedFile] || []).some(c => !c.processed && c.status !== 'locked');
                                            // We are not defining the handler here, just using variables.
                                            // Handler is defined above in component scope.
                                            return null;
                                        })()}


                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                Execution Mode
                                            </div>
                                            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setSimulationMode(true)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center ${simulationMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <Sparkles className="h-3 w-3 mr-1.5" /> Simulation
                                                </button>
                                                <button
                                                    onClick={() => setSimulationMode(false)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center ${!simulationMode ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    <TerminalIcon className="h-3 w-3 mr-1.5" /> Real
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="relative">
                                                <textarea
                                                    value={agentPrompt}
                                                    onChange={(e) => setAgentPrompt(e.target.value)}
                                                    placeholder={`What should the ${selectedAgentForModal.name} do now?`}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-[32px] p-6 pr-14 text-sm focus:border-indigo-600 focus:ring-8 focus:ring-indigo-500/5 outline-none font-medium leading-relaxed shadow-sm min-h-[120px] resize-none transition-all placeholder:text-slate-300"
                                                    autoFocus
                                                />
                                                <div className="absolute top-4 right-4 p-2 bg-indigo-50 rounded-xl">
                                                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAssignTaskRequest}
                                                disabled={(!agentPrompt && !hiddenSystemPrompt) || executing}
                                                className="w-full bg-slate-900 text-white py-5 rounded-[32px] font-bold shadow-2xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center active:scale-[0.98]"
                                            >
                                                {executing ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                                ) : (
                                                    <Send className="h-5 w-5 mr-3" />
                                                )}
                                                {executing ? 'Agent is Working...' : 'Assign Task to Agent'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        isWorkflowEditorOpen && (
                            <WorkflowEditor
                                initialPhases={projectConfig?.workflow?.phases}
                                availableAgents={allAgents}
                                onSave={handleSaveWorkflow}
                                onCancel={() => setIsWorkflowEditorOpen(false)}
                            />
                        )
                    }

                    {/* Add Agent Modal */}
                    {
                        isAddAgentOpen && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 scale-95 animate-in fade-in zoom-in duration-200">
                                <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 max-h-[80vh] flex flex-col">
                                    <div className="p-8 border-b border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-xl font-bold text-slate-900">Hire New Agent</h2>
                                            <button
                                                onClick={() => setIsAddAgentOpen(false)}
                                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                            >
                                                <X className="h-6 w-6 text-slate-400" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">Select an agent to join the project team.</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                        {allAgents
                                            .filter(a => a.active !== false)
                                            .filter(a => !(projectConfig?.agents || []).includes(a.id))
                                            .map(agent => (
                                                <div key={agent.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-2xl">{agent.icon}</div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">{agent.name}</div>
                                                            <div className="text-[10px] text-slate-500 font-medium">{agent.category}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddAgent(agent.id)}
                                                        disabled={addingAgent}
                                                        className="px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all"
                                                    >
                                                        {addingAgent ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Hire'}
                                                    </button>
                                                </div>
                                            ))}
                                        {allAgents.filter(a => !(projectConfig?.agents || []).includes(a.id)).length === 0 && (
                                            <div className="text-center py-8 text-slate-400 italic text-sm">
                                                All available agents are already on the team!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Pending Comments Guard Dialog */}
                    <ConfirmationDialog
                        {...dialogConfig}
                        onClose={closeDialog}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectNavigator;
