# UMS Memory Skill

Provides access to Athena's Unified Memory System (UMS) for persistent, semantic memory across sessions.

## Tools

### ums_search
Search memories semantically.

```bash
curl -X POST http://192.168.1.120:8000/api/v1/mnemo/memories/search \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: 01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb" \
  -d '{"query": "YOUR_QUERY", "limit": 5}'
```

### ums_store
Store a new memory.

```bash
curl -X POST http://192.168.1.120:8000/api/v1/mnemo/memories \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: 01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb" \
  -d '{"content": "MEMORY_CONTENT", "memory_type": "episodic", "importance": 0.5}'
```

### ums_stats
Get memory statistics.

```bash
curl http://192.168.1.120:8000/api/v1/mnemo/stats \
  -H "X-Gateway-Secret: 01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb"
```

## Usage

Before answering questions about past conversations or learned information, search UMS:

1. Use `exec` to run the curl commands above
2. Parse the JSON response
3. Include relevant memories in your response

## Memory Types

- `episodic` - Specific events and conversations
- `semantic` - Facts and knowledge
- `procedural` - How to do things
