/**
 * KnowledgeGraph
 * Directed Acyclic Graph (DAG) of topic prerequisite relationships.
 *
 * Research basis:
 *   Bloom, B.S. (1956). Taxonomy of Educational Objectives.
 *   Prerequisite-based adaptive sequencing — common in intelligent tutoring systems (ITS).
 *
 * OOP: Encapsulation, Graph traversal (DFS/BFS), Topological Sort
 * Design Pattern: Composite (topics as nodes), Builder (addNode/addEdge)
 */

class KnowledgeNode {
  constructor(id, { label, subject, bloomsLevel = 1, examWeight = 1.0 } = {}) {
    this.id          = id;
    this.label       = label || id;
    this.subject     = subject || '';
    this.bloomsLevel = bloomsLevel;  // 1-6 (Remember → Create)
    this.examWeight  = examWeight;   // 0-1 importance in exam
  }

  toObject() {
    return { id: this.id, label: this.label, subject: this.subject, bloomsLevel: this.bloomsLevel, examWeight: this.examWeight };
  }
}

class KnowledgeGraph {
  #nodes;   // Map<id, KnowledgeNode>
  #edges;   // Map<id, Set<id>>  — directed: prerequisite → dependent

  static BLOOMS_LEVELS = {
    1: 'Remember',
    2: 'Understand',
    3: 'Apply',
    4: 'Analyze',
    5: 'Evaluate',
    6: 'Create',
  };

  // ── Built-in exam graphs ─────────────────────────────────────────
  static BUILT_IN_GRAPHS = {
    JEE_PHYSICS: [
      // nodes: [id, label, bloomsLevel, examWeight]
      { id: 'math_basics',      label: 'Basic Mathematics',         bloomsLevel: 1, examWeight: 0.5 },
      { id: 'kinematics',       label: 'Kinematics',                bloomsLevel: 3, examWeight: 0.8 },
      { id: 'newtons_laws',     label: "Newton's Laws",             bloomsLevel: 3, examWeight: 0.9 },
      { id: 'work_energy',      label: 'Work, Energy & Power',      bloomsLevel: 3, examWeight: 0.85 },
      { id: 'rotational',       label: 'Rotational Motion',         bloomsLevel: 4, examWeight: 0.9 },
      { id: 'gravitation',      label: 'Gravitation',               bloomsLevel: 3, examWeight: 0.75 },
      { id: 'shm',              label: 'Simple Harmonic Motion',    bloomsLevel: 4, examWeight: 0.85 },
      { id: 'waves',            label: 'Waves',                     bloomsLevel: 4, examWeight: 0.8 },
      { id: 'electrostatics',   label: 'Electrostatics',            bloomsLevel: 3, examWeight: 0.95 },
      { id: 'current_elec',     label: 'Current Electricity',       bloomsLevel: 3, examWeight: 0.9 },
      { id: 'magnetism',        label: 'Magnetism',                 bloomsLevel: 4, examWeight: 0.85 },
      { id: 'em_induction',     label: 'Electromagnetic Induction', bloomsLevel: 4, examWeight: 0.9 },
      { id: 'optics',           label: 'Ray & Wave Optics',         bloomsLevel: 4, examWeight: 0.85 },
    ],
    JEE_MATH: [
      { id: 'sets_functions',   label: 'Sets & Functions',          bloomsLevel: 1, examWeight: 0.6 },
      { id: 'complex_numbers',  label: 'Complex Numbers',           bloomsLevel: 3, examWeight: 0.75 },
      { id: 'quadratic',        label: 'Quadratic Equations',       bloomsLevel: 2, examWeight: 0.7 },
      { id: 'sequences',        label: 'Sequences & Series',        bloomsLevel: 3, examWeight: 0.8 },
      { id: 'matrices',         label: 'Matrices & Determinants',   bloomsLevel: 3, examWeight: 0.85 },
      { id: 'trigonometry',     label: 'Trigonometry',              bloomsLevel: 2, examWeight: 0.8 },
      { id: 'coord_geometry',   label: 'Coordinate Geometry',      bloomsLevel: 3, examWeight: 0.85 },
      { id: 'limits',           label: 'Limits & Continuity',       bloomsLevel: 2, examWeight: 0.75 },
      { id: 'differentiation',  label: 'Differentiation',           bloomsLevel: 3, examWeight: 0.9 },
      { id: 'integration',      label: 'Integration',               bloomsLevel: 4, examWeight: 0.95 },
      { id: 'diff_equations',   label: 'Differential Equations',    bloomsLevel: 4, examWeight: 0.8 },
      { id: 'probability',      label: 'Probability',               bloomsLevel: 3, examWeight: 0.85 },
    ],
  };

  static BUILT_IN_EDGES = {
    JEE_PHYSICS: [
      ['math_basics',    'kinematics'],
      ['kinematics',     'newtons_laws'],
      ['newtons_laws',   'work_energy'],
      ['work_energy',    'rotational'],
      ['newtons_laws',   'gravitation'],
      ['kinematics',     'shm'],
      ['shm',            'waves'],
      ['math_basics',    'electrostatics'],
      ['electrostatics', 'current_elec'],
      ['current_elec',   'magnetism'],
      ['magnetism',      'em_induction'],
      ['math_basics',    'optics'],
    ],
    JEE_MATH: [
      ['sets_functions',  'quadratic'],
      ['sets_functions',  'sequences'],
      ['quadratic',       'complex_numbers'],
      ['trigonometry',    'coord_geometry'],
      ['sets_functions',  'matrices'],
      ['sets_functions',  'limits'],
      ['limits',          'differentiation'],
      ['differentiation', 'integration'],
      ['integration',     'diff_equations'],
      ['sets_functions',  'probability'],
    ],
  };

