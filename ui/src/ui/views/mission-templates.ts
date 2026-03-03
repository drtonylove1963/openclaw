/**
 * Mission Templates Management View
 *
 * CRUD interface for managing mission templates.
 *
 * Author: Athena
 * Date: 2026-03-03
 */

import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const API_BASE = '';
const GATEWAY_SECRET = '01c1b66797fa9f84e794ed313bb5d1aa4b0add96e216723725b8c88b8e6c57eb';

interface TeamTemplate {
  name: string;
  role: string;
  objective_template: string;
  agent_type: string;
  capabilities: string[];
  depends_on: string[];
  estimated_hours: number;
}

interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  goal_template: string;
  teams: TeamTemplate[];
  variables: string[];
  tags: string[];
  estimated_total_hours: number;
}

const CATEGORIES = [
  'development',
  'testing', 
  'documentation',
  'refactoring',
  'devops',
  'research',
  'maintenance',
  'feature'
];

const AGENT_TYPES = [
  'backend-architect',
  'frontend-developer',
  'fullstack-developer',
  'python-pro',
  'java-pro',
  'javascript-pro',
  'typescript-pro',
  'golang-pro',
  'rust-pro',
  'qa-tester',
  'test-engineer',
  'devops-engineer',
  'security-auditor',
  'database-admin',
  'technical-writer',
  'business-analyst',
  'ai-engineer',
  'ui-ux-designer',
  'orchestrator',
];

export function renderMissionTemplates(props: { config: unknown }) {
  return html`<mission-templates-view .config=${props.config}></mission-templates-view>`;
}

@customElement('mission-templates-view')
export class MissionTemplatesView extends LitElement {
  @property({ type: Object }) config: unknown = {};
  
