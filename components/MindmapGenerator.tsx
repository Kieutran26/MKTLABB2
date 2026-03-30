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
    getViewportForBounds
} from 'reactflow';
import { BrainCircuit, Download, Loader2, Sparkles, Search, X, Copy, PlusCircle, ChevronRight, Plus, Save, FolderOpen, Trash2, Check, Target, Users, Layers, Cloud } from 'lucide-react';
import { generateMindmapData, brainstormNodeDetails, DeepDiveResult, MindmapInput } from '../services/geminiService';
import { toPng } from 'html-to-image';
import { Toast, ToastType } from './Toast';
import { MindmapService } from '../services/mindmapService';
import { MindmapProject } from '../types';

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
                    className="bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-md flex items-center gap-1 hover:bg-indigo-700 transition-colors"
                >
                    <Sparkles size={10} /> Brainstorm
                </button>
            </NodeToolbar>

            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-400" />
            <div className="px-4 py-2 rounded-lg shadow-sm border bg-white border-slate-200 min-w-[120px] text-center font-medium text-sm text-slate-700 hover:border-indigo-300 transition-colors">
                {label}
            </div>
            <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-400" />
        </>
    );
});

const nodeTypes = {
    custom: CustomNode
};

const MindmapGeneratorContent: React.FC = () => {
    // Core State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // V2 Input fields
    const [keyword, setKeyword] = useState('');
    const [goal, setGoal] = useState('');
    const [audience, setAudience] = useState('');
    const [depth, setDepth] = useState(3);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Project State
    const [projectId, setProjectId] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [savedProjects, setSavedProjects] = useState<MindmapProject[]>([]);
    const [showLoadModal, setShowLoadModal] = useState(false);

    // UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Sidebar State
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState('');
    const [activeRootContext, setActiveRootContext] = useState('');
    const [sidebarContent, setSidebarContent] = useState<DeepDiveResult | null>(null);

    // Add Node State
    const [isAddingNode, setIsAddingNode] = useState(false);
    const [newNodeLabel, setNewNodeLabel] = useState('');

    const { fitView, getNodes, getViewport, setViewport } = useReactFlow();

    // Load from Supabase on mount and migrate from localStorage
    useEffect(() => {
        const loadData = async () => {
            // Try to migrate from localStorage first (one-time)
            const migrated = await MindmapService.migrateFromLocalStorage();
            if (migrated > 0) {
                showToast(`☁️ Đã migrate ${migrated} sơ đồ lên cloud!`, 'success');
            }

            // Load from Supabase
            const projects = await MindmapService.getMindmaps();
            setSavedProjects(projects);
        };
        loadData();
    }, []);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // --- GRAPH INTERACTIONS ---

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds));
    }, [setEdges]);

    // Manual Add Node Logic
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
                x: Math.random() * 400, // Random pos near center for visibility
                y: Math.random() * 400
            },
            data: { label: newNodeLabel, onBrainstorm: handleBrainstormRequest },
            type: 'custom',
        };

        setNodes((nds) => [...nds, newNode]);
        setIsAddingNode(false);
        showToast("Đã thêm node mới", "success");
    };

    // --- LAYOUT ALGORITHM ---
    const calculateLayout = (rawNodes: any[], rawEdges: any[]) => {
        const root = rawNodes.find(n => n.type === 'root');
        if (!root) return { nodes: [], edges: [] };

        const layoutNodes: Node[] = [];
        // Root
        layoutNodes.push({
            id: root.id,
            position: { x: 0, y: 0 },
            data: { label: root.label, onBrainstorm: handleBrainstormRequest },
            type: 'input',
            style: {
                background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px',
                padding: '15px 25px', fontSize: '16px', fontWeight: 'bold', width: 180, textAlign: 'center'
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
            style: { stroke: '#94a3b8', strokeWidth: 2 },
        }));

        return { nodes: layoutNodes, edges: layoutEdges };
    };

    const handleGenerate = async () => {
        if (!keyword.trim()) {
            showToast("Vui lòng nhập từ khóa", "error");
            return;
        }
        setIsGenerating(true);
        setShowSidebar(false);
        try {
            // V2: Use MindmapInput object with goal, audience, depth
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
                setProjectId(null); // Reset project context on new gen
                setProjectName(keyword);
                setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
            } else {
                showToast("Không thể tạo bản đồ.", "error");
            }
        } catch (error) {
            showToast("Lỗi kết nối AI.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- SAVE & LOAD ---
    const handleSaveProject = async () => {
        if (nodes.length === 0) return;

        const nameToSave = projectName.trim() || `Mindmap ${new Date().toLocaleDateString()}`;
        const currentId = projectId || Date.now().toString();
        const viewport = getViewport();

        // Must strip out function callbacks before saving to JSON
        const nodesToSave = nodes.map(node => ({
            ...node,
            data: { label: node.data.label } // Remove onBrainstorm callback
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
            showToast("☁️ Đã lưu sơ đồ lên cloud!", "success");
        } else {
            showToast("Lỗi khi lưu!", "error");
        }
    };

    const handleLoadProject = (project: MindmapProject) => {
        // Re-attach callbacks when loading
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
        showToast(`Đã tải "${project.name}"`, "success");
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa sơ đồ này?")) {
            const success = await MindmapService.deleteMindmap(id);
            if (success) {
                setSavedProjects(prev => prev.filter(p => p.id !== id));
                showToast("Đã xóa!", "success");
            } else {
                showToast("Lỗi khi xóa!", "error");
            }
        }
    };

    // --- EXPORT FIX (CRITICAL) ---
    const handleDownload = async () => {
        const nodesBounds = getNodesBounds(getNodes());
        if (nodesBounds.width === 0 || nodesBounds.height === 0) return;

        const imageWidth = nodesBounds.width + 100; // Add padding
        const imageHeight = nodesBounds.height + 100;
        const transform = `translate(${50 - nodesBounds.x}px, ${50 - nodesBounds.y}px)`; // Adjust for padding

        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) return;

        try {
            const dataUrl = await toPng(viewportEl, {
                backgroundColor: '#F8FAFC',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: transform,
                },
                // Filter out ReactFlow controls or overlays if they cause issues
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
            showToast("Xuất ảnh thành công (Full HD)", "success");
        } catch (err) {
            console.error(err);
            showToast("Lỗi khi xuất ảnh. Thử lại sau.", "error");
        }
    };

    // --- BRAINSTORM ASSISTANT ---
    const handleBrainstormRequest = useCallback(async (label: string) => {
        setSelectedNodeLabel(label);
        setShowSidebar(true);
        setSidebarLoading(true);
        setSidebarContent(null);

        // Sử dụng getNodes() để luôn lấy state mới nhất của sơ đồ thay vì closure cũ
        const currentNodes = getNodes();
        const rootNode = currentNodes.find(n => n.type === 'input' || n.type === 'root');

        // Backup bằng tên keyword hoặc projectName nếu không tìm thấy root (để chắc chắn luôn có context)
        const currentRootLabel = rootNode?.data?.label;
        const rootContext = currentRootLabel || keyword || projectName;
        setActiveRootContext(rootContext);

        try {
            const result = await brainstormNodeDetails(label, rootContext);
            setSidebarContent(result);
        } catch (error) {
            showToast("Lỗi khi phân tích chi tiết.", "error");
        } finally {
            setSidebarLoading(false);
        }
    }, [getNodes, keyword, projectName]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Đã sao chép", "success");
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-sm z-30 relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                            <BrainCircuit size={20} strokeWidth={1.5} />
                        </div>
                        <input
                            className="font-bold text-lg text-slate-800 bg-transparent border-none focus:ring-0 placeholder:text-slate-300 w-48"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Tên sơ đồ..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowLoadModal(true)} className="text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border border-slate-200">
                            <FolderOpen size={18} /> Mở
                        </button>
                        <button onClick={handleSaveProject} className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border border-indigo-100">
                            <Save size={18} /> Lưu
                        </button>
                        <button onClick={handleDownload} disabled={nodes.length === 0} className="text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                            <Download size={18} /> Export
                        </button>
                    </div>
                </div>

                {/* V2 Input Fields */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
                            placeholder="Chủ đề (VD: Sữa hạt, AI, Marketing...)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                    </div>

                    <div className="relative flex-1 max-w-xs">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={14} />
                        <input
                            className="w-full pl-9 pr-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-amber-400"
                            placeholder="Mục tiêu (VD: Kinh doanh, Học tập...)"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />
                    </div>

                    {showAdvanced && (
                        <>
                            <div className="relative w-40">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                                <input
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="Đối tượng"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                <Layers size={14} className="text-purple-500" />
                                <span className="text-xs text-slate-500">Độ sâu</span>
                                <select
                                    value={depth}
                                    onChange={(e) => setDepth(Number(e.target.value))}
                                    className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
                                >
                                    <option value={2}>2 cấp</option>
                                    <option value={3}>3 cấp</option>
                                    <option value={4}>4 cấp</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-slate-400 hover:text-indigo-600 text-xs font-medium px-2 py-1"
                    >
                        {showAdvanced ? 'Thu gọn' : '+ Tùy chọn'}
                    </button>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        Vẽ Mindmap
                    </button>
                </div>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                {/* MAIN CANVAS */}
                <div className="flex-1 h-full relative bg-slate-50">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50"
                        minZoom={0.1}
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls showInteractive={false} className="bg-white shadow-md border border-slate-100 rounded-lg" />

                        <Panel position="top-left" className="m-4">
                            {isAddingNode ? (
                                <div className="flex gap-2 bg-white p-2 rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        autoFocus
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 w-40"
                                        placeholder="Tên Node..."
                                        value={newNodeLabel}
                                        onChange={e => setNewNodeLabel(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && confirmAddNode()}
                                    />
                                    <button onClick={confirmAddNode} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700"><Check size={16} /></button>
                                    <button onClick={() => setIsAddingNode(false)} className="bg-slate-100 text-slate-500 p-1.5 rounded-lg hover:bg-slate-200"><X size={16} /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddNodeMode}
                                    className="bg-white text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-md border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-2"
                                >
                                    <PlusCircle size={18} /> Thêm Node Thủ Công
                                </button>
                            )}
                        </Panel>
                    </ReactFlow>

                    {nodes.length === 0 && !isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-slate-400">
                                <BrainCircuit size={64} strokeWidth={0.5} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-lg font-medium">Nhập từ khóa để AI vẽ hoặc tạo thủ công.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR */}
                <div className={`w-96 bg-white border-l border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col z-20 absolute right-0 top-0 bottom-0 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-600" /> Brainstorm Assistant
                        </h3>
                        <button onClick={() => setShowSidebar(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {sidebarLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                                <p className="text-sm font-medium">Đang phân tích ý tưởng...</p>
                            </div>
                        ) : sidebarContent ? (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <div className="mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khía cạnh mổ xẻ</span>
                                    <h2 className="text-sm font-bold text-slate-600 mt-1">{selectedNodeLabel}</h2>
                                    {activeRootContext && (
                                        <>
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-3 block">Chủ đề chính (Bối cảnh)</span>
                                            <h2 className="text-lg font-bold text-indigo-900 mt-0.5">{activeRootContext}</h2>
                                        </>
                                    )}
                                </div>

                                {/* Content Angles */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                        <ChevronRight size={14} className="text-indigo-500" /> Góc nhìn nội dung
                                    </h4>
                                    {sidebarContent.angles.map((angle, i) => (
                                        <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-700 hover:border-indigo-200 transition-colors group relative">
                                            {angle}
                                            <button onClick={() => copyToClipboard(angle)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded text-slate-400 hover:text-indigo-600 transition-all">
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Headlines */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                        <ChevronRight size={14} className="text-pink-500" /> Gợi ý tiêu đề
                                    </h4>
                                    {sidebarContent.headlines.map((hl, i) => (
                                        <div key={i} className="bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-sm text-slate-800 font-medium hover:border-pink-200 transition-colors group relative">
                                            "{hl}"
                                            <button onClick={() => copyToClipboard(hl)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded text-pink-400 hover:text-pink-600 transition-all">
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Keywords */}
                                <div>
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2 mb-3">
                                        <ChevronRight size={14} className="text-green-500" /> Từ khóa liên quan
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sidebarContent.keywords.map((kw, i) => (
                                            <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded-md text-xs text-slate-600 font-medium cursor-pointer hover:border-indigo-300 hover:text-indigo-600 transition-colors" onClick={() => copyToClipboard(kw)}>
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm">Chọn một node và bấm nút "Brainstorm" để xem phân tích chi tiết.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Load Modal */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800">Mở Sơ đồ đã lưu</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                            {savedProjects.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Chưa có sơ đồ nào được lưu.</div>
                            ) : (
                                savedProjects.map(p => (
                                    <div key={p.id} onClick={() => handleLoadProject(p)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-center group">
                                        <div>
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{new Date(p.updatedAt).toLocaleDateString('vi-VN')} • {p.nodes.length} nodes</div>
                                        </div>
                                        <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
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
}

export default MindmapGenerator;