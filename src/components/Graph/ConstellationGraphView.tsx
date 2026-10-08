import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { NoteEntry, Topic } from '../../types';
import { MONTH_NAMES_ZH } from '../../utils/dateUtils';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowUpRight,
  Calendar,
  Layers
} from 'lucide-react';

interface ConstellationGraphViewProps {
  notes: NoteEntry[];
  topics: Topic[];
  currentYear: number;
  onOpenEditor: (note: NoteEntry) => void;
  onSelectDate: (date: string) => void;
}

interface GraphNode {
  id: string;
  type: 'topic' | 'note' | 'tag';
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  topicId?: string;
  note?: NoteEntry;
  date?: string;
  connections: number;
}

interface GraphLink {
  sourceId: string;
  targetId: string;
  type: 'topic' | 'wikilink' | 'tag';
}

export const ConstellationGraphView: React.FC<ConstellationGraphViewProps> = ({
  notes,
  topics,
  currentYear,
  onOpenEditor,
  onSelectDate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Time scrubber state: 0 = all, 1-12 = up to month N
  const [selectedMonthLimit, setSelectedMonthLimit] = useState<number>(0);
  const [isPlayingTimeLapse, setIsPlayingTimeLapse] = useState<boolean>(false);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hovered / selected node
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Pan & Zoom transform
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingCanvasRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Nodes & Links storage
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Topic lookup map
  const topicMap = useMemo(() => {
    return new Map(topics.map(t => [t.id, t]));
  }, [topics]);

  // Filter notes by year and time-travel month limit
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const [y, m] = n.date.split('-').map(Number);
      if (y !== currentYear) return false;
      if (selectedMonthLimit > 0 && m > selectedMonthLimit) return false;
      if (selectedTopicFilter !== 'all' && n.topicId !== selectedTopicFilter) return false;
      return true;
    });
  }, [notes, currentYear, selectedMonthLimit, selectedTopicFilter]);

  // Build Graph Model (Nodes & Links)
  useEffect(() => {
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const centerX = 600;
    const centerY = 400;

    // 1. Add active topic centers
    const activeTopics = topics.filter(t => 
      selectedTopicFilter === 'all' || selectedTopicFilter === t.id
    );

    activeTopics.forEach((t, index) => {
      const angle = (index / activeTopics.length) * 2 * Math.PI;
      const dist = 220;
      const topicNode: GraphNode = {
        id: `topic_${t.id}`,
        type: 'topic',
        label: t.name,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 20,
        color: t.color,
        topicId: t.id,
        connections: 0,
      };
      newNodes.push(topicNode);
      nodeMap.set(topicNode.id, topicNode);
    });

    // 2. Add Note nodes
    filteredNotes.forEach((n, idx) => {
      const topic = topicMap.get(n.topicId);
      const parentTopicNode = nodeMap.get(`topic_${n.topicId}`);
      
      const angle = (idx / Math.max(1, filteredNotes.length)) * 2 * Math.PI;
      const offsetDist = 60 + (idx % 5) * 25;
      const startX = parentTopicNode 
        ? parentTopicNode.x + Math.cos(angle) * offsetDist + (Math.random() * 20 - 10)
        : centerX + Math.cos(angle) * (180 + Math.random() * 80);
      const startY = parentTopicNode 
        ? parentTopicNode.y + Math.sin(angle) * offsetDist + (Math.random() * 20 - 10)
        : centerY + Math.sin(angle) * (180 + Math.random() * 80);

      const noteNode: GraphNode = {
        id: `note_${n.id}`,
        type: 'note',
        label: n.title,
        subLabel: `${n.date} · ${topic?.name || '随笔'}`,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: n.pinned ? 10 : 7,
        color: topic?.color || '#a855f7',
        topicId: n.topicId,
        note: n,
        date: n.date,
        connections: 0,
      };

      newNodes.push(noteNode);
      nodeMap.set(noteNode.id, noteNode);

      // Link to Topic center
      if (parentTopicNode) {
        newLinks.push({
          sourceId: noteNode.id,
          targetId: parentTopicNode.id,
          type: 'topic',
        });
        parentTopicNode.connections++;
        noteNode.connections++;
      }
    });

    // 3. Extract Wiki-links [[...]]
    filteredNotes.forEach(n => {
      const wikiMatches = n.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const match of wikiMatches) {
        const targetTitle = match[1]?.trim().toLowerCase();
        if (!targetTitle) continue;

        // Find linked note
        const targetNote = filteredNotes.find(other => 
          other.id !== n.id && (
            other.title.toLowerCase().includes(targetTitle) ||
            targetTitle.includes(other.title.toLowerCase())
          )
        );

        if (targetNote) {
          const sourceNodeId = `note_${n.id}`;
          const targetNodeId = `note_${targetNote.id}`;
          if (nodeMap.has(sourceNodeId) && nodeMap.has(targetNodeId)) {
            newLinks.push({
              sourceId: sourceNodeId,
              targetId: targetNodeId,
              type: 'wikilink',
            });
            const s = nodeMap.get(sourceNodeId);
            const t = nodeMap.get(targetNodeId);
            if (s) s.connections++;
            if (t) t.connections++;
          }
        }
      }
    });

    nodesRef.current = newNodes;
    linksRef.current = newLinks;
  }, [filteredNotes, topics, topicMap, selectedTopicFilter, currentYear]);

  // Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Simulation loop
    const stepPhysics = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // 1. Repulsion between all pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 100;
          const dist = Math.sqrt(distSq);

          if (dist < 350) {
            const force = (a.radius * b.radius * 45) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (a !== draggedNodeRef.current) {
              a.vx -= fx;
              a.vy -= fy;
            }
            if (b !== draggedNodeRef.current) {
              b.vx += fx;
              b.vy += fy;
            }
          }
        }
      }

      // 2. Attraction along links
      for (const link of links) {
        const source = nodeMap.get(link.sourceId);
        const target = nodeMap.get(link.targetId);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = link.type === 'wikilink' ? 100 : 130;
        const force = (dist - desiredDist) * 0.02;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (source !== draggedNodeRef.current) {
          source.vx += fx;
          source.vy += fy;
        }
        if (target !== draggedNodeRef.current) {
          target.vx -= fx;
          target.vy -= fy;
        }
      }

      // 3. Central gravity & update positions
      const centerX = canvas.width / (2 * window.devicePixelRatio || 2);
      const centerY = canvas.height / (2 * window.devicePixelRatio || 2);

      for (const node of nodes) {
        if (node === draggedNodeRef.current) continue;

        // Subtle gravity to center
        node.vx += (centerX - node.x) * 0.0005;
        node.vy += (centerY - node.y) * 0.0005;

        // Damping
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      }
    };

    // Render loop
    const render = () => {
      if (!isRunning) return;
      stepPhysics();

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Deep space celestial background
      ctx.fillStyle = '#0a0c13';
      ctx.fillRect(0, 0, width, height);

      // Render cosmic background stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let s = 0; s < 40; s++) {
        const sx = ((s * 137.5) % width);
        const sy = ((s * 223.7) % height);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Apply zoom & pan transform
      const { x: panX, y: panY, scale } = transformRef.current;
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // 1. Draw Links
      for (const link of links) {
        const source = nodeMap.get(link.sourceId);
        const target = nodeMap.get(link.targetId);
        if (!source || !target) continue;

        const isHighlighted = 
          hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);

        if (link.type === 'wikilink') {
          // Curved luminous arc for wiki links
          const midX = (source.x + target.x) / 2 + (target.y - source.y) * 0.15;
          const midY = (source.y + target.y) / 2 - (target.x - source.x) * 0.15;
          ctx.quadraticCurveTo(midX, midY, target.x, target.y);
          ctx.strokeStyle = isHighlighted 
            ? 'rgba(245, 158, 11, 0.9)' 
            : 'rgba(245, 158, 11, 0.35)';
          ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
        } else {
          // Normal topic connection line
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = isHighlighted
            ? 'rgba(168, 85, 247, 0.8)'
            : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = isHighlighted ? 2 : 1;
        }
        ctx.stroke();
      }

      // 2. Draw Nodes
      for (const node of nodes) {
        const isHovered = hoveredNode?.id === node.id;
        const isMatchSearch = searchQuery && 
          node.label.toLowerCase().includes(searchQuery.toLowerCase());

        // Halo aura glow
        const glowRadius = node.radius + (isHovered ? 12 : 5);
        const gradient = ctx.createRadialGradient(
          node.x, node.y, node.radius * 0.3,
          node.x, node.y, glowRadius
        );
        gradient.addColorStop(0, node.color + 'aa');
        gradient.addColorStop(1, node.color + '00');

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node core circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isHovered ? 2.5 : 1;
        ctx.stroke();

        // Search highlight pulse ring
        if (isMatchSearch) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Topic Node label
        if (node.type === 'topic' || isHovered || isMatchSearch) {
          ctx.font = node.type === 'topic' ? 'bold 12px sans-serif' : '11px sans-serif';
          ctx.fillStyle = '#f3f4f6';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(
            node.label.length > 14 ? node.label.substring(0, 14) + '...' : node.label,
            node.x,
            node.y + node.radius + 5
          );
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [hoveredNode, searchQuery]);

  // Center & Fit graph initial position
  const handleResetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  }, []);

  // Time-lapse auto play loop
  useEffect(() => {
    if (!isPlayingTimeLapse) return;
    const interval = setInterval(() => {
      setSelectedMonthLimit(prev => {
        if (prev >= 12) {
          setIsPlayingTimeLapse(false);
          return 0; // return to all
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlayingTimeLapse]);

  // Mouse event coordinates conversion
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, screenX: e.clientX, screenY: e.clientY };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { x: panX, y: panY, scale } = transformRef.current;
    return {
      x: (clientX - panX) / scale,
      y: (clientY - panY) / scale,
      screenX: e.clientX,
      screenY: e.clientY,
    };
  };

  // Find node under mouse
  const findNodeAt = (x: number, y: number): GraphNode | null => {
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
        return node;
      }
    }
    return null;
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clickedNode = findNodeAt(coords.x, coords.y);

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingCanvasRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Node dragging
    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = coords.x;
      draggedNodeRef.current.y = coords.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // Canvas panning
    if (isDraggingCanvasRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Node hover detection
    const hovered = findNodeAt(coords.x, coords.y);
    setHoveredNode(hovered);
    if (hovered) {
      setTooltipPos({ x: coords.screenX, y: coords.screenY });
    } else {
      setTooltipPos(null);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(3, Math.max(0.3, transformRef.current.scale * zoomFactor));
    transformRef.current.scale = newScale;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clicked = findNodeAt(coords.x, coords.y);
    if (clicked && clicked.type === 'note' && clicked.note) {
      onOpenEditor(clicked.note);
    } else if (clicked && clicked.type === 'topic' && clicked.topicId) {
      setSelectedTopicFilter(prev => prev === clicked.topicId ? 'all' : clicked.topicId!);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[580px] bg-[#090b10] rounded-2xl border border-border overflow-hidden flex flex-col shadow-2xl">
      {/* Top Filter & Toolbar HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Stats Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-panel/90 backdrop-blur-md border border-border/80 px-3.5 py-2 rounded-xl shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-main flex items-center gap-1.5">
              <span>时空星云关系图谱</span>
              <span className="text-[10px] text-violet-400 font-mono px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20">
                Constellation
              </span>
            </h2>
            <p className="text-[10px] text-muted font-mono">
              星宿节点: {nodesRef.current.length} · 联结引力: {linksRef.current.length}
            </p>
          </div>
        </div>

        {/* Center: Search in Graph */}
        <div className="pointer-events-auto flex items-center gap-2 bg-panel/90 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-xl shadow-lg w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="在星图中检索节点与概念..."
            className="w-full bg-transparent text-xs text-main placeholder-muted/60 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-muted hover:text-main px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Topic Filters & Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-panel/90 backdrop-blur-md border border-border/80 p-1.5 rounded-xl shadow-lg">
          {/* Topic selector */}
          <div className="flex items-center gap-1 pr-2 border-r border-border/60">
            <button
              onClick={() => setSelectedTopicFilter('all')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedTopicFilter === 'all'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              全部星系
            </button>
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopicFilter(t.id)}
                className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all ${
                  selectedTopicFilter === t.id
                    ? 'ring-2 ring-violet-400 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: t.color + '40', color: t.color }}
                title={t.name}
              >
                ●
              </button>
            ))}
          </div>

          {/* Zoom & Reset Buttons */}
          <button
            onClick={() => {
              transformRef.current.scale = Math.min(3, transformRef.current.scale * 1.2);
            }}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
            title="放大视角"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              transformRef.current.scale = Math.max(0.3, transformRef.current.scale * 0.8);
            }}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
            title="缩小视角"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card transition-colors"
            title="居中重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      />

      {/* Floating Node Hover Card */}
      {hoveredNode && tooltipPos && (
        <div
          className="fixed pointer-events-none z-50 bg-panel/95 backdrop-blur-xl border border-border p-3.5 rounded-xl shadow-2xl max-w-xs transition-opacity animate-fade-in text-left"
          style={{
            left: Math.min(window.innerWidth - 320, tooltipPos.x + 15),
            top: Math.min(window.innerHeight - 180, tooltipPos.y + 15),
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: hoveredNode.color }}
            />
            <span className="text-xs font-bold text-main truncate">
              {hoveredNode.label}
            </span>
          </div>

          {hoveredNode.subLabel && (
            <div className="text-[11px] text-muted flex items-center gap-1.5 mb-2 font-mono">
              <Calendar className="w-3 h-3 text-violet-400" />
              <span>{hoveredNode.subLabel}</span>
            </div>
          )}

          {hoveredNode.note && (
            <p className="text-[11px] text-muted/90 line-clamp-2 leading-relaxed mb-2 font-serif bg-card/60 p-2 rounded-lg border border-border/40">
              {hoveredNode.note.content.replace(/[#*`>~-]/g, '').trim().substring(0, 80)}...
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] text-muted/70 pt-1 border-t border-border/50">
            <span>引力连结: {hoveredNode.connections} 条</span>
            {hoveredNode.type === 'note' && (
              <span className="text-violet-400 flex items-center gap-0.5 font-medium">
                点击进入随笔 <ArrowUpRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom: Time-Travel Scrubber (时空演化滑块) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-panel/95 backdrop-blur-xl border border-border/90 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 w-full max-w-2xl">
          {/* Play / Pause Time Lapse */}
          <button
            onClick={() => setIsPlayingTimeLapse(!isPlayingTimeLapse)}
            className={`p-2 rounded-xl text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isPlayingTimeLapse
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
            }`}
            title={isPlayingTimeLapse ? '暂停演进' : '自动播放全年月度星系演进'}
          >
            {isPlayingTimeLapse ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span className="hidden sm:inline">
              {isPlayingTimeLapse ? '演进中' : '时空推演'}
            </span>
          </button>

          {/* Month Slider */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted">
                时空切片: {selectedMonthLimit === 0 ? `全年全景 (${currentYear})` : `${currentYear}年 1月 - ${selectedMonthLimit}月`}
              </span>
              <span className="text-violet-400 font-semibold">
                {selectedMonthLimit === 0 ? '全量星宿' : `${MONTH_NAMES_ZH[selectedMonthLimit - 1]}节点`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={selectedMonthLimit}
                onChange={(e) => {
                  setSelectedMonthLimit(Number(e.target.value));
                  if (isPlayingTimeLapse) setIsPlayingTimeLapse(false);
                }}
                className="w-full accent-violet-500 h-1.5 bg-card rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => setSelectedMonthLimit(0)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  selectedMonthLimit === 0
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 font-medium'
                    : 'text-muted border-border hover:text-main'
                }`}
              >
                全景
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
