import React, { useState, useCallback, memo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    useReactFlow,
    Panel,
    NodeToolbar,
    Position,
    Handle,
    Connection,
    addEdge,
    getNodesBounds,
} from 'reactflow';
import { BrainCircuit, Download, Loader2, Sparkles, Search, X, Copy, PlusCircle, ChevronRight, Plus, Save, FolderOpen, Trash2, Check, Target, Users, Layers } from 'lucide-react';
import { generateMindmapData, brainstormNodeDetails, DeepDiveResult, MindmapInput } from '../services/geminiService';
import { toPng } from 'html-to-image';
import { Toast, ToastType } from './Toast';
import { MindmapService } from '../services/mindmapService';
import FeatureHeader from './FeatureHeader';
import { MindmapProject } from '../types';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

// --- CUSTOM NODE WITH TOOLBAR ---
const CustomNode = memo(({ data, id, selected }: any) => {
    const { onBrainstorm, label } = data;

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBrainstorm(label);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
                >
                    <Sparkles size={12} strokeWidth={1.25} /> Brainstorm
                </button>
            </NodeToolbar>

            <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-stone-400" />
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm text-center text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 min-w-[130px]">
                {label}
            </div>
            <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-stone-400" />
        </>
    );
});

const nodeTypes = {
    custom: CustomNode
};

