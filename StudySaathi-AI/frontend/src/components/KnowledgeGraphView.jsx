import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../utils/api';

// Map exam names → available graph keys
const EXAM_GRAPHS = {
  JEE:      ['JEE_PHYSICS', 'JEE_MATH'],
  'JEE Main': ['JEE_PHYSICS', 'JEE_MATH'],
  'JEE Advanced': ['JEE_PHYSICS', 'JEE_MATH'],
  NEET:     ['JEE_PHYSICS', 'JEE_MATH'],  // Physics overlap; Biology graph TBD
  default:  ['JEE_PHYSICS', 'JEE_MATH'],
};

const GRAPH_LABELS = {
  JEE_PHYSICS: '⚡ JEE Physics',
  JEE_MATH:    '📐 JEE Mathematics',
};

// Bloom's level labels for tooltip
const BLOOMS = ['', 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const BLOOMS_COLORS = ['', 'bg-gray-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-orange-200', 'bg-red-200'];

const KnowledgeGraphView = () => {
  const { user, userProfile } = useAuth();
  const [graph, setGraph] = useState(null);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('path');   // 'path' | 'all' | 'unlocked'
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Determine available graph keys from exam
  const examName = userProfile?.examName || 'default';
  const availableKeys = EXAM_GRAPHS[examName] || EXAM_GRAPHS.default;

  useEffect(() => {
    if (user && availableKeys.length > 0) {
      const key = availableKeys[0];
      setSelectedKey(key);
      fetchGraph(key);
    }
  }, [user, userProfile?.examName]);

  const fetchGraph = async (examKey) => {
    setLoading(true);
    setGraph(null);
    setSelectedNode(null);
    try {
      const [graphData, unlockedData] = await Promise.all([
        aiApi.getKnowledgeGraph(user.uid, examKey),
        aiApi.getUnlockedTopics(user.uid),
      ]);
      if (graphData.success) setGraph(graphData.graph);
      if (unlockedData.success) setUnlocked(unlockedData.unlocked || []);
    } catch (err) {
      console.error('Graph fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKey = (key) => {
    setSelectedKey(key);
    fetchGraph(key);
  };

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  // Build adjacency: prerequisite map  id → [prerequisite ids]
  const prerequisiteMap = {};
  const dependentMap = {};
  nodes.forEach(n => { prerequisiteMap[n.id] = []; dependentMap[n.id] = []; });
  edges.forEach(e => {
    e.to.forEach(toId => {
      prerequisiteMap[toId]?.push(e.from);
      dependentMap[e.from]?.push(toId);
    });
  });

  const totalEdges = edges.reduce((s, e) => s + e.to.length, 0);
  const unlockedIds = new Set(unlocked.map(n => n.id));

  // Group nodes into layers by how many prerequisites they have
  const getLayers = () => {
    const layers = {};
    nodes.forEach(n => {
      const depth = prerequisiteMap[n.id]?.length || 0;
      if (!layers[depth]) layers[depth] = [];
      layers[depth].push(n);
    });
    return Object.values(layers);
  };

  const layers = getLayers();

  if (loading) return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-100 rounded w-1/2" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">🗺️ Knowledge Graph</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Prerequisite-based learning path • {nodes.length} topics • {totalEdges} dependencies
          </p>
        </div>
      </div>

      {/* Graph selector */}
      <div className="flex gap-2 mb-4">
        {availableKeys.map(key => (
          <button
            key={key}
            onClick={() => handleSelectKey(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedKey === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {GRAPH_LABELS[key] || key}
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-4">
        {['path', 'unlocked', 'all'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v === 'path' ? '🔗 Learning Path' : v === 'unlocked' ? '🔓 Unlocked' : '📋 All Topics'}
          </button>
        ))}
      </div>

      {/* ── LEARNING PATH VIEW ── */}
      {view === 'path' && (
        <div className="space-y-3">
          {layers.map((layer, li) => (
            <div key={li}>
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1 ml-1">
                {li === 0 ? 'Foundation' : li === 1 ? 'Core Concepts' : li === 2 ? 'Advanced' : `Level ${li + 1}`}
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.map(node => {
                  const prereqs = prerequisiteMap[node.id] || [];
                  const deps = dependentMap[node.id] || [];
                  const isUnlocked = unlockedIds.has(node.id) || prereqs.length === 0;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node)}
                      className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : isUnlocked
                          ? 'border-green-300 bg-green-50 text-green-800 hover:border-green-500'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{isUnlocked ? '🔓' : '🔒'}</span>
                        <span>{node.label}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${BLOOMS_COLORS[node.bloomsLevel]}`}>
                          L{node.bloomsLevel} {BLOOMS[node.bloomsLevel]}
                        </span>
                        <span className="text-[9px] text-gray-400">{(node.examWeight * 100).toFixed(0)}% weight</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Arrow between layers */}
              {li < layers.length - 1 && (
                <div className="text-center text-gray-300 text-lg mt-2">↓</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SELECTED NODE DETAIL ── */}
      {selectedNode && view === 'path' && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
          <div className="font-bold text-indigo-800 mb-2">{selectedNode.label}</div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div><span className="text-gray-500">Bloom's Level:</span> <span className="font-medium">{BLOOMS[selectedNode.bloomsLevel]}</span></div>
            <div><span className="text-gray-500">Exam Weight:</span> <span className="font-medium">{(selectedNode.examWeight * 100).toFixed(0)}%</span></div>
          </div>
          {(prerequisiteMap[selectedNode.id]?.length > 0) && (
            <div className="mb-1">
              <span className="text-xs text-gray-500 font-medium">Prerequisites: </span>
              <span className="text-xs text-red-700">
                {prerequisiteMap[selectedNode.id].map(id => nodes.find(n => n.id === id)?.label).filter(Boolean).join(' → ')}
              </span>
            </div>
          )}
          {(dependentMap[selectedNode.id]?.length > 0) && (
            <div>
              <span className="text-xs text-gray-500 font-medium">Unlocks: </span>
              <span className="text-xs text-green-700">
                {dependentMap[selectedNode.id].map(id => nodes.find(n => n.id === id)?.label).filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── UNLOCKED VIEW ── */}
      {view === 'unlocked' && (
        <div className="space-y-2">
          {unlocked.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔓</div>
              <p className="text-gray-600 text-sm font-medium">All foundation topics are available!</p>
              <p className="text-gray-400 text-xs mt-1">Topics with no prerequisites are ready to study.</p>
            </div>
          ) : (
            unlocked.map(node => (
              <div key={node.id} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 text-sm">{node.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {BLOOMS[node.bloomsLevel]} (L{node.bloomsLevel}) • {(node.examWeight * 100).toFixed(0)}% exam weight
                  </div>
                </div>
                <span className="text-2xl">🔓</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALL TOPICS VIEW ── */}
      {view === 'all' && (
        <div className="space-y-2">
          {nodes.map(node => {
            const prereqs = prerequisiteMap[node.id] || [];
            return (
              <div key={node.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{node.label}</div>
                    {prereqs.length > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span className="text-red-500 font-medium">Needs: </span>
                        {prereqs.map(id => nodes.find(n => n.id === id)?.label).filter(Boolean).join(' + ')}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${BLOOMS_COLORS[node.bloomsLevel]}`}>
                    {BLOOMS[node.bloomsLevel]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-gray-800">{nodes.length}</div>
          <div className="text-[10px] text-gray-400">Topics</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800">{totalEdges}</div>
          <div className="text-[10px] text-gray-400">Dependencies</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-600">{unlockedIds.size || nodes.filter(n => (prerequisiteMap[n.id]?.length || 0) === 0).length}</div>
          <div className="text-[10px] text-gray-400">Unlocked</div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
