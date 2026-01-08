import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Folder, LayoutGrid, Settings, Trash2, Rocket, Zap, PackagePlus } from 'lucide-react';
import ProjectCreationWizard from './components/ProjectCreationWizard';
import ProjectNavigator from './components/ProjectNavigator';
import AgentInstaller from './components/AgentInstaller';
import SettingsView from './components/SettingsView';
import AppHeader from './components/AppHeader';

function App() {
  const navigate = useNavigate();
  const [showInstaller, setShowInstaller] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = () => {
    navigate('/');
    fetchProjects();
  };

  const deleteProject = async (e, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        const res = await fetch(`http://localhost:3001/api/projects/${encodeURIComponent(name)}`, { method: 'DELETE' });
        if (res.ok) fetchProjects();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans selection:bg-indigo-100">
      {showInstaller && (
        <AgentInstaller
          onClose={() => setShowInstaller(false)}
          onInstalled={fetchProjects}
        />
      )}

      {showSettings && (
        <SettingsView onClose={() => setShowSettings(false)} />
      )}

      <Routes>
        <Route path="/new" element={
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <ProjectCreationWizard onProjectCreated={handleProjectCreated} />
          </div>
        } />

        <Route path="/project/:projectName" element={
          <ProjectNavigator onBack={() => navigate('/')} />
        } />

        <Route path="/" element={
          <>
            {/* Header */}
            <AppHeader
              onOpenSettings={() => setShowSettings(true)}
              onOpenInstaller={() => setShowInstaller(true)}
              onNewProject={() => navigate('/new')}
            />

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="space-y-2">
                  <h1 className="text-4xl font-extrabold text-slate-900">My Projects</h1>
                  <p className="text-slate-500 font-medium">Manage and explore your generated boilerplates</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                  <button className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><LayoutGrid className="h-4 w-4" /></button>
                  <button className="p-2 text-slate-400"><Folder className="h-4 w-4" /></button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl border border-slate-200/50" />
                  ))}
                </div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => navigate(`/project/${encodeURIComponent(p.name)}`)}
                      className="group relative bg-white border border-slate-200 rounded-3xl p-8 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden backdrop-blur-3xl"
                    >
                      <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                        <div className="bg-indigo-50 p-2 rounded-full border border-indigo-100">
                          <Rocket className="h-4 w-4 text-indigo-600" />
                        </div>
                      </div>

                      <div className="mb-6 flex space-x-2">
                        {(p.config.agents || p.config.templates || []).map(t => (
                          <span key={t} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed">
                        Generated boiler plate with {(p.config.agents || p.config.templates || []).length} agents
                      </p>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex -space-x-2">
                          <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">JS</div>
                          <div className="h-8 w-8 rounded-full border-2 border-white bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">YML</div>
                        </div>
                        <button
                          onClick={e => deleteProject(e, p.name)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => navigate('/new')}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer"
                  >
                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                      <Plus className="h-8 w-8 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                    <span className="font-bold text-slate-400 group-hover:text-indigo-600">Create New Project</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="p-8 bg-indigo-50 rounded-[40px] mb-8 relative">
                    <Zap className="h-16 w-16 text-indigo-600 relative z-10" />
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">No projects yet</h2>
                  <p className="text-slate-500 mb-10 max-w-xs text-center font-medium">Start by generating your first high-quality boiler plate with YABP</p>
                  <button
                    onClick={() => navigate('/new')}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center"
                  >
                    <Plus className="mr-3 h-6 w-6" /> Create Project
                  </button>
                </div>
              )}
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
