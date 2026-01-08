
import { Sparkles, Layout, Terminal, Shield, Database, Users, FileText, Cloud } from 'lucide-react';

export const WORKFLOW_TEMPLATES = [
    {
        id: 'comprehensive-sdlc',
        name: 'Comprehensive SDLC',
        description: 'Full-scale software development lifecycle with dedicated planning, architecture, implementation, and verification phases.',
        icon: 'Layout',
        phases: [
            { id: 'Inception', icon: 'Sparkles', label: 'Inception', description: 'Define scope, requirements & user stories', allowedAgents: ['pm-framework'] },
            { id: 'Architecture', icon: 'Layout', label: 'Architecture', description: 'System design & technical specifications', allowedAgents: ['senior-architect', 'database-specialist'] },
            { id: 'Implementation', icon: 'Terminal', label: 'Implementation', description: 'Code construction & development', allowedAgents: ['frontend-developer', 'nodejs-developer', 'python-developer', 'go-developer', 'java-specialist'] },
            { id: 'Operations', icon: 'Cloud', label: 'Operations', description: 'Infrastructure & Deployment', allowedAgents: ['devops-engineer'] },
            { id: 'Verification', icon: 'Shield', label: 'Verification', description: 'QA testing & security auditing', allowedAgents: ['qa-engineer', 'red-blue-team'] }
        ],
        recommendedAgents: ['pm-framework', 'senior-architect', 'database-specialist', 'devops-engineer', 'qa-engineer']
    },
    {
        id: 'documentation-heavy',
        name: 'Documentation Focus',
        description: 'Centered on creating thorough technical documentation, specifications, and project planning artifacts.',
        icon: 'FileText',
        phases: [
            { id: 'Discovery', icon: 'Sparkles', label: 'Discovery', description: 'Gathering requirements', allowedAgents: ['pm-framework'] },
            { id: 'Specification', icon: 'FileText', label: 'Specification', description: 'Writing technical specs', allowedAgents: ['senior-architect', 'pm-framework'] },
            { id: 'Review', icon: 'Shield', label: 'Review', description: 'Review and validation', allowedAgents: ['senior-architect', 'qa-engineer'] }
        ],
        recommendedAgents: ['pm-framework', 'senior-architect']
    },
    {
        id: 'cloud-infrastructure',
        name: 'Cloud Infrastructure',
        description: 'Streamlined workflow for setting up cloud environments, CI/CD pipelines, and infrastructure as code.',
        icon: 'Cloud',
        phases: [
            { id: 'Planning', icon: 'Sparkles', label: 'Planning', description: 'Infrastructure requirements', allowedAgents: ['senior-architect', 'devops-engineer'] },
            { id: 'IAC-Dev', icon: 'Terminal', label: 'IaC Dev', description: 'Terraform/CloudFormation coding', allowedAgents: ['devops-engineer'] },
            { id: 'Security-Audit', icon: 'Shield', label: 'Security', description: 'Security compliance check', allowedAgents: ['red-blue-team'] }
        ],
        recommendedAgents: ['devops-engineer', 'senior-architect', 'red-blue-team']
    },
    {
        id: 'rapid-prototyping',
        name: 'Rapid Prototyping',
        description: 'Fast-paced workflow focused on quick implementation and feedback loops.',
        icon: 'Zap',
        phases: [
            { id: 'Concept', icon: 'Sparkles', label: 'Concept', description: 'Quick requirements', allowedAgents: ['pm-framework'] },
            { id: 'Build', icon: 'Terminal', label: 'Build', description: 'Rapid development', allowedAgents: ['frontend-developer', 'nodejs-developer', 'python-developer'] },
            { id: 'Demo', icon: 'Users', label: 'Demo', description: 'Stakeholder review', allowedAgents: ['pm-framework'] }
        ],
        recommendedAgents: ['pm-framework', 'frontend-developer']
    }
];
