/**
 * Workflow Intent Service
 * Analyzes user prompts to detect workflow-building intent
 */

export type IntentType = 'create_workflow' | 'modify_workflow' | 'question' | 'execute' | 'chat';

export interface ExtractedEntities {
  triggerType?: 'webhook' | 'schedule' | 'manual' | 'email' | 'github';
  integrations: string[];
  agents: string[];
  actions: string[];
  dataTypes: string[];
}

export interface IntentResult {
  isWorkflowIntent: boolean;
  intentType: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  suggestedWorkflowName?: string;
}

// Patterns for detecting workflow creation intent
const CREATE_PATTERNS = [
  /\b(create|build|make|set up|setup|design|generate|construct)\b.*\b(workflow|automation|flow|pipeline|process)\b/i,
  /\b(workflow|automation|flow|pipeline)\b.*\b(that|to|for|which)\b/i,
  /\bautomate\b.*\b(process|task|workflow|when|every)\b/i,
  /\bwant\s+(a|an|to)\b.*\b(workflow|automation|flow)\b/i,
  /\bneed\s+(a|an|to)\b.*\b(workflow|automation|flow)\b/i,
  /\bhelp\s+me\b.*\b(create|build|make|automate)\b/i,
];

// Patterns for detecting workflow modification intent
const MODIFY_PATTERNS = [
  /\b(add|insert|include|attach)\b.*\b(node|step|agent|trigger|action)\b/i,
  /\b(remove|delete|drop)\b.*\b(node|step|agent|the)\b/i,
  /\b(change|update|modify|edit|alter)\b.*\b(workflow|node|step|connection)\b/i,
  /\b(connect|link|wire)\b.*\b(to|with|nodes)\b/i,
  /\b(disconnect|unlink)\b/i,
  /\b(move|reposition|rearrange)\b.*\b(node|step)\b/i,
  /\b(run|execute)\s+(them\s+)?(in\s+)?(parallel|sequence|series)\b/i,
  /\badd\s+(error\s+)?handling\b/i,
];

// Patterns for detecting questions about workflows
const QUESTION_PATTERNS = [
  /\b(what|how|why|when|where|which|can|does|is|are)\b.*\b(workflow|node|agent|work|do)\b.*\?/i,
  /\bexplain\b.*\b(workflow|node|how)\b/i,
  /\btell\s+me\s+(about|how)\b/i,
  /\bwhat\s+(does|is|are)\b/i,
];

// Patterns for detecting execution intent
const EXECUTE_PATTERNS = [
  /\b(run|execute|start|trigger|test)\b.*\b(workflow|this|it)\b/i,
  /\b(run|execute|start)\s+it\b/i,
  /\btest\s+(the\s+)?workflow\b/i,
];

// Integration keywords mapping
const INTEGRATION_KEYWORDS: Record<string, string[]> = {
  slack: ['slack', 'slack message', 'slack notification', 'slack channel'],
  email: ['email', 'mail', 'gmail', 'outlook', 'send email', 'email notification'],
  github: ['github', 'pull request', 'pr', 'repository', 'repo', 'commit', 'issue', 'github webhook'],
  webhook: ['webhook', 'http', 'api call', 'rest api', 'endpoint'],
  database: ['database', 'db', 'sql', 'postgres', 'mysql', 'mongodb', 'query'],
  schedule: ['schedule', 'cron', 'every day', 'every hour', 'daily', 'hourly', 'weekly', 'timer'],
  n8n: ['n8n', 'n8n workflow'],
  discord: ['discord', 'discord message', 'discord bot'],
  telegram: ['telegram', 'telegram bot', 'telegram message'],
  twitter: ['twitter', 'tweet', 'x.com'],
  notion: ['notion', 'notion page', 'notion database'],
  google: ['google sheets', 'google drive', 'google docs', 'spreadsheet'],
  airtable: ['airtable', 'airtable base'],
  jira: ['jira', 'jira ticket', 'jira issue'],
  trello: ['trello', 'trello card', 'trello board'],
};