  @state() private templates: MissionTemplate[] = [];
  @state() private loading = true;
  @state() private error = '';
  @state() private selectedTemplate: MissionTemplate | null = null;
  @state() private isEditing = false;
  @state() private isCreating = false;
  @state() private editForm: Partial<MissionTemplate> = {};
  @state() private editTeamIndex = -1;
  @state() private editTeam: Partial<TeamTemplate> = {};
  @state() private searchQuery = '';
  @state() private filterCategory = '';

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      color: var(--text, #e4e4e7);
      background: var(--bg, #12141a);
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border, #27272a);
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-strong, #fafafa);
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--border-strong, #3f3f46);
    }

    .btn-primary {
      background: var(--accent, #ff5c5c);
      border-color: var(--accent, #ff5c5c);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--accent-hover, #ff7070);
    }

    .btn-danger {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.15));
      border-color: var(--danger, #ef4444);
      color: var(--danger, #ef4444);
    }

    .btn-danger:hover {
      background: var(--danger, #ef4444);
      color: #fff;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent, #ff5c5c);
    }

    .select {
      padding: 10px 14px;
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
      font-size: 14px;
      min-width: 150px;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      min-height: 500px;
    }

    .templates-list {
      border: 1px solid var(--border, #27272a);
      border-radius: 12px;
      background: var(--card, #181b22);
      overflow: hidden;
    }

    .template-item {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border, #27272a);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .template-item:last-child {
      border-bottom: none;
    }

    .template-item:hover {
      background: var(--bg-hover, #262a35);
    }

    .template-item.active {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      border-left: 3px solid var(--accent, #ff5c5c);
    }

    .template-item-name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .template-item-meta {
      font-size: 12px;
      color: var(--muted, #71717a);
      display: flex;
      gap: 12px;
    }

    .template-detail {
      border: 1px solid var(--border, #27272a);
      border-radius: 12px;
      background: var(--card, #181b22);
      padding: 24px;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .detail-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .detail-category {
      font-size: 12px;
      color: var(--accent, #ff5c5c);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-description {
      color: var(--muted, #71717a);
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .teams-list {
      display: grid;
      gap: 12px;
    }

    .team-card {
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      padding: 14px;
      background: var(--bg-elevated, #1a1d25);
    }

    .team-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .team-name {
      font-weight: 600;
    }

    .team-agent {
      font-size: 12px;
      color: var(--accent, #ff5c5c);
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      padding: 2px 8px;
      border-radius: 4px;
    }

    .team-objective {
      font-size: 13px;
      color: var(--muted, #71717a);
      margin-bottom: 8px;
    }

    .team-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--muted, #71717a);
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      font-size: 12px;
      padding: 4px 10px;
      border: 1px solid var(--border, #27272a);
      border-radius: 20px;
      background: var(--secondary, #1e2028);
    }

    .variables {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .variable {
      font-family: var(--mono, monospace);
      font-size: 12px;
      padding: 4px 10px;
      border: 1px solid var(--border-strong, #3f3f46);
      border-radius: 4px;
      background: var(--bg, #12141a);
      color: var(--accent-2, #14b8a6);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted, #71717a);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    /* Form Styles */
    .form-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .form-modal {
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 16px;
      padding: 24px;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .form-title {
      font-size: 20px;
      font-weight: 700;
    }

    .form-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--muted, #71717a);
      font-size: 24px;
      cursor: pointer;
      border-radius: 8px;
    }

    .form-close:hover {
      background: var(--bg-hover, #262a35);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted, #71717a);
    }

    .form-input,
    .form-textarea,
    .form-select {
      padding: 10px 14px;
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
      font-size: 14px;
      font-family: inherit;
    }

    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--accent, #ff5c5c);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border, #27272a);
    }

    .teams-editor {
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      padding: 16px;
      background: var(--bg, #12141a);
    }

    .teams-editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .team-edit-card {
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      background: var(--bg-elevated, #1a1d25);
    }

    .team-edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .team-edit-actions {
      display: flex;
      gap: 8px;
    }

    .chips-input {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      background: var(--bg-elevated, #1a1d25);
      min-height: 42px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--secondary, #1e2028);
      border: 1px solid var(--border, #27272a);
      border-radius: 4px;
      font-size: 12px;
    }

    .chip-remove {
      cursor: pointer;
      opacity: 0.6;
    }

    .chip-remove:hover {
      opacity: 1;
    }

    .chips-input input {
      flex: 1;
      min-width: 100px;
      border: none;
      background: transparent;
      color: var(--text, #e4e4e7);
      font-size: 13px;
      outline: none;
    }

    @media (max-width: 900px) {
      .templates-grid {
        grid-template-columns: 1fr;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.fetchTemplates();
    this.refreshInterval = setInterval(() => this.fetchTemplates(), 30000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async fetchTemplates(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/missions/templates/`, {
        headers: { 'X-Gateway-Secret': GATEWAY_SECRET }
      });
      if (response.ok) {
        this.templates = await response.json();
        this.error = '';
      } else {
        this.error = 'Failed to fetch templates';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  }

  private get filteredTemplates(): MissionTemplate[] {
    return this.templates.filter(t => {
      const matchesSearch = !this.searchQuery || 
        t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = !this.filterCategory || t.category === this.filterCategory;
      return matchesSearch && matchesCategory;
    });
  }

  private selectTemplate(template: MissionTemplate): void {
    this.selectedTemplate = template;
    this.isEditing = false;
    this.isCreating = false;
  }

  private startCreate(): void {
    this.isCreating = true;
    this.isEditing = false;
    this.editForm = {
      id: '',
      name: '',
      description: '',
      category: 'development',
      goal_template: '',
      teams: [],
      variables: [],
      tags: [],
    };
  }

  private startEdit(): void {
    if (!this.selectedTemplate) return;
    this.isEditing = true;
    this.isCreating = false;
    this.editForm = JSON.parse(JSON.stringify(this.selectedTemplate));
  }

  private cancelEdit(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.editForm = {};
  }

  private async saveTemplate(): Promise<void> {
    try {
      const method = this.isCreating ? 'POST' : 'PUT';
      const url = this.isCreating 
        ? `${API_BASE}/api/v1/missions/templates/`
        : `${API_BASE}/api/v1/missions/templates/${this.editForm.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Secret': GATEWAY_SECRET
        },
        body: JSON.stringify(this.editForm)
      });

      if (response.ok) {
        await this.fetchTemplates();
        if (this.isCreating) {
          this.selectedTemplate = await response.json();
        } else {
          this.selectedTemplate = this.editForm as MissionTemplate;
        }
        this.isEditing = false;
        this.isCreating = false;
      } else {
        const err = await response.json();
        this.error = err.detail || 'Failed to save template';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save';
    }
  }

  private async deleteTemplate(): Promise<void> {
    if (!this.selectedTemplate) return;
    if (!confirm(`Delete template "${this.selectedTemplate.name}"?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/missions/templates/${this.selectedTemplate.id}`,
        {
          method: 'DELETE',
          headers: { 'X-Gateway-Secret': GATEWAY_SECRET }
        }
      );

      if (response.ok) {
        this.selectedTemplate = null;
        await this.fetchTemplates();
      } else {
        this.error = 'Failed to delete template';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete';
    }
  }

  // Team editing helpers
  private addTeam(): void {
    if (!this.editForm.teams) this.editForm.teams = [];
    this.editForm.teams.push({
      name: `Team ${this.editForm.teams.length + 1}`,
      role: '',
      objective_template: '',
      agent_type: 'fullstack-developer',
      capabilities: [],
      depends_on: [],
      estimated_hours: 2
    });
    this.requestUpdate();
  }

  private removeTeam(index: number): void {
    if (this.editForm.teams) {
      this.editForm.teams.splice(index, 1);
      this.requestUpdate();
    }
  }

  private updateTeam(index: number, field: keyof TeamTemplate, value: unknown): void {
    if (this.editForm.teams && this.editForm.teams[index]) {
      (this.editForm.teams[index] as Record<string, unknown>)[field] = value;
      this.requestUpdate();
    }
  }

  private handleVariableInput(e: KeyboardEvent, target: 'variables' | 'tags'): void {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Enter' && input.value.trim()) {
      if (!this.editForm[target]) this.editForm[target] = [];
      (this.editForm[target] as string[]).push(input.value.trim());
      input.value = '';
      this.requestUpdate();
    }
  }

  private removeVariable(target: 'variables' | 'tags', index: number): void {
    if (this.editForm[target]) {
      (this.editForm[target] as string[]).splice(index, 1);
      this.requestUpdate();
    }
  }

  private handleCapabilityInput(e: KeyboardEvent, teamIndex: number): void {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Enter' && input.value.trim()) {
      if (!this.editForm.teams![teamIndex].capabilities) {
        this.editForm.teams![teamIndex].capabilities = [];
      }
      this.editForm.teams![teamIndex].capabilities.push(input.value.trim());
      input.value = '';
      this.requestUpdate();
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading templates...</p></div>`;
    }

    return html`
      <div class="header">
        <h1>📋 Mission Templates</h1>
        <div class="header-actions">
          <button class="btn btn-primary" @click=${this.startCreate}>+ New Template</button>
        </div>
      </div>

      ${this.error ? html`<div class="error">${this.error}</div>` : ''}

      <div class="filters">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search templates..." 
          .value=${this.searchQuery}
          @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
        />
        <select class="select" @change=${(e: Event) => this.filterCategory = (e.target as HTMLSelectElement).value}>
          <option value="">All Categories</option>
          ${CATEGORIES.map(c => html`<option value=${c} ?selected=${this.filterCategory === c}>${c}</option>`)}
        </select>
      </div>

      <div class="templates-grid">
        <div class="templates-list">
          ${this.filteredTemplates.length === 0 
            ? html`<div class="empty-state"><p>No templates found</p></div>`
            : this.filteredTemplates.map(t => html`
              <div 
                class="template-item ${this.selectedTemplate?.id === t.id ? 'active' : ''}"
                @click=${() => this.selectTemplate(t)}
              >
                <div class="template-item-name">${t.name}</div>
                <div class="template-item-meta">
                  <span>${t.category}</span>
                  <span>${t.teams?.length || 0} teams</span>
                  <span>${t.estimated_total_hours || 0}h</span>
                </div>
              </div>
            `)}
        </div>

        <div class="template-detail">
          ${this.selectedTemplate ? this.renderDetail() : html`
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <p>Select a template to view details</p>
            </div>
          `}
        </div>
      </div>

      ${(this.isEditing || this.isCreating) ? this.renderForm() : ''}
    `;
  }

  private renderDetail() {
    const t = this.selectedTemplate!;
    return html`
      <div class="detail-header">
        <div>
          <div class="detail-title">${t.name}</div>
          <div class="detail-category">${t.category}</div>
        </div>
        <div class="header-actions">
          <button class="btn btn-sm" @click=${this.startEdit}>✏️ Edit</button>
          <button class="btn btn-sm btn-danger" @click=${this.deleteTemplate}>🗑️ Delete</button>
        </div>
      </div>

      <div class="detail-description">${t.description}</div>

      <div class="section">
        <div class="section-title">Goal Template</div>
        <div class="tag">${t.goal_template}</div>
      </div>

      ${t.variables?.length ? html`
        <div class="section">
          <div class="section-title">Variables</div>
          <div class="variables">
            ${t.variables.map(v => html`<span class="variable">{${v}}</span>`)}
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Teams (${t.teams?.length || 0})</div>
        <div class="teams-list">
          ${t.teams?.map(team => html`
            <div class="team-card">
              <div class="team-card-header">
                <span class="team-name">${team.name}</span>
                <span class="team-agent">${team.agent_type}</span>
              </div>
              <div class="team-objective">${team.objective_template}</div>
              <div class="team-meta">
                <span>Role: ${team.role}</span>
                <span>Est: ${team.estimated_hours}h</span>
                ${team.depends_on?.length ? html`<span>Deps: ${team.depends_on.join(', ')}</span>` : ''}
              </div>
            </div>
          `) || html`<p class="empty-state">No teams defined</p>`}
        </div>
      </div>

      ${t.tags?.length ? html`
        <div class="section">
          <div class="section-title">Tags</div>
          <div class="tags">
            ${t.tags.map(tag => html`<span class="tag">${tag}</span>`)}
          </div>
        </div>
      ` : ''}
    `;
  }

  private renderForm() {
    const t = this.editForm;
    return html`
      <div class="form-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.cancelEdit()}>
        <div class="form-modal">
          <div class="form-header">
            <h2 class="form-title">${this.isCreating ? 'Create Template' : 'Edit Template'}</h2>
            <button class="form-close" @click=${this.cancelEdit}>×</button>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Template ID</label>
              <input 
                class="form-input" 
                .value=${t.id || ''} 
                ?disabled=${!this.isCreating}
                @input=${(e: Event) => this.editForm.id = (e.target as HTMLInputElement).value}
                placeholder="e.g., custom-api"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Name</label>
              <input 
                class="form-input" 
                .value=${t.name || ''}
                @input=${(e: Event) => this.editForm.name = (e.target as HTMLInputElement).value}
                placeholder="e.g., Custom API Build"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select 
                class="form-select"
                @change=${(e: Event) => this.editForm.category = (e.target as HTMLSelectElement).value}
              >
                ${CATEGORIES.map(c => html`<option value=${c} ?selected=${t.category === c}>${c}</option>`)}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Estimated Hours</label>
              <input 
                type="number" 
                class="form-input" 
                .value=${String(t.estimated_total_hours || 0)}
                @input=${(e: Event) => this.editForm.estimated_total_hours = parseFloat((e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Description</label>
              <textarea 
                class="form-textarea"
                .value=${t.description || ''}
                @input=${(e: Event) => this.editForm.description = (e.target as HTMLTextAreaElement).value}
                placeholder="Describe what this template is for..."
              ></textarea>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Goal Template (use {variable} placeholders)</label>
              <input 
                class="form-input" 
                .value=${t.goal_template || ''}
                @input=${(e: Event) => this.editForm.goal_template = (e.target as HTMLInputElement).value}
                placeholder="e.g., Build {feature_name} API for {domain}"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Variables (press Enter to add)</label>
              <div class="chips-input">
                ${t.variables?.map((v, i) => html`
                  <span class="chip">
                    ${v}
                    <span class="chip-remove" @click=${() => this.removeVariable('variables', i)}>×</span>
                  </span>
                `) || ''}
                <input 
                  placeholder="Add variable..."
                  @keydown=${(e: KeyboardEvent) => this.handleVariableInput(e, 'variables')}
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tags (press Enter to add)</label>
              <div class="chips-input">
                ${t.tags?.map((tag, i) => html`
                  <span class="chip">
                    ${tag}
                    <span class="chip-remove" @click=${() => this.removeVariable('tags', i)}>×</span>
                  </span>
                `) || ''}
                <input 
                  placeholder="Add tag..."
                  @keydown=${(e: KeyboardEvent) => this.handleVariableInput(e, 'tags')}
                />
              </div>
            </div>

            <div class="form-group full-width">
              <div class="teams-editor-header">
                <label class="form-label">Teams</label>
                <button class="btn btn-sm" @click=${this.addTeam}>+ Add Team</button>
              </div>
              <div class="teams-editor">
                ${t.teams?.map((team, i) => html`
                  <div class="team-edit-card">
                    <div class="team-edit-header">
                      <input 
                        class="form-input" 
                        style="width: 150px"
                        .value=${team.name}
                        @input=${(e: Event) => this.updateTeam(i, 'name', (e.target as HTMLInputElement).value)}
                        placeholder="Team name"
                      />
                      <div class="team-edit-actions">
                        <select 
                          class="form-select" 
                          style="width: 180px"
                          @change=${(e: Event) => this.updateTeam(i, 'agent_type', (e.target as HTMLSelectElement).value)}
                        >
                          ${AGENT_TYPES.map(a => html`<option value=${a} ?selected=${team.agent_type === a}>${a}</option>`)}
                        </select>
                        <button class="btn btn-sm btn-danger" @click=${() => this.removeTeam(i)}>×</button>
                      </div>
                    </div>
                    <div class="form-grid" style="gap: 8px; margin-top: 8px;">
                      <input 
                        class="form-input"
                        .value=${team.role}
                        @input=${(e: Event) => this.updateTeam(i, 'role', (e.target as HTMLInputElement).value)}
                        placeholder="Role"
                      />
                      <input 
                        type="number"
                        class="form-input"
                        .value=${String(team.estimated_hours || 2)}
                        @input=${(e: Event) => this.updateTeam(i, 'estimated_hours', parseFloat((e.target as HTMLInputElement).value))}
                        placeholder="Hours"
                        style="width: 80px"
                      />
                      <input 
                        class="form-input"
                        style="grid-column: 1 / -1"
                        .value=${team.objective_template}
                        @input=${(e: Event) => this.updateTeam(i, 'objective_template', (e.target as HTMLInputElement).value)}
                        placeholder="Objective template"
                      />
                      <div class="chips-input" style="grid-column: 1 / -1">
                        ${team.capabilities?.map((cap) => html`
                          <span class="chip">${cap}</span>
                        `) || ''}
                        <input 
                          placeholder="Add capability..."
                          @keydown=${(e: KeyboardEvent) => this.handleCapabilityInput(e, i)}
                        />
                      </div>
                    </div>
                  </div>
                `) || html`<p style="color: var(--muted)">No teams defined. Click "Add Team" to create one.</p>`}
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn" @click=${this.cancelEdit}>Cancel</button>
            <button class="btn btn-primary" @click=${this.saveTemplate}>
              ${this.isCreating ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