const MindmapGeneratorContent: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [keyword, setKeyword] = useState('');
    const [goal, setGoal] = useState('');
    const [audience, setAudience] = useState('');
    const [depth, setDepth] = useState(3);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [projectId, setProjectId] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [savedProjects, setSavedProjects] = useState<MindmapProject[]>([]);
    const [showLoadModal, setShowLoadModal] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState('');
    const [activeRootContext, setActiveRootContext] = useState('');
    const [sidebarContent, setSidebarContent] = useState<DeepDiveResult | null>(null);

    const [isAddingNode, setIsAddingNode] = useState(false);
    const [newNodeLabel, setNewNodeLabel] = useState('');

    const { fitView, getNodes, getViewport, setViewport } = useReactFlow();

    useEffect(() => {
        const loadData = async () => {
            const migrated = await MindmapService.migrateFromLocalStorage();
            if (migrated > 0) {
                showToast(`Đã migrate ${migrated} sơ đồ lên cloud!`, 'success');
            }
            const projects = await MindmapService.getMindmaps();
            setSavedProjects(projects);
        };
        loadData();
    }, []);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#a8a29e', strokeWidth: 2 } }, eds));
    }, [setEdges]);

    const handleAddNodeMode = () => {
        setIsAddingNode(true);
        setNewNodeLabel('');
    };

    const confirmAddNode = () => {
        if (!newNodeLabel.trim()) {
            setIsAddingNode(false);
            return;
        }

        const newNode: Node = {
            id: `manual-${Date.now()}`,
            position: {
                x: Math.random() * 400,
                y: Math.random() * 400
            },
            data: { label: newNodeLabel, onBrainstorm: handleBrainstormRequest },
            type: 'custom',
        };

        setNodes((nds) => [...nds, newNode]);
        setIsAddingNode(false);
        showToast('Đã thêm node mới', 'success');
    };

    const calculateLayout = (rawNodes: any[], rawEdges: any[]) => {
        const root = rawNodes.find(n => n.type === 'root');
        if (!root) return { nodes: [], edges: [] };

        const layoutNodes: Node[] = [];
        layoutNodes.push({
            id: root.id,
            position: { x: 0, y: 0 },
            data: { label: root.label, onBrainstorm: handleBrainstormRequest },
            type: 'input',
            style: {
                background: '#1c1917', color: 'white', border: 'none', borderRadius: '12px',
                padding: '15px 25px', fontSize: '15px', fontWeight: 600, width: 180, textAlign: 'center'
            },
        });

        const branches = rawNodes.filter(n => n.type === 'branch');
        const branchSpacingY = 250;
        const branchX = 400;
        let branchStartY = -((branches.length - 1) * branchSpacingY) / 2;

        branches.forEach((branch, bIdx) => {
            const currentBranchY = branchStartY + bIdx * branchSpacingY;

            layoutNodes.push({
                id: branch.id,
                position: { x: branchX, y: currentBranchY },
                data: { label: branch.label, onBrainstorm: handleBrainstormRequest },
                type: 'custom',
            });

            const branchEdges = rawEdges.filter(e => e.source === branch.id);
            const leafIds = branchEdges.map(e => e.target);
            const leaves = rawNodes.filter(n => leafIds.includes(n.id));

            const leafSpacingY = 70;
            const leafX = branchX + 300;
            let leafStartY = currentBranchY - ((leaves.length - 1) * leafSpacingY) / 2;

            leaves.forEach((leaf, lIdx) => {
                layoutNodes.push({
                    id: leaf.id,
                    position: { x: leafX, y: leafStartY + lIdx * leafSpacingY },
                    data: { label: leaf.label, onBrainstorm: handleBrainstormRequest },
                    type: 'custom',
                });
            });
        });

        const layoutEdges: Edge[] = rawEdges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#a8a29e', strokeWidth: 2 },
        }));

        return { nodes: layoutNodes, edges: layoutEdges };
    };

    const handleGenerate = async () => {
        if (!keyword.trim()) {
            showToast('Vui lòng nhập từ khóa', 'error');
            return;
        }
        setIsGenerating(true);
        setShowSidebar(false);
        try {
            const inputData: MindmapInput = {
                topic: keyword,
                goal: goal.trim() || undefined,
                audience: audience.trim() || undefined,
                depth
            };

            const data = await generateMindmapData(inputData);
            if (data.nodes.length > 0) {
                const { nodes: layoutedNodes, edges: layoutedEdges } = calculateLayout(data.nodes, data.edges);
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
                setProjectId(null);
                setProjectName(keyword);
                setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
            } else {
                showToast('Không thể tạo bản đồ.', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối AI.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveProject = async () => {
        if (nodes.length === 0) return;

        const nameToSave = projectName.trim() || `Mindmap ${new Date().toLocaleDateString()}`;
        const currentId = projectId || Date.now().toString();
        const viewport = getViewport();

        const nodesToSave = nodes.map(node => ({
            ...node,
            data: { label: node.data.label }
        }));

        const project: MindmapProject = {
            id: currentId,
            name: nameToSave,
            nodes: nodesToSave,
            edges: edges,
            viewport: viewport,
            createdAt: projectId ? (savedProjects.find(p => p.id === projectId)?.createdAt || Date.now()) : Date.now(),
            updatedAt: Date.now()
        };

        const success = await MindmapService.saveMindmap(project);
        if (success) {
            setProjectId(currentId);
            const projects = await MindmapService.getMindmaps();
            setSavedProjects(projects);
            showToast('Đã lưu sơ đồ lên cloud!', 'success');
        } else {
            showToast('Lỗi khi lưu!', 'error');
        }
    };

    const handleLoadProject = (project: MindmapProject) => {
        const loadedNodes = project.nodes.map(node => ({
            ...node,
            data: { ...node.data, onBrainstorm: handleBrainstormRequest }
        }));

        setNodes(loadedNodes);
        setEdges(project.edges);
        setProjectName(project.name);
        setProjectId(project.id);

        if (project.viewport) {
            setViewport(project.viewport);
        } else {
            setTimeout(() => fitView({ padding: 0.2 }), 100);
        }

        setShowLoadModal(false);
        showToast(`Đã tải "${project.name}"`, 'success');
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Xóa sơ đồ này?')) {
            const success = await MindmapService.deleteMindmap(id);
            if (success) {
                setSavedProjects(prev => prev.filter(p => p.id !== id));
                showToast('Đã xóa!', 'success');
            } else {
                showToast('Lỗi khi xóa!', 'error');
            }
        }
    };

    const handleDownload = async () => {
        const nodesBounds = getNodesBounds(getNodes());
        if (nodesBounds.width === 0 || nodesBounds.height === 0) return;

        const imageWidth = nodesBounds.width + 100;
        const imageHeight = nodesBounds.height + 100;
        const transform = `translate(${50 - nodesBounds.x}px, ${50 - nodesBounds.y}px)`;

        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) return;

        try {
            const dataUrl = await toPng(viewportEl, {
                backgroundColor: '#FCFDFC',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: transform,
                },
                filter: (node) => {
                    if (node.classList && node.classList.contains('react-flow__minimap')) return false;
                    if (node.classList && node.classList.contains('react-flow__controls')) return false;
                    return true;
                }
            });

            const link = document.createElement('a');
            link.download = `mindmap-${projectName || 'export'}.png`;
            link.href = dataUrl;
            link.click();
            showToast('Xuất ảnh thành công (Full HD)', 'success');
        } catch (err) {
            showToast('Lỗi khi xuất ảnh. Thử lại sau.', 'error');
        }
    };

    const handleBrainstormRequest = useCallback(async (label: string) => {
        setSelectedNodeLabel(label);
        setShowSidebar(true);
        setSidebarLoading(true);
        setSidebarContent(null);

        const currentNodes = getNodes();
        const rootNode = currentNodes.find(n => n.type === 'input' || n.type === 'root');
        const currentRootLabel = rootNode?.data?.label;
        const rootContext = currentRootLabel || keyword || projectName;
        setActiveRootContext(rootContext);

        try {
            const result = await brainstormNodeDetails(label, rootContext);
            setSidebarContent(result);
        } catch (error) {
            showToast('Lỗi khi phân tích chi tiết.', 'error');
        } finally {
            setSidebarLoading(false);
        }
    }, [getNodes, keyword, projectName]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Đã sao chép', 'success');
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Header */}
            <FeatureHeader
                icon={BrainCircuit}
                eyebrow="VISUAL BRAINSTORMING"
                title="Mindmap Generator"
                subline="Vẽ bản đồ tư duy AI để trực quan hóa ý tưởng và mở rộng góc nhìn chiến lược."
            >
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowLoadModal(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                    >
                        <FolderOpen size={16} /> Mở
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveProject}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95"
                    >
                        <Save size={16} /> Lưu
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={nodes.length === 0}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition-all hover:border-stone-400 hover:bg-stone-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </FeatureHeader>

            <div className="flex shrink-0 flex-col gap-3 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-4 z-30">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <input
                            className="w-full bg-transparent text-lg font-medium text-stone-900 outline-none placeholder:text-stone-300"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Tên sơ đồ..."
                        />
                    </div>
                </div>

                {/* Input Fields */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[180px] md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} strokeWidth={1.25} />
                        <input
                            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                            placeholder="Chủ đề (VD: Sữa hạt, AI, Marketing...)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>

                    <div className="relative flex-1 min-w-[140px] md:max-w-xs">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} strokeWidth={1.25} />
                        <input
                            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                            placeholder="Mục tiêu (VD: Kinh doanh...)"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />
                    </div>

                    {showAdvanced && (
                        <>
                            <div className="relative w-40">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} strokeWidth={1.25} />
                                <input
                                    className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                    placeholder="Đối tượng"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                />
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                                <Layers size={14} strokeWidth={1.25} className="text-stone-400" />
                                <span className="text-xs font-medium text-stone-500">Độ sâu</span>
                                <select
                                    value={depth}
                                    onChange={(e) => setDepth(Number(e.target.value))}
                                    className="bg-transparent text-sm font-semibold text-stone-700 outline-none"
                                >
                                    <option value={2}>2 cấp</option>
                                    <option value={3}>3 cấp</option>
                                    <option value={4}>4 cấp</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-700"
                    >
                        {showAdvanced ? 'Thu gọn' : '+ Tùy chọn'}
                    </button>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.25} /> : <Sparkles size={16} strokeWidth={1.25} />}
                        Vẽ Mindmap
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* MAIN CANVAS */}
                <div className="flex-1 h-full relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-[#FCFDFC]"
                        minZoom={0.1}
                    >
                        <Background color="#e7e5e4" gap={20} size={1} />
                        <Controls showInteractive={false} className="rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" />

                        <Panel position="top-left" className="m-4">
                            {isAddingNode ? (
                                <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                                    <input
                                        autoFocus
                                        className="w-40 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400"
                                        placeholder="Tên Node..."
                                        value={newNodeLabel}
                                        onChange={e => setNewNodeLabel(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && confirmAddNode()}
                                    />
                                    <button
                                        type="button"
                                        onClick={confirmAddNode}
                                        className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-1.5 transition-colors hover:border-stone-400 hover:bg-stone-50"
                                    >
                                        <Check size={16} strokeWidth={1.25} className="text-stone-700" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingNode(false)}
                                        className="inline-flex items-center justify-center rounded-lg bg-stone-100 p-1.5 transition-colors hover:bg-stone-200"
                                    >
                                        <X size={16} strokeWidth={1.25} className="text-stone-500" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAddNodeMode}
                                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-400 hover:bg-stone-50"
                                >
                                    <PlusCircle size={17} strokeWidth={1.25} /> Thêm Node Thủ công
                                </button>
                            )}
                        </Panel>
                    </ReactFlow>

                    {nodes.length === 0 && !isGenerating && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-stone-400">
                                <BrainCircuit size={64} strokeWidth={0.75} className="mx-auto mb-4 text-stone-200" />
                                <p className="text-base font-medium">Nhập từ khóa để AI vẽ hoặc tạo thủ công.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR */}
                <div
                    className={`w-96 shrink-0 border-l border-stone-200/90 bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col z-20 absolute right-0 top-0 bottom-0 ${
                        showSidebar ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-5 py-4">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-stone-900">
                            <Sparkles size={16} strokeWidth={1.25} className="text-stone-500" /> Brainstorm Assistant
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowSidebar(false)}
                            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
                        >
                            <X size={18} strokeWidth={1.25} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {sidebarLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-stone-400">
                                <div className="relative h-10 w-10">
                                    <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-stone-600 animate-spin"></div>
                                </div>
                                <p className="text-sm font-medium">Đang phân tích ý tưởng...</p>
                            </div>
                        ) : sidebarContent ? (
                            <div>
                                <div className="mb-5">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Khía cạnh mổ xẻ</div>
                                    <h2 className="text-base font-semibold text-stone-900">{selectedNodeLabel}</h2>
                                    {activeRootContext && (
                                        <>
                                            <div className="mt-4 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Chủ đề chính (Bối cảnh)</div>
                                            <h2 className="text-lg font-bold text-stone-900">{activeRootContext}</h2>
                                        </>
                                    )}
                                </div>

                                {/* Content Angles */}
                                <div className="mb-6 space-y-2">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                        <ChevronRight size={14} strokeWidth={1.25} className="text-stone-400" /> Góc nhìn nội dung
                                    </h4>
                                    {sidebarContent.angles.map((angle, i) => (
                                        <div key={i} className="group relative rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-700 transition-colors hover:border-stone-400">
                                            {angle}
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(angle)}
                                                className="absolute right-2 top-2 rounded-lg p-1 text-stone-400 opacity-0 transition-all hover:bg-white hover:text-stone-700 group-hover:opacity-100"
                                            >
                                                <Copy size={12} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Headlines */}
                                <div className="mb-6 space-y-2">
                                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                        <ChevronRight size={14} strokeWidth={1.25} className="text-stone-400" /> Gợi ý tiêu đề
                                    </h4>
                                    {sidebarContent.headlines.map((hl, i) => (
                                        <div key={i} className="group relative rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm font-medium text-stone-800 transition-colors hover:border-stone-400">
                                            &ldquo;{hl}&rdquo;
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(hl)}
                                                className="absolute right-2 top-2 rounded-lg p-1 text-stone-400 opacity-0 transition-all hover:bg-white hover:text-stone-700 group-hover:opacity-100"
                                            >
                                                <Copy size={12} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Keywords */}
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                                        <ChevronRight size={14} strokeWidth={1.25} className="text-stone-400" /> Từ khóa liên quan
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sidebarContent.keywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900"
                                                onClick={() => copyToClipboard(kw)}
                                            >
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-sm text-stone-400">
                                <p>Chọn một node và bấm nút &ldquo;Brainstorm&rdquo; để xem phân tích chi tiết.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Load Modal */}
            {showLoadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-lg flex-col rounded-2xl border border-stone-200/90 bg-white shadow-2xl max-h-[80vh]">
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-stone-900">Mở sơ đồ đã lưu</h3>
                            <button
                                type="button"
                                onClick={() => setShowLoadModal(false)}
                                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
                            >
                                <X size={18} strokeWidth={1.25} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-2">
                            {savedProjects.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có sơ đồ nào được lưu.</div>
                            ) : (
                                savedProjects.map(p => (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoadProject(p)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoadProject(p)}
                                        className="group flex items-start justify-between gap-3 rounded-2xl border border-stone-200/90 p-4 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div>
                                            <p className="font-semibold text-stone-900">{p.name}</p>
                                            <p className="mt-0.5 text-xs text-stone-400">{new Date(p.updatedAt).toLocaleDateString('vi-VN')} &bull; {p.nodes.length} nodes</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteProject(e, p.id)}
                                            className="shrink-0 rounded-lg p-2 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            aria-label="Xóa"
                                        >
                                            <Trash2 size={16} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

const MindmapGenerator: React.FC = () => {
    return (
        <ReactFlowProvider>
            <MindmapGeneratorContent />
        </ReactFlowProvider>
    );
};

export default MindmapGenerator;