// Pronetheia agent keywords mapping
const AGENT_KEYWORDS: Record<string, string[]> = {
  'code-reviewer': ['code review', 'review code', 'code quality', 'review pr', 'pull request review'],
  'security-auditor': ['security', 'vulnerability', 'security scan', 'security audit', 'secure'],
  'qa-tester': ['test', 'testing', 'qa', 'quality assurance', 'test cases'],
  'debugger': ['debug', 'debugging', 'fix bug', 'troubleshoot', 'error'],
  'docs-writer': ['documentation', 'docs', 'document', 'readme', 'write docs'],
  'architect-reviewer': ['architecture', 'design review', 'system design', 'architectural'],
  'data-analyst': ['analyze data', 'data analysis', 'analytics', 'insights', 'statistics'],
  'research-orchestrator': ['research', 'investigate', 'find information', 'gather info'],
  'content-marketer': ['content', 'marketing', 'blog', 'article', 'social media content'],
  'seo-specialist': ['seo', 'search optimization', 'keywords', 'ranking'],
  'frontend-developer': ['frontend', 'ui', 'react', 'css', 'html', 'user interface'],
  'backend-architect': ['backend', 'api', 'server', 'microservice', 'api design'],
  'devops-engineer': ['devops', 'deployment', 'ci/cd', 'pipeline', 'docker', 'kubernetes'],
  'database-architect': ['database design', 'schema', 'data model', 'tables'],
  'ai-engineer': ['ai', 'machine learning', 'ml', 'llm', 'neural network'],
  'prompt-engineer': ['prompt', 'prompt engineering', 'prompt design'],
  'orchestrator': ['coordinate', 'orchestrate', 'multi-agent', 'delegation'],
};

// Action keywords
const ACTION_KEYWORDS: Record<string, string[]> = {
  notify: ['notify', 'notification', 'alert', 'send message', 'inform'],
  analyze: ['analyze', 'analysis', 'examine', 'inspect', 'review'],
  transform: ['transform', 'convert', 'process', 'parse', 'format'],
  filter: ['filter', 'exclude', 'include only', 'when', 'if'],
  aggregate: ['aggregate', 'combine', 'merge', 'collect', 'gather'],
  store: ['store', 'save', 'persist', 'write to', 'record'],
  fetch: ['fetch', 'get', 'retrieve', 'pull', 'read from'],
  summarize: ['summarize', 'summary', 'summarization', 'brief'],
  classify: ['classify', 'categorize', 'label', 'sort'],
  generate: ['generate', 'create', 'produce', 'write'],
};

/**
 * Extract trigger type from prompt
 */
function extractTriggerType(prompt: string): ExtractedEntities['triggerType'] {
  const lowerPrompt = prompt.toLowerCase();

  if (/\b(webhook|http|api\s+call|endpoint)\b/.test(lowerPrompt)) {return 'webhook';}
  if (/\b(schedule|cron|every\s+(day|hour|minute|week)|daily|hourly|weekly|timer)\b/.test(lowerPrompt)) {return 'schedule';}
  if (/\b(email|mail|inbox|new\s+email)\b/.test(lowerPrompt)) {return 'email';}
  if (/\b(github|pull\s+request|pr|commit|repository)\b/.test(lowerPrompt)) {return 'github';}
  if (/\b(manual|button|click|on\s+demand)\b/.test(lowerPrompt)) {return 'manual';}

  return undefined;
}

/**
 * Extract entities from prompt using keyword matching
 */
function extractEntities(prompt: string): ExtractedEntities {
  const lowerPrompt = prompt.toLowerCase();
  const entities: ExtractedEntities = {
    triggerType: extractTriggerType(prompt),
    integrations: [],
    agents: [],
    actions: [],
    dataTypes: [],
  };

  // Extract integrations
  for (const [integration, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      entities.integrations.push(integration);
    }
  }

  // Extract agents
  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      entities.agents.push(agent);
    }
  }

  // Extract actions
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      entities.actions.push(action);
    }
  }

  return entities;
}

/**
 * Calculate confidence score based on pattern matches and entity extraction
 */
