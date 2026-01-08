import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { resolveAgentPrompts } from './prompt_resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const AGENTS_DIR = path.resolve(__dirname, '../agents');
const GLOBAL_CONFIG_PATH = path.resolve(__dirname, '../config/global.json');
const PROJECT_REGISTRY_PATH = path.resolve(__dirname, '../config/projects.json');

app.use(cors());
app.use(express.json());

// Load dynamic configuration
const getGlobalConfig = async () => {
    try {
        if (await fs.pathExists(GLOBAL_CONFIG_PATH)) {
            return await fs.readJson(GLOBAL_CONFIG_PATH);
        }
    } catch (e) { }
    return { cursorKey: '', defaultProjectPath: '/projects' };
};

const getRegistry = async () => {
    try {
        if (await fs.pathExists(PROJECT_REGISTRY_PATH)) {
            return await fs.readJson(PROJECT_REGISTRY_PATH);
        }
    } catch (e) { }
    return {};
};

const saveToRegistry = async (name, projectPath) => {
    const registry = await getRegistry();
    registry[name] = projectPath;
    await fs.writeJson(PROJECT_REGISTRY_PATH, registry, { spaces: 2 });
};

const removeFromRegistry = async (name) => {
    const registry = await getRegistry();
    delete registry[name];
    await fs.writeJson(PROJECT_REGISTRY_PATH, registry, { spaces: 2 });
};

const resolveProjectPath = async (name) => {
    const registry = await getRegistry();
    if (registry[name]) return registry[name];

    // Fallback to default path
    const global = await getGlobalConfig();
    const defaultBase = global.defaultProjectPath || '/projects';
    return path.join(defaultBase, name);
};

// Ensure base directories exist
fs.ensureDirSync(AGENTS_DIR);
fs.ensureDirSync(path.dirname(GLOBAL_CONFIG_PATH));

