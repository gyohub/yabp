import path from 'path';
import fs from 'fs-extra';

/**
 * Resolves the specific prompt files to use based on the agent and user selections.
 * @param {string} agentId - The ID of the agent (e.g., 'devops-engineer')
 * @param {string} agentPath - Absolute path to the agent directory
 * @param {object} selections - User selections configuration object
 * @returns {Promise<Array<{title: string, content: string, relativePath: string}>>}
 */
export const resolveAgentPrompts = async (agentId, agentPath, selections) => {
    const results = [];
    const promptsDir = path.join(agentPath, 'prompts'); // Standard generic prompts

    // Helper to add a prompt if it exists
    const addPrompt = async (relativePath, titleOverride = null) => {
        const fullPath = path.join(agentPath, relativePath);
        if (await fs.pathExists(fullPath)) {
            const content = await fs.readFile(fullPath, 'utf8');
            const name = path.basename(fullPath);
            results.push({
                title: titleOverride || name.replace(/\.md$/, ''),
                content,
                relativePath
            });
            return true;
        }
        return false;
    };

    // 2. Intelligent Selection Logic
    // We only add specific prompts if the user has made relevant selections
    if (!selections) return results;

    const {
        "Cloud Provider": cloudProvider,
        "Infrastructure": infrastructure,
        "CI/CD Platform": cicdPlatform,
        "Monitoring Stack": monitoring,
        "Java Framework": javaFramework,
        "Project Artifacts": projectArtifacts,
        "Architecture Artifacts": architectureArtifacts,
        "Frontend Library": frontendLib,
        "Backend Framework": framework
    } = selections;

    // --- Project Manager Logic ---
    if (agentId === 'pm-framework') {
        const artifacts = Array.isArray(projectArtifacts) ? projectArtifacts : [projectArtifacts];

        if (artifacts.includes('Project briefing')) {
            await addPrompt('prompts/spec_00X_project_briefing.md', 'Project Briefing');
        }
        if (artifacts.includes('User stories')) {
            await addPrompt('prompts/spec_002_user_stories.md', 'User Stories');
        }
        if (artifacts.includes('Roadmap')) {
            await addPrompt('prompts/spec_003_roadmap.md', 'Project Roadmap');
        }
    }

    // --- Senior Architect Logic ---
    if (agentId === 'senior-architect') {
        const artifacts = Array.isArray(architectureArtifacts) ? architectureArtifacts : [architectureArtifacts];

        if (artifacts.includes('System Architecture Diagram')) {
            await addPrompt('prompts/001_system_architecture.md', 'System Architecture');
        }
        if (artifacts.includes('Component Diagram')) {
            await addPrompt('prompts/002_component_design.md', 'Component Architecture');
        }
        if (artifacts.includes('Deployment Architecture')) {
            await addPrompt('prompts/003_deployment_architecture.md', 'Deployment Architecture');
        }
        if (artifacts.includes('Architecture Decision Records (ADRs)')) {
            await addPrompt('prompts/005_architecture_decisions.md', 'ADRs');
        }
    }

    // --- Java Microservice Logic ---
    if (agentId === 'java-microservice') {
        // Always add the initial structure
        await addPrompt('prompts/001_initial_structure.md', 'Initial Project Structure');

        // Framework Specific
        if (javaFramework === 'Spring Boot') {
            await addPrompt('framework/spring_boot_microservice.md', 'Spring Boot Microservice');
        }
        if (javaFramework === 'Quarkus') {
            await addPrompt('framework/quarkus_reactive.md', 'Quarkus Reactive');
        }
        if (javaFramework === 'Micronaut') {
            await addPrompt('framework/micronaut_native.md', 'Micronaut Native');
        }
    }

    // --- DevOps Engineer Logic ---
    if (agentId === 'devops-engineer') {
        const infraTools = Array.isArray(infrastructure) ? infrastructure : [infrastructure];

        // CI/CD - Ensure we only add the pipeline prompt if a platform is actually selected
        if (cicdPlatform) {
            // Use the generic pipeline prompt as a base, or specific ones
            // For now, let's treat the '001_cicd_pipeline.md' as the generic base if no specific tool overrides it, 
            // OR only add it if it matches the selection.
            // Given the file content has placeholders, we can add it as the base generator.
            await addPrompt('prompts/001_cicd_pipeline.md', 'Base CI/CD Pipeline');
        }

        // AWS Infrastructure
        if (cloudProvider === 'AWS') {
            if (infraTools.includes('Terraform')) {
                await addPrompt('infrastructure/aws_terraform_complete.md', 'AWS Infrastructure (Terraform)');
            }
            if (infraTools.includes('CloudFormation')) { // Assuming CloudFormation might be an option or default
                await addPrompt('infrastructure/aws_cloudformation_vpc.md', 'AWS Infrastructure (CloudFormation)');
            }
            // Add existing CDK check if needed, or if we add CDK as an option
            await addPrompt('infrastructure/aws_cdk_typescript.md', 'AWS Infrastructure (CDK)');
        }

        // Azure Infrastructure
        if (cloudProvider === 'Azure') {
            await addPrompt('infrastructure/azure_bicep_aks.md', 'Azure Infrastructure (Bicep)');
        }

        // GCP Infrastructure
        if (cloudProvider === 'GCP') {
            await addPrompt('infrastructure/gcp_terraform_gke.md', 'GCP Infrastructure (Terraform)');
        }

        // CI/CD Specifics (can toggle these or keep as additional layers)
        if (cicdPlatform === 'GitHub Actions') {
            if (cloudProvider === 'AWS') await addPrompt('cicd/github_actions_aws_ecs.md', 'GitHub Actions (AWS Deployment)');
        }
        if (cicdPlatform === 'GitLab CI') {
            await addPrompt('cicd/gitlab_ci_kubernetes.md', 'GitLab CI (Kubernetes)');
        }
        if (cicdPlatform === 'Jenkins') {
            await addPrompt('cicd/jenkins_pipeline_multicloud.md', 'Jenkins Pipeline');
        }

        // Monitoring
        if (monitoring) {
            await addPrompt('monitoring/prometheus_grafana_kubernetes.md', 'Prometheus & Grafana');
            if (cloudProvider === 'AWS') {
                await addPrompt('monitoring/cloudwatch_aws.md', 'AWS CloudWatch');
            }
        }
    }

    // --- Python Developer Logic ---
    if (agentId === 'python-developer') {
        if (framework === 'Django') {
            await addPrompt('framework/django_project_structure.md', 'Django Project Structure');
            await addPrompt('framework/django_rest_api.md', 'Django REST Framework API'); // Assuming we add this next
        }
        if (framework === 'FastAPI') {
            await addPrompt('framework/fastapi_project_structure.md', 'FastAPI Project Structure');
        }
        if (framework === 'Flask') {
            await addPrompt('framework/flask_api_blueprint.md', 'Flask Application Factory');
        }
    }
    // --- Node.js Developer Logic ---
    if (agentId === 'nodejs-developer') {
        if (framework === 'Express') {
            await addPrompt('framework/express_typescript_setup.md', 'Express Setup (TypeScript)');
            await addPrompt('framework/express_api_routes.md', 'Express API Routes'); // Placeholder
        }
        if (framework === 'NestJS') {
            await addPrompt('framework/nestjs_project_structure.md', 'NestJS Project Structure');
        }
        if (framework === 'Fastify') {
            await addPrompt('framework/fastify_high_performance.md', 'Fastify High Performance API');
        }
    }
    // Filter out duplicates (if specific prompt overrides generic one)
    // Logic: If specific prompt has same "base name" or covers same topic, maybe replace?
    // For now, we append. The user can choose. 
    // Actually, we should probably deduplicate based on some key, but titles are different.

    // --- Go Developer Logic ---
    if (agentId === 'go-developer') {
        if (framework === 'Gin') {
            await addPrompt('framework/gin_api.md', 'Gin Web Framework');
        }
        if (framework === 'Echo') {
            await addPrompt('framework/echo_api.md', 'Echo Framework');
        }
    }

    // --- Frontend Developer Logic ---
    if (agentId === 'frontend-developer') {
        const libs = Array.isArray(frontendLib) ? frontendLib : [frontendLib];

        // React
        if (libs.includes('React') || framework === 'React') {
            // Assuming Next.js is selected via another mechanism or implied, 
            // but checking if user selected "Next.js" specifically would be better.
            // For now, we add the App Router prompt as a high-value default if React is chosen.
            await addPrompt('framework/react_nextjs_app_router.md', 'Next.js App Router');
            await addPrompt('framework/react_component_library.md', 'React Component Library');
            await addPrompt('state/react_state_zustand.md', 'State Management (Zustand)');
        }

        // Vue
        if (libs.includes('Vue') || framework === 'Vue') {
            await addPrompt('framework/vue3_composition_api.md', 'Vue 3 Composition API');
            await addPrompt('framework/vue3_component_library.md', 'Vue 3 Component Library');
            await addPrompt('state/vue3_pinia_state.md', 'State Management (Pinia)');
        }

        // Angular
        if (libs.includes('Angular') || framework === 'Angular') {
            await addPrompt('framework/angular_standalone_components.md', 'Angular Standalone Components');
            await addPrompt('state/angular_ngrx_state.md', 'State Management (NgRx)');
        }
    }

    // --- QA Engineer Logic ---
    if (agentId === 'qa-engineer') {
        const tests = Array.isArray(selections['Testing Framework']) ? selections['Testing Framework'] : [selections['Testing Framework']];
        const performance = Array.isArray(selections['Performance Tools']) ? selections['Performance Tools'] : [selections['Performance Tools']];

        if (tests.includes('Playwright')) {
            await addPrompt('testing/playwright_e2e_setup.md', 'Playwright E2E Setup');
        }
        if (tests.includes('Cypress')) {
            await addPrompt('testing/cypress_e2e_setup.md', 'Cypress E2E Setup');
        }
        if (performance && performance.includes('k6')) { // Check if performance selection exists
            await addPrompt('performance/k6_load_testing.md', 'k6 Load Testing');
        }
    }

    return results;
};