function calculateConfidence(
  prompt: string,
  intentType: IntentType,
  entities: ExtractedEntities
): number {
  let confidence = 0;
  const lowerPrompt = prompt.toLowerCase();

  // Base confidence from pattern matching
  switch (intentType) {
    case 'create_workflow':
      confidence = CREATE_PATTERNS.some(p => p.test(prompt)) ? 0.7 : 0.4;
      break;
    case 'modify_workflow':
      confidence = MODIFY_PATTERNS.some(p => p.test(prompt)) ? 0.75 : 0.4;
      break;
    case 'execute':
      confidence = EXECUTE_PATTERNS.some(p => p.test(prompt)) ? 0.85 : 0.3;
      break;
    case 'question':
      confidence = QUESTION_PATTERNS.some(p => p.test(prompt)) ? 0.8 : 0.3;
      break;
    default:
      confidence = 0.2;
  }

  // Boost confidence based on entities found
  if (entities.integrations.length > 0) {confidence += 0.1;}
  if (entities.agents.length > 0) {confidence += 0.1;}
  if (entities.actions.length > 0) {confidence += 0.05;}
  if (entities.triggerType) {confidence += 0.1;}

  // Boost for workflow-specific keywords
  if (/\b(workflow|automation|automate|pipeline|flow)\b/i.test(lowerPrompt)) {
    confidence += 0.1;
  }

  // Cap at 0.95
  return Math.min(confidence, 0.95);
}

/**
 * Detect intent type from prompt
 */
function detectIntentType(prompt: string): IntentType {
  // Check patterns in order of specificity
  if (EXECUTE_PATTERNS.some(p => p.test(prompt))) {return 'execute';}
  if (MODIFY_PATTERNS.some(p => p.test(prompt))) {return 'modify_workflow';}
  if (QUESTION_PATTERNS.some(p => p.test(prompt))) {return 'question';}
  if (CREATE_PATTERNS.some(p => p.test(prompt))) {return 'create_workflow';}

  // Check for implicit workflow intent (mentions integrations + actions)
  const entities = extractEntities(prompt);
  if (entities.integrations.length >= 2 ||
      (entities.integrations.length >= 1 && entities.actions.length >= 1) ||
      entities.agents.length >= 1) {
    return 'create_workflow';
  }

  return 'chat';
}

/**
 * Generate a suggested workflow name from the prompt
 */
function generateWorkflowName(prompt: string, entities: ExtractedEntities): string {
  const parts: string[] = [];

  // Add primary integration or agent
  if (entities.integrations.length > 0) {
    parts.push(entities.integrations[0].charAt(0).toUpperCase() + entities.integrations[0].slice(1));
  } else if (entities.agents.length > 0) {
    const agentName = entities.agents[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    parts.push(agentName);
  }

  // Add primary action
  if (entities.actions.length > 0) {
    parts.push(entities.actions[0].charAt(0).toUpperCase() + entities.actions[0].slice(1));
  }

  // Add "Workflow" suffix
  parts.push('Workflow');

  return parts.join(' ') || 'New Workflow';
}

/**
 * Main function to analyze user prompt for workflow intent
 */
export function analyzeIntent(prompt: string): IntentResult {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    return {
      isWorkflowIntent: false,
      intentType: 'chat',
      confidence: 0,
      entities: { integrations: [], agents: [], actions: [], dataTypes: [] },
    };
  }

  const intentType = detectIntentType(trimmedPrompt);
  const entities = extractEntities(trimmedPrompt);
  const confidence = calculateConfidence(trimmedPrompt, intentType, entities);
  const isWorkflowIntent = intentType === 'create_workflow' || intentType === 'modify_workflow';

  return {
    isWorkflowIntent,
    intentType,
    confidence,
    entities,
    suggestedWorkflowName: isWorkflowIntent ? generateWorkflowName(trimmedPrompt, entities) : undefined,
  };
}

/**
 * Check if we should proceed with workflow generation based on confidence
 * Returns: 'proceed' | 'confirm' | 'skip'
 */
export function shouldGenerateWorkflow(result: IntentResult): 'proceed' | 'confirm' | 'skip' {
  if (!result.isWorkflowIntent) {return 'skip';}
  if (result.confidence >= 0.8) {return 'proceed';}
  if (result.confidence >= 0.5) {return 'confirm';}
  return 'skip';
}

export const workflowIntentService = {
  analyzeIntent,
  shouldGenerateWorkflow,
  extractEntities,
};

export default workflowIntentService;
