import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

const MermaidRenderer = ({ chart }) => {
    const ref = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chart) return;

        const renderDiagram = async () => {
            try {
                // Generate a unique ID for each render to prevent conflicts
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error("Mermaid rendering failed:", err);
                setError("Failed to render diagram. Syntax might be incorrect.");
            }
        };

        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-mono">
                {error}
                <pre className="mt-2 text-[10px] text-red-400 opacity-70 whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            className="mermaid-chart flex justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 my-6 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidRenderer;
