# YABP - Agentic Forge 🤖🏗️

YABP (Yet Another Boiler Plate) is an advanced **Agentic Forge** that empowers developers to orchestrate specialized AI Agents to build project boilerplates for any language and any cloud, fully integrated with Cursor CLI.

## 🚀 Key Features
- **Agent-Driven Development**: Specialized YAML-based Agents with custom personas and prompts.
- **Agentic Wizard**: Assemble your expert team in a sleek, multi-step configuration UI.
- **Project Navigator**: Explore generated source code and coordinate agent prompts.
- **On-Demand Artifacts**: Generate documentation, stories, and boilerplate only when you need them.
- **Cursor CLI Ready**: Optimized prompt delivery for seamless AI-assisted coding.
- **Dockerized**: Fully containerized for consistent development and deployment.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router.
- **Backend Bridge**: Node.js, Express, fs-extra, js-yaml, adm-zip.
- **Containerization**: Docker, Docker Compose.

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- Docker (optional)

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Agentic Bridge:
   ```bash
   node server/index.js
   ```
3. Launch the Forge UI:
   ```bash
   npm run dev
   ```

### Running with Docker
```bash
docker-compose up --build
```

## 📦 Architecture
- `src/`: Agentic Forge UI.
- `server/`: Backend orchestration bridge.
- `agents/`: Domain-specific AI Agent definitions.
- `projects/`: Managed project workspaces.
- `examples/`: Reference agents and prompt bundles.

## 📄 License
MIT