// Global Config Endpoints
app.get('/api/config', async (req, res) => {
    try {
        if (!await fs.pathExists(GLOBAL_CONFIG_PATH)) {
            await fs.writeJson(GLOBAL_CONFIG_PATH, { cursorKey: '' });
        }
        const config = await fs.readJson(GLOBAL_CONFIG_PATH);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/config', async (req, res) => {
    try {
        const config = req.body;
        await fs.writeJson(GLOBAL_CONFIG_PATH, config, { spaces: 2 });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List agents
app.get('/api/agents', async (req, res) => {
    try {
        const folders = await fs.readdir(AGENTS_DIR);
        const agents = [];

        for (const folder of folders) {
            const metadataPath = path.join(AGENTS_DIR, folder, 'metadata.yaml');
            if (await fs.pathExists(metadataPath)) {
                const content = await fs.readFile(metadataPath, 'utf8');
                const metadata = yaml.load(content);
                agents.push({ id: folder, ...metadata });
            }
        }
        res.json(agents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new agent (Phase 58)
app.post('/api/agents', async (req, res) => {
    try {
        const { name, icon, role, category } = req.body;
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const agentPath = path.join(AGENTS_DIR, id);

        if (await fs.pathExists(agentPath)) {
            return res.status(400).json({ error: 'Agent with this name already exists' });
        }

        await fs.ensureDir(agentPath);
        await fs.ensureDir(path.join(agentPath, 'prompts'));

        const metadata = {
            name,
            role: role || '',
            category: category || 'General',
            icon: icon || '🤖',
            description: '',
            active: true,
            prompts: []
        };

        await fs.writeFile(path.join(agentPath, 'metadata.yaml'), yaml.dump(metadata));
        res.json({ id, ...metadata });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update agent metadata (Phase 58)
app.put('/api/agents/:id/metadata', async (req, res) => {
    try {
        const { id } = req.params;
        const metadataPath = path.join(AGENTS_DIR, id, 'metadata.yaml');

        if (!(await fs.pathExists(metadataPath))) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const currentContent = await fs.readFile(metadataPath, 'utf8');
        const currentMetadata = yaml.load(currentContent);

        const updatedMetadata = { ...currentMetadata, ...req.body };
        await fs.writeFile(metadataPath, yaml.dump(updatedMetadata));

        res.json(updatedMetadata);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List prompts for an agent (Phase 58)
app.get('/api/agents/:id/prompts', async (req, res) => {
    try {
        const { id } = req.params;
        const promptsDir = path.join(AGENTS_DIR, id, 'prompts');

        if (!(await fs.pathExists(promptsDir))) {
            return res.json([]);
        }

        const files = await fs.readdir(promptsDir);
        const prompts = files.filter(f => f.endsWith('.md')).map(f => ({
            filename: f,
            id: path.basename(f, '.md')
        }));

        res.json(prompts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific prompt content (Phase 58)
app.get('/api/agents/:id/prompts/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        const filePath = path.join(AGENTS_DIR, id, 'prompts', filename);

        if (!(await fs.pathExists(filePath))) {
            return res.status(404).json({ error: 'Prompt not found' });
        }

        const content = await fs.readFile(filePath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/Update prompt (Phase 58)
app.put('/api/agents/:id/prompts/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        const { content } = req.body;
        const promptDir = path.join(AGENTS_DIR, id, 'prompts');
        await fs.ensureDir(promptDir);

        const filePath = path.join(promptDir, filename);
        await fs.writeFile(filePath, content);

        // Update metadata prompts list if not present
        const metadataPath = path.join(AGENTS_DIR, id, 'metadata.yaml');
        if (await fs.pathExists(metadataPath)) {
            const mContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = yaml.load(mContent);
            const promptId = path.basename(filename, '.md');

            if (!metadata.prompts) metadata.prompts = [];
            if (!metadata.prompts.find(p => p.id === promptId)) {
                metadata.prompts.push({
                    id: promptId,
                    title: promptId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    executable: true
                });
                await fs.writeFile(metadataPath, yaml.dump(metadata));
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete prompt (Phase 58)
app.delete('/api/agents/:id/prompts/:filename', async (req, res) => {
    try {
        const { id, filename } = req.params;
        const filePath = path.join(AGENTS_DIR, id, 'prompts', filename);

        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }

        // Remove from metadata prompts list
        const metadataPath = path.join(AGENTS_DIR, id, 'metadata.yaml');
        if (await fs.pathExists(metadataPath)) {
            const mContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = yaml.load(mContent);
            const promptId = path.basename(filename, '.md');

            if (metadata.prompts) {
                metadata.prompts = metadata.prompts.filter(p => p.id !== promptId);
                await fs.writeFile(metadataPath, yaml.dump(metadata));
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const interpolatePrompt = (template, variables) => {
    return template.replace(/\{\{([\w\.]+)\}\}/g, (_, key) => {
        const keys = key.split('.');
        let value = variables;
        for (const k of keys) {
            value = value ? value[k] : undefined;
        }

        // Handle array/object stringification if needed, or return original placeholder if undefined
        if (value === undefined) return `{{${key}}}`;
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return value;
    });
};

// List projects
// List projects
app.get('/api/projects', async (req, res) => {
    try {
        const registry = await getRegistry();
        const projects = [];
        for (const [name, projectPath] of Object.entries(registry)) {
            let config = {};
            try {
                const configPath = path.join(projectPath, '.yabp', 'config.json');
                if (await fs.pathExists(configPath)) {
                    config = await fs.readJson(configPath);
                }
            } catch (e) {
                console.error(`Failed to load config for ${name}`, e);
            }
            projects.push({ name, path: projectPath, config });
        }
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to generate prompts and README
const generateProjectFiles = async (name, config, projectDir) => {
    const yabpDir = path.join(projectDir, '.yabp');
    await fs.ensureDir(yabpDir);

    let fullPrompts = `# Project Prompts for ${name}\n\nGenerated by YABP\n\n`;
    const executableFiles = [];

    for (const agentId of config.agents || config.templates || []) {
        const agentPath = path.join(AGENTS_DIR, agentId);
        const metadataPath = path.join(agentPath, 'metadata.yaml');
        if (await fs.pathExists(metadataPath)) {
            const content = await fs.readFile(metadataPath, 'utf8');
            const metadata = yaml.load(content);

            fullPrompts += `## Agent: ${metadata.name}\n\n`;

            const resolvedPrompts = await resolveAgentPrompts(agentId, agentPath, config.selections);

            for (const prompt of resolvedPrompts) {
                fullPrompts += `### ${prompt.title}\n\n\`\`\`\n${prompt.content}\n\`\`\`\n\n`;

                if (prompt.relativePath.includes('/')) {
                    executableFiles.push(`${prompt.title}.md`);
                } else {
                    const baseName = path.basename(prompt.relativePath, '.md');
                    if (metadata.prompts?.find(p => p.id === baseName || p.title === prompt.title)?.executable) {
                        executableFiles.push(`${prompt.title}.md`);
                    }
                }
            }
        }
    }

    const finalConfig = { ...config, executableFiles };
    await fs.writeJson(path.join(yabpDir, 'config.json'), finalConfig, { spaces: 2 });
    await fs.writeFile(path.join(yabpDir, 'prompts.md'), fullPrompts);

    const readmeContent = `# ${name}\n\nThis project was generated using YABP with the following agents:\n${(config.agents || config.templates || []).map(t => `- ${t}`).join('\n')}\n\nCheck the \`.yabp/prompts.md\` for the prompts to use with Cursor CLI.`;
    await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent);

    return finalConfig;
};

// Create project with full generation logic
app.post('/api/projects', async (req, res) => {
    try {
        const { name, config } = req.body;
        const globalConfig = await getGlobalConfig();
        const projectsDir = config.projectPath || globalConfig.defaultProjectPath || '/projects';
        const projectDir = path.join(projectsDir, name);

        await fs.ensureDir(projectDir);
        await saveToRegistry(name, projectDir);
        await generateProjectFiles(name, config, projectDir);

        res.json({ success: true, path: projectDir });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete project
app.delete('/api/projects/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const registry = await getRegistry();

        if (registry[name]) {
            const projectPath = registry[name];
            // Remove from registry first
            await removeFromRegistry(name);

            // Optional: Remove directory if it exists and is safe to do so
            // checking if it looks like a project dir to avoid deleting root/home by accident
            if (await fs.pathExists(projectPath) && projectPath.includes('/projects')) {
                await fs.remove(projectPath);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single project
app.get('/api/projects/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const registry = await getRegistry();

        // Check registry first, fall back to resolveProjectPath
        let projectDir;
        if (registry[name]) {
            projectDir = registry[name];
        } else {
            const global = await getGlobalConfig();
            const defaultBase = global.defaultProjectPath || '/projects';
            projectDir = path.join(defaultBase, name);
        }

        if (!await fs.pathExists(projectDir)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        let config = {};
        try {
            const configPath = path.join(projectDir, '.yabp', 'config.json');
            if (await fs.pathExists(configPath)) {
                config = await fs.readJson(configPath);
            }
        } catch (e) {
            console.error(`Failed to load config for ${name}`, e);
        }

        res.json({ name, path: projectDir, config });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update project config
app.patch('/api/projects/:name/config', async (req, res) => {
    try {
        const { name } = req.params;
        const updates = req.body;
        const projectDir = await resolveProjectPath(name);
        const configPath = path.join(projectDir, '.yabp', 'config.json');

        if (!await fs.pathExists(configPath)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const currentConfig = await fs.readJson(configPath);
        const newConfig = { ...currentConfig, ...updates };

        // If agents or selections changed, regenerate files
        if (updates.agents || updates.selections) {
            await generateProjectFiles(name, newConfig, projectDir);
        } else {
            // Just update config if no prompt-affecting changes
            await fs.writeJson(configPath, newConfig, { spaces: 2 });
        }

        res.json({ success: true, config: newConfig });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Context Store Endpoints (Phase 50)
// Get Project Context
app.get('/api/projects/:name/context', async (req, res) => {
    try {
        const { name } = req.params;
        const projectDir = await resolveProjectPath(name);
        if (!await fs.pathExists(projectDir)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const contextPath = path.join(projectDir, '.yabp', 'context.json');
        if (await fs.pathExists(contextPath)) {
            const context = await fs.readJson(contextPath);
            res.json(context);
        } else {
            res.json({}); // Return empty context if not initialized
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Project Context
app.patch('/api/projects/:name/context', async (req, res) => {
    try {
        const { name } = req.params;
        const updates = req.body;
        const projectDir = await resolveProjectPath(name);
        const contextPath = path.join(projectDir, '.yabp', 'context.json');

        await fs.ensureDir(path.dirname(contextPath));

        let currentContext = {};
        if (await fs.pathExists(contextPath)) {
            currentContext = await fs.readJson(contextPath);
        }

        // Deep merge or top-level merge? Top-level is simpler and safer for now.
        const newContext = { ...currentContext, ...updates };

        await fs.writeJson(contextPath, newContext, { spaces: 2 });
        res.json({ success: true, context: newContext });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get structured prompts from prompts.md
app.get('/api/projects/:name/prompts', async (req, res) => {
    try {
        const { name } = req.params;
        const projectDir = await resolveProjectPath(name);
        const promptPath = path.join(projectDir, '.yabp', 'prompts.md');

        if (!await fs.pathExists(promptPath)) {
            return res.json([]);
        }

        const content = await fs.readFile(promptPath, 'utf8');
        const configPath = path.join(projectDir, '.yabp', 'config.json');
        const projectConfig = await fs.readJson(configPath);

        // Split by markdown headers for prompts (level 3)
        const prompts = content.split(/^###\s+/m)
            .slice(1) // Skip the header part
            .map(p => {
                const lines = p.split('\n');
                const title = lines[0].trim();
                const body = lines.slice(1).join('\n').trim().replace(/^```\n?|```$/g, '');

                // Interpolate the prompt body with project config
                const interpolatedBody = interpolatePrompt(body, { ...projectConfig, name });

                return { title: title.replace(/\.md$/, ''), body: interpolatedBody };
            });

        res.json(prompts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/projects/:name/files', async (req, res) => {
    try {
        const { name } = req.params;
        const projectDir = await resolveProjectPath(name);

        if (!await fs.pathExists(projectDir)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const configPath = path.join(projectDir, '.yabp', 'config.json');
        let executableFiles = [];
        if (await fs.pathExists(configPath)) {
            const config = await fs.readJson(configPath);
            executableFiles = config.executableFiles || [];
        }

        const walk = async (dir, relativePath = '') => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            const result = [];
            for (const item of items) {
                const itemRelPath = path.join(relativePath, item.name);

                // Noise Filtering (Phase 57)
                if (
                    item.name === '.yabp' ||
                    item.name === 'node_modules' ||
                    item.name === '.git' ||
                    item.name === '.DS_Store'
                ) continue;

                if (item.isDirectory()) {
                    result.push({
                        name: item.name,
                        type: 'directory',
                        path: itemRelPath,
                        children: await walk(path.join(dir, item.name), itemRelPath)
                    });
                } else {
                    result.push({
                        name: item.name,
                        type: 'file',
                        path: itemRelPath,
                        executable: executableFiles.includes(item.name)
                    });
                }
            }
            return result;
        };

        const files = await walk(projectDir);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get file content
app.get('/api/projects/:name/file', async (req, res) => {
    try {
        const { name } = req.params;
        const filePath = req.query.path;
        const projectDir = await resolveProjectPath(name);
        const fullPath = path.join(projectDir, filePath);

        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = await fs.readFile(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save file content
app.put('/api/projects/:name/file', async (req, res) => {
    try {
        const { name } = req.params;
        const { path: filePath, content } = req.body;
        const projectDir = await resolveProjectPath(name);
        const fullPath = path.join(projectDir, filePath);

        // Ensure directory exists
        await fs.ensureDir(path.dirname(fullPath));

        // Write file
        await fs.writeFile(fullPath, content);

        res.json({ success: true, path: filePath });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Soft Delete file
app.delete('/api/projects/:name/file', async (req, res) => {
    try {
        const { name } = req.params;
        const filePath = req.query.path;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        const projectDir = await resolveProjectPath(name);
        // Prevent directory traversal
        if (filePath.includes('..')) {
            return res.status(400).json({ error: 'Invalid file path' });
        }

        const fullPath = path.join(projectDir, filePath);

        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Create .deleted directory
        const deletedDir = path.join(projectDir, '.deleted');
        await fs.ensureDir(deletedDir);

        // Generate timestamped filename to avoid collisions
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.basename(filePath);
        const relativeDir = path.dirname(filePath);
        // Flatten path structure for simplicity in .deleted
        const safeRelativePath = relativeDir.split(path.sep).join('_');
        const destName = `${timestamp}_${safeRelativePath}_${filename}`;
        const destPath = path.join(deletedDir, destName);

        // Move the file
        await fs.move(fullPath, destPath);

        res.json({ success: true, movedTo: destName });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Run/Simulate Prompt Execution
app.post('/api/projects/:name/run-prompt', async (req, res) => {
    try {
        const { name } = req.params;
        const { prompt, agentId, simulationMode = true } = req.body;
        const projectDir = await resolveProjectPath(name);

        // Load config for interpolation
        let config = {};
        try {
            const configPath = path.join(projectDir, '.yabp', 'config.json');
            if (await fs.pathExists(configPath)) {
                config = await fs.readJson(configPath);
            }
        } catch (e) { }

        // Load shared context (Phase 50)
        let context = {};
        try {
            const contextPath = path.join(projectDir, '.yabp', 'context.json');
            if (await fs.pathExists(contextPath)) {
                context = await fs.readJson(contextPath);
            }
        } catch (e) { }

        // Interpolate
        // Merge strict Config + shared Context. 
        // We nest context under 'context' key, but also spread it for flattened access if desired, 
        // though flattened access might conflict with config keys.
        // Strategy: {{context.key}} is safer.
        let interpolatedPrompt = interpolatePrompt(prompt, { ...config, context, name });

        // GLOBAL ASSERTIVE ENFORCEMENT (Phase 26)
        // This is prepended to EVERYTHING to ensure compliance.
        const assertionHeader = `
# CRITICAL GLOBAL RULES (NON-NEGOTIABLE) ⚠️
1. **LANGUAGE**: All output MUST be in **ENGLISH**. No Portuguese, no Spanish. ENGLISH ONLY.
2. **DIAGRAMS**: If a diagram is requested, it MUST be generic **Mermaid**.
   - Use \`\`\`mermaid\`\`\` code blocks.
   - **NO ASCII**.
   - **STRICT SYNTAX**: 
     - Quoted IDs are NOT allowed in graph definitions (e.g. \`A["Label"]\` is GOOD, \`"A"["Label"]\` is BAD).
     - Node Labels MUST be quoted (e.g. \`id["My Label"]\`).
     - No colons in Node IDs (e.g. \`Class:Method\` -> BAD, \`ClassMethod\` -> GOOD).
3. **FILE FORMAT**: Return Markdown or Code files as requested.

---
`;
        interpolatedPrompt = assertionHeader + interpolatedPrompt;

        // CONTEXT-AWARE INJECTION (Phase 2)
        const inputFilesMatch = prompt.match(/input_files:\s*\n?((?:\s*-\s*.+\n?)+)/);
        if (inputFilesMatch) {
            const fileListRaw = inputFilesMatch[1];
            const filesToInject = fileListRaw.split('\n')
                .map(line => line.replace(/-\s*/, '').trim())
                .filter(line => line.length > 0);

            let contextContent = "\n\n# Project Context 🗂️\nThe following artifacts have been created in previous phases:\n";

            for (const filename of filesToInject) {
                const contextFilePath = path.join(projectDir, filename);
                if (await fs.pathExists(contextFilePath)) {
                    const content = await fs.readFile(contextFilePath, 'utf8');
                    contextContent += `\n## ${filename}\n\`\`\`markdown\n${content}\n\`\`\`\n`;
                } else {
                    contextContent += `\n> [MISSING] ${filename} not found. Ensure previous steps are completed.\n`;
                }
            }
            interpolatedPrompt = contextContent + "\n\n---\n\n" + interpolatedPrompt;
        }

        // Generate Execution Directory
        const executionsDir = path.join(projectDir, '.yabp', 'executions');
        await fs.ensureDir(executionsDir);

        // Generate Filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeAgentId = (agentId || 'custom').replace(/[^a-z0-9]/gi, '_');
        const filename = `${timestamp}_${safeAgentId}.md`;
        const filePath = path.join(executionsDir, filename);

        // DOCS FOLDER ORGANIZATION & SYSTEM INSTRUCTION (Phase 34)
        // Check metadata for 'docs_folder' and 'system_instruction' to enforce rules
        let docsFolderPrefix = "";
        let systemInstruction = "";
        try {
            if (agentId) {
                const metadataPath = path.join(AGENTS_DIR, agentId, 'metadata.yaml');
                if (await fs.pathExists(metadataPath)) {
                    const mContent = await fs.readFile(metadataPath, 'utf8');
                    const meta = yaml.load(mContent);
                    if (meta.docs_folder) {
                        docsFolderPrefix = `docs/${meta.docs_folder}/`;
                    }
                    if (meta.system_instruction) {
                        systemInstruction = meta.system_instruction;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to read agent metadata for injection", e);
        }

        // INJECT CONSTRAINTS
        if (systemInstruction) {
            interpolatedPrompt = `\n\n# CRITICAL SYSTEM INSTRUCTION\n${systemInstruction}\n\n---\n\n${interpolatedPrompt}`;
        }

        if (docsFolderPrefix && !interpolatedPrompt.includes(docsFolderPrefix)) {
            interpolatedPrompt += `\n\n# OUTPUT INSTRUCTION\nIMPORTANT: Any markdown documentation created MUST be saved in the \`${docsFolderPrefix}\` directory (e.g., \`${docsFolderPrefix}my_file.md\`). Do not output files to the root.`;
        }

        // Write to file
        const fileContent = `# Execution Log: ${agentId || 'Custom Prompt'}\nDate: ${new Date().toLocaleString()}\n\n## Prompt Content\n\n${interpolatedPrompt}`;
        await fs.writeFile(filePath, fileContent);

        console.log(`[${name}] Executed prompt: ${filename}`);

        // REAL EXECUTION MODE (Phase 5) 🚀
        if (!simulationMode) {
            console.log(`[${name}] Starting REAL execution via cursor-agent...`);

            // Spawn the cursor-agent process
            const globalConfig = await getGlobalConfig();

            console.log(`[${name}] Spawning cursor-agent with CWD: ${projectDir}`);
            console.log(`[${name}] Using API Key: ${globalConfig.cursorKey ? 'Yes (Present)' : 'No (Missing)'}`);

            // The official installer puts the binary in ~/.local/bin/cursor-agent
            // We try the command 'cursor-agent' first, but also fallback to the absolute path for root
            let agentCommand = 'cursor-agent';
            const fs = await import('fs-extra');
            if (await fs.pathExists('/root/.local/bin/cursor-agent')) {
                agentCommand = '/root/.local/bin/cursor-agent';
            }

            console.log(`[${name}] Spawning cursor-agent using command: ${agentCommand}`);

            // Construct explicit instruction for the agent to use the file
            const instruction = `Please execute the instructions defined in the file: ${filePath}`;

            const child = spawn(agentCommand, ['-p', '-f', instruction], {
                cwd: projectDir, // Run in the project directory so it affects files there
                shell: true,
                stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin to prevent waiting for input
                env: {
                    ...process.env,
                    // Pass keys
                    CURSOR_API_KEY: globalConfig.cursorKey,
                    OPENAI_API_KEY: globalConfig.cursorKey, // Fallback
                }
            });

            let output = "";

            child.stdout.on('data', (data) => {
                const chunk = data.toString();
                output += chunk;
                // Ideally we'd stream this via WebSocket, but for now we buffer
                console.log(`[Cursor CLI]: ${chunk}`);
            });

            child.stderr.on('data', (data) => {
                const chunk = data.toString();
                output += `[STDERR]: ${chunk}`;
                console.error(`[Cursor CLI Error]: ${chunk}`);
            });

            // Wait for completion
            await new Promise((resolve, reject) => {
                child.on('close', (code) => {
                    output += `\n[Process exited with code ${code}]`;
                    resolve();
                });
                child.on('error', (err) => {
                    output += `\n[Spawn Error]: ${err.message}`;
                    reject(err);
                });
            });

            return res.json({
                success: true,
                interpolatedPrompt: interpolatedPrompt,
                message: `Real execution completed via Cursor CLI.`,
                output: output // Send full CLI output to frontend console
            });
        }

        // MOCK ARTIFACT GENERATION (Simulation Mode Enhancer)
        let mockOutput = "";

        // Strategy 1: Check if the *original* user prompt passed in req.body has frontmatter (unlikely for agent tasks)
        const frontmatterMatch = prompt.match(/^---\n([\s\S]*?)\n---/);

        // Strategy 2: If finding an agent, scan its prompts for output definitions
        if (agentId) {
            const agentPromptsDir = path.join(AGENTS_DIR, agentId, 'prompts');
            if (await fs.pathExists(agentPromptsDir)) {
                const files = await fs.readdir(agentPromptsDir);
                for (const pFile of files) {
                    if (!pFile.endsWith('.md')) continue;

                    const pContent = await fs.readFile(path.join(agentPromptsDir, pFile), 'utf8');
                    const pMatch = pContent.match(/^---\n([\s\S]*?)\n---/);

                    if (pMatch) {
                        const frontmatter = pMatch[1];
                        const outputFileMatch = frontmatter.match(/output_file:\s*(.+)/);

                        if (outputFileMatch) {
                            const outputFileName = outputFileMatch[1].trim();


                            outputFileName = outputFileMatch[1].trim();

                            // DOCS FOLDER LOGIC (Phase 6) - Simulation Mode
                            // Redundant check, but good for safety if variable scoped above matches
                            let agentDocsFolder = "";
                            try {
                                const mContent = await fs.readFile(path.join(AGENTS_DIR, agentId, 'metadata.yaml'), 'utf8');
                                const meta = yaml.load(mContent);
                                if (meta.docs_folder) agentDocsFolder = `docs/${meta.docs_folder}/`;
                            } catch (e) { }

                            if (agentDocsFolder && !outputFileName.startsWith('docs/')) {
                                outputFileName = path.join(agentDocsFolder, outputFileName);
                            }

                            const outputFilePath = path.join(projectDir, outputFileName);
                            await fs.ensureDir(path.dirname(outputFilePath));

                            const exampleMatch = pContent.match(/## Complete Code Example\s*\n([\s\S]*)/i);
                            let mockContent = exampleMatch
                                ? exampleMatch[1].trim()
                                : `<!-- Mock Content for ${outputFileName} -->\n\n# Generated by Simulation Mode\n\n(No example content found in ${pFile})`;

                            // SIMULATION ENHANCEMENT: Inject the user's actual input
                            // This helps the user see that their specific task was "received", even if the body is a static template.
                            const simulationHeader = `> **[SIMULATION MODE]**\n> **User Input**: "${prompt}"\n> \n> *Note: This is a structural example. Connect an LLM to generate real content based on your input.*\n\n---\n\n`;

                            if (mockContent.startsWith('# ')) {
                                // Inject after the first H1 title if present
                                const firstLineEnd = mockContent.indexOf('\n');
                                mockContent = mockContent.substring(0, firstLineEnd) + '\n\n' + simulationHeader + mockContent.substring(firstLineEnd).trim();
                            } else {
                                mockContent = simulationHeader + mockContent;
                            }

                            await fs.writeFile(outputFilePath, mockContent);
                            mockOutput += `\n\n[MOCK] Created artifact: ${outputFileName} (from ${pFile})`;
                        }
                    }
                }
            }
        } else if (frontmatterMatch) {
            // ... (keep existing logic for custom prompts if needed)
            const frontmatter = frontmatterMatch[1];
            if (outputFileMatch) {
                let outputFileName = outputFileMatch[1].trim();

                // DOCS FOLDER LOGIC (Phase 6)
                if (docsFolderPrefix && !outputFileName.startsWith('docs/')) {
                    outputFileName = path.join(docsFolderPrefix, outputFileName);
                }

                const outputFilePath = path.join(projectDir, outputFileName);
                await fs.ensureDir(path.dirname(outputFilePath));

                // Try to extract "Complete Code Example" 
                const exampleMatch = interpolatedPrompt.match(/## Complete Code Example\s*\n([\s\S]*)/i);
                const mockContent = exampleMatch
                    ? exampleMatch[1].trim()
                    : `<!-- Mock Content for ${outputFileName} -->\n\n# Generated by Simulation Mode`;
                await fs.writeFile(outputFilePath, mockContent);
                mockOutput = `\n\n[MOCK] Created artifact: ${outputFileName}`;
            }
        }

        res.json({
            success: true,
            interpolatedPrompt: interpolatedPrompt,
            message: `Prompt executed. Created job file: .yabp/executions/${filename}${mockOutput}`,
            output: `Job file created at .yabp/executions/${filename}${mockOutput}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Storage bridge running at http://localhost:${PORT}`);
});
