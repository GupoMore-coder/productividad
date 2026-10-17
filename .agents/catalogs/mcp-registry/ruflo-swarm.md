# 🐝 Ruflo Multi-Agent Swarm Orchestration MCP Registry Spec

> **Source:** [ruvnet/ruflo](https://github.com/ruvnet/ruflo) (formerly Claude Flow)  
> **License:** MIT / Open Source  
> **Domain:** Multi-Agent Swarm Orchestration Platform & Meta-Harness, Hive-Mind Lead Coordination, RuVector Knowledge Graphs, Inter-Agent Federation, Persistent Cross-Session Swarm Memory, Parallel Sub-Agent Delegation.

---

## 🎯 Visión Arquitectónica

Ruflo transforma agentes individuales en enjambres colaborativos coordinados ("hive-mind"). Un agente director descompone peticiones de ingeniería de gran escala, delega sub-tareas en paralelo a agentes subordinados especializados y consolida resultados a través de un grafo de conocimiento compartido (RuVector) sin colisiones de estado:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Swarm Master                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Swarm Dispatch Request / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Ruflo Swarm Core                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Hive-Mind Coordinator │       │ RuVector Graph Engine │  │
│  │ (Task Decomposition)  │◄─────►│ (Shared Knowledge)    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Federated Parallel Sub-Agents:                        │  │
│  │  - Architect Agent     - Testing Specialist Agent     │  │
│  │  - Backend Worker      - Security Audit Gate          │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `ruflo_spawn_agent_swarm`
Instancia un enjambre de agentes especializados para resolver una tarea paralela compleja:

```json
{
  "name": "ruflo_spawn_agent_swarm",
  "description": "Initializes a collaborative agent swarm with a lead coordinator and assigned specialized sub-agents.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_description": { "type": "string" },
      "sub_agents": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["coder", "tester", "reviewer", "architect"]
      },
      "max_parallel_workers": { "type": "integer", "default": 4 }
    },
    "required": ["task_description"]
  }
}
```

### 2. `ruflo_query_ruvector_graph`
Consulta el grafo de conocimiento compartido de la colmena para recuperar relaciones y aprendizajes previos:

```json
{
  "name": "ruflo_query_ruvector_graph",
  "description": "Queries the shared RuVector knowledge graph for architecture patterns and cross-agent solutions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "concept": { "type": "string" },
      "depth": { "type": "integer", "default": 2 }
    },
    "required": ["concept"]
  }
}
```

### 3. `ruflo_dispatch_federated_task`
Delega una subtarea a un nodo de trabajo específico con bloqueo atómico de estado:

```json
{
  "name": "ruflo_dispatch_federated_task",
  "description": "Dispatches a subtask to an isolated worker agent with concurrency locks on shared file resources.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worker_role": { "type": "string" },
      "subtask_payload": { "type": "string" },
      "locked_files": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["worker_role", "subtask_payload"]
  }
}
```

---

## 🏛️ Velocidad y Descentralización (Jeff Bezos & Andy Jassy)

1. **Velocidad 'Day 1' (Jeff Bezos):** Delegación paralela de alta velocidad. Dividir problemas complejos en módulos desacoplados para acelerar drásticamente los tiempos de ciclo.
2. **Prevención de Condiciones de Carrera:** Ningún agente secundario puede mutar simultáneamente el mismo archivo fuente; el coordinador mantiene el control de concurrencia.