  constructor() {
    this.#nodes = new Map();
    this.#edges = new Map();
  }

  // ── Builder API ─────────────────────────────────────────────────
  addNode(id, meta = {}) {
    if (!this.#nodes.has(id)) {
      this.#nodes.set(id, new KnowledgeNode(id, meta));
      this.#edges.set(id, new Set());
    }
    return this;
  }

  /**
   * Add a directed edge: prerequisite → dependent.
   * Detects cycles before adding.
   */
  addEdge(prerequisiteId, dependentId) {
    if (!this.#nodes.has(prerequisiteId)) this.addNode(prerequisiteId);
    if (!this.#nodes.has(dependentId))    this.addNode(dependentId);
    if (this._wouldCreateCycle(dependentId, prerequisiteId)) {
      throw new Error(`Adding edge ${prerequisiteId} → ${dependentId} would create a cycle`);
    }
    this.#edges.get(prerequisiteId).add(dependentId);
    return this;
  }

  // ── Queries ─────────────────────────────────────────────────────
  getPrerequisites(topicId) {
    const prereqs = [];
    for (const [src, dsts] of this.#edges) {
      if (dsts.has(topicId)) prereqs.push(this.#nodes.get(src));
    }
    return prereqs;
  }

  getDependents(topicId) {
    const dsts = this.#edges.get(topicId);
    if (!dsts) return [];
    return [...dsts].map(id => this.#nodes.get(id));
  }

  /**
   * All transitive prerequisites (DFS).
   */
  getAllPrerequisites(topicId, visited = new Set()) {
    if (visited.has(topicId)) return [];
    visited.add(topicId);
    const direct = this.getPrerequisites(topicId);
    const all = [...direct];
    for (const p of direct) {
      all.push(...this.getAllPrerequisites(p.id, visited));
    }
    return all;
  }

  /**
   * Topological sort — returns topics in study order.
   * Uses Kahn's algorithm.
   */
  getStudyOrder() {
    const inDegree = new Map();
    for (const id of this.#nodes.keys()) inDegree.set(id, 0);
    for (const [, dsts] of this.#edges) {
      for (const dst of dsts) inDegree.set(dst, (inDegree.get(dst) || 0) + 1);
    }

    const queue = [...inDegree.entries()]
      .filter(([, d]) => d === 0)
      .map(([id]) => id);
    const order = [];

    while (queue.length > 0) {
      // Sort by exam weight descending for equal-level nodes
      queue.sort((a, b) => {
        const wa = this.#nodes.get(a)?.examWeight || 0;
        const wb = this.#nodes.get(b)?.examWeight || 0;
        return wb - wa;
      });
      const id = queue.shift();
      order.push(this.#nodes.get(id));
      for (const dst of (this.#edges.get(id) || [])) {
        inDegree.set(dst, inDegree.get(dst) - 1);
        if (inDegree.get(dst) === 0) queue.push(dst);
      }
    }
    return order;
  }

  /**
   * Given a set of mastered topic IDs, return which topics are now unlocked.
   */
  getUnlockedTopics(masteredIds) {
    const mastered = new Set(masteredIds);
    const unlocked = [];
    for (const [id, node] of this.#nodes) {
      if (mastered.has(id)) continue;
      const prereqs = this.getPrerequisites(id);
      const allMet  = prereqs.every(p => mastered.has(p.id));
      if (allMet) unlocked.push(node);
    }
    return unlocked;
  }

  /**
   * Get learning path from a source topic to a target topic (BFS).
   */
  getLearningPath(fromId, toId) {
    const visited = new Set();
    const queue   = [[fromId, [fromId]]];
    while (queue.length > 0) {
      const [cur, path] = queue.shift();
      if (cur === toId) return path.map(id => this.#nodes.get(id));
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of (this.#edges.get(cur) || [])) {
        queue.push([next, [...path, next]]);
      }
    }
    return null; // no path
  }

  /**
   * Compute coverage score: percentage of nodes that are mastered.
   */
  getCoverageScore(masteredIds) {
    if (this.#nodes.size === 0) return 0;
    const mastered = new Set(masteredIds);
    return Math.round((mastered.size / this.#nodes.size) * 100);
  }

  get nodeCount() { return this.#nodes.size; }
  get edgeCount() {
    let count = 0;
    for (const s of this.#edges.values()) count += s.size;
    return count;
  }

  // ── Serialization ───────────────────────────────────────────────
  toObject() {
    return {
      nodes: [...this.#nodes.values()].map(n => n.toObject()),
      edges: [...this.#edges.entries()].map(([src, dsts]) => ({ from: src, to: [...dsts] })),
    };
  }

  // ── Static Factories ─────────────────────────────────────────────
  static buildFromExam(examKey) {
    const graph  = new KnowledgeGraph();
    const nodes  = KnowledgeGraph.BUILT_IN_GRAPHS[examKey] || [];
    const edges  = KnowledgeGraph.BUILT_IN_EDGES[examKey]  || [];
    nodes.forEach(n => graph.addNode(n.id, n));
    edges.forEach(([a, b]) => graph.addEdge(a, b));
    return graph;
  }

  static buildFromData({ nodes = [], edges = [] }) {
    const graph = new KnowledgeGraph();
    nodes.forEach(n => graph.addNode(n.id, n));
    edges.forEach(([a, b]) => graph.addEdge(a, b));
    return graph;
  }

  // ── Private helpers ──────────────────────────────────────────────
  _wouldCreateCycle(startId, targetId) {
    // DFS from startId; if we reach targetId, adding targetId→startId creates a cycle
    const visited = new Set();
    const stack   = [startId];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur === targetId) return true;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const next of (this.#edges.get(cur) || [])) stack.push(next);
    }
    return false;
  }
}

module.exports = { KnowledgeGraph, KnowledgeNode };
