/**
 * Refinement View for Athena Control UI
 *
 * Dashboard for monitoring and managing refinement loops.
 *
 * Author: Athena
 * Date: 2026-03-02
 */

import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export function renderRefinement(props: { config: any }) {
  return html`
    <refinement-view .config=${props.config}></refinement-view>
  `;
}

@customElement('refinement-view')
export class RefinementView extends LitElement {
  @property({ type: Object }) config: any = {};
  @state() private cycles: any[] = [];
  @state() private activeCycle: any = null;
  @state() private history: any[] = [];
  @state() private loading: boolean = true;
  @state() private error: string | null = null;

  private refreshInterval: any = null;

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      color: #e0f2fe;
    }

    .subtitle {
      color: #7dd3fc;
      font-size: 14px;
      margin-top: 5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #7dd3fc;
    }

    .stat-value.success {
      color: #4ade80;
    }

    .stat-value.warning {
      color: #fbbf24;
    }

    .section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #e0f2fe;
    }

    .cycle-item {
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
    }

    .cycle-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .cycle-id {
      font-family: monospace;
      font-size: 13px;
      color: #7dd3fc;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-converged {
      background: #065f46;
      color: #6ee7b7;
    }

    .status-in_progress {
      background: #1e40af;
      color: #93c5fd;
    }

    .status-failed {
      background: #7f1d1d;
      color: #fca5a5;
    }

    .status-max_iterations {
      background: #78350f;
      color: #fcd34d;
    }

    .iteration-timeline {
      display: flex;
      align-items: center;
      gap: 5px;
      margin: 15px 0;
      overflow-x: auto;
      padding: 10px 0;
    }

    .iteration-dot {
      min-width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      color: #94a3b8;
      position: relative;
    }

    .iteration-dot.improved {
      background: #065f46;
      color: #6ee7b7;
    }

    .iteration-dot.current {
      background: #1e40af;
      color: #93c5fd;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    .iteration-dot::after {
      content: '';
      position: absolute;
      right: -10px;
      width: 10px;
      height: 2px;
      background: #475569;
    }

    .iteration-dot:last-child::after {
      display: none;
    }

    .improvement-chart {
      background: #0f172a;
      border-radius: 8px;
      padding: 15px;
      margin-top: 10px;
    }

    .chart-bar-container {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 100px;
      padding: 10px 0;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, #0ea5e9, #0284c7);
      border-radius: 4px 4px 0 0;
      position: relative;
      min-height: 10px;
      transition: height 0.3s ease;
    }

    .chart-bar-label {
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: #94a3b8;
    }

    .chart-bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: #7dd3fc;
      font-weight: 600;
    }

    .feedback-section {
      margin-top: 15px;
      padding: 10px;
      background: rgba(14, 165, 233, 0.1);
      border-left: 3px solid #0ea5e9;
      border-radius: 4px;
    }

    .feedback-title {
      font-size: 13px;
      font-weight: 600;
      color: #7dd3fc;
      margin-bottom: 5px;
    }

    .feedback-content {
      font-size: 12px;
      color: #cbd5e1;
      white-space: pre-wrap;
      font-family: monospace;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0ea5e9;
      color: white;
    }

    .btn-primary:hover {
      background: #0284c7;
    }

    .btn-secondary {
      background: #475569;
      color: white;
    }

    .btn-secondary:hover {
      background: #334155;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #7dd3fc;
    }

    .error-message {
      background: #7f1d1d;
      color: #fca5a5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchData();
    this.startAutoRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRefresh();
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.fetchData();
    }, 5000);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async fetchData() {
    try {
      // Fetch refinement cycles (when API is available)
      // For now, use mock data
      this.cycles = [
        {
          cycle_id: 'refine-abc123',
          task_id: 'healing-backend-001',
          status: 'converged',
          current_iteration: 3,
          max_iterations: 5,
          improvement_scores: [0.0, 0.35, 0.72],
          started_at: '2026-03-02T01:00:00Z',
          completed_at: '2026-03-02T01:05:00Z',
          feedback: 'Service restart verification failed: health endpoint not responding'
        },
        {
          cycle_id: 'refine-def456',
          task_id: 'healing-worker-002',
          status: 'in_progress',
          current_iteration: 2,
          max_iterations: 5,
          improvement_scores: [0.0, 0.28],
          started_at: '2026-03-02T01:03:00Z',
          feedback: 'Container health check failed'
        }
      ];

      this.history = [
        {
          cycle_id: 'refine-xyz789',
          task_id: 'healing-api-003',
          status: 'converged',
          iterations: 4,
          final_score: 0.95,
          duration_ms: 12000
        }
      ];

      this.error = null;
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>🔄 Loading refinement data...</div>
        </div>
      `;
    }

    const activeCycles = this.cycles.filter(c => c.status === 'in_progress');
    const completedCycles = this.cycles.filter(c => c.status !== 'in_progress');

    return html`
      <div class="header">
        <div>
          <h1>🔄 Refinement Loops</h1>
          <div class="subtitle">Iterative improvement for healing actions</div>
        </div>
        <button class="btn btn-secondary" @click=${this.fetchData}>
          ↻ Refresh
        </button>
      </div>

      ${this.error ? html`
        <div class="error-message">
          ❌ ${this.error}
        </div>
      ` : ''}

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Active Cycles</h3>
          <div class="stat-value ${activeCycles.length > 0 ? 'warning' : 'success'}">
            ${activeCycles.length}
          </div>
        </div>

        <div class="stat-card">
          <h3>Converged</h3>
          <div class="stat-value success">
            ${completedCycles.filter(c => c.status === 'converged').length}
          </div>
        </div>

        <div class="stat-card">
          <h3>Failed</h3>
          <div class="stat-value">
            ${completedCycles.filter(c => c.status === 'failed').length}
          </div>
        </div>

        <div class="stat-card">
          <h3>Avg Iterations</h3>
          <div class="stat-value">
            ${completedCycles.length > 0
              ? (completedCycles.reduce((sum, c) => sum + c.current_iteration, 0) / completedCycles.length).toFixed(1)
              : '0'}
          </div>
        </div>
      </div>

      ${activeCycles.length > 0 ? html`
        <div class="section">
          <div class="section-header">
            <div class="section-title">🔄 Active Refinement Cycles</div>
          </div>
          ${activeCycles.map(cycle => this.renderCycle(cycle, true))}
        </div>
      ` : ''}

      ${completedCycles.length > 0 ? html`
        <div class="section">
          <div class="section-header">
            <div class="section-title">✅ Completed Cycles</div>
          </div>
          ${completedCycles.map(cycle => this.renderCycle(cycle, false))}
        </div>
      ` : ''}

      ${this.cycles.length === 0 ? html`
        <div class="section">
          <div class="empty-state">
            <div class="empty-state-icon">🔄</div>
            <div>No refinement cycles yet</div>
            <div style="font-size: 14px; margin-top: 10px;">
              Refinement starts automatically when healing verification fails
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  private renderCycle(cycle: any, isActive: boolean) {
    return html`
      <div class="cycle-item">
        <div class="cycle-header">
          <div>
            <div class="cycle-id">${cycle.cycle_id}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
              Task: ${cycle.task_id}
            </div>
          </div>
          <span class="status-badge status-${cycle.status}">
            ${cycle.status.replace('_', ' ')}
          </span>
        </div>

        ${cycle.feedback ? html`
          <div class="feedback-section">
            <div class="feedback-title">Initial Feedback</div>
            <div class="feedback-content">${cycle.feedback}</div>
          </div>
        ` : ''}

        <div style="margin-top: 15px;">
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 5px;">
            Iterations: ${cycle.current_iteration} / ${cycle.max_iterations}
          </div>

          <div class="iteration-timeline">
            ${Array.from({ length: cycle.current_iteration }, (_, i) => {
              const score = cycle.improvement_scores[i] || 0;
              const isCurrent = i === cycle.current_iteration - 1 && isActive;
              const isImproved = score > 0.1;

              return html`
                <div class="iteration-dot ${isCurrent ? 'current' : isImproved ? 'improved' : ''}">
                  ${i + 1}
                </div>
              `;
            })}
          </div>
        </div>

        ${cycle.improvement_scores && cycle.improvement_scores.length > 0 ? html`
          <div class="improvement-chart">
            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 10px;">
              Improvement Scores
            </div>
            <div class="chart-bar-container">
              ${cycle.improvement_scores.map((score: number, i: number) => {
                const height = Math.max(score * 100, 10);
                return html`
                  <div class="chart-bar" style="height: ${height}%;">
                    <div class="chart-bar-label">Iter ${i + 1}</div>
                    <div class="chart-bar-value">${(score * 100).toFixed(0)}%</div>
                  </div>
                `;
              })}
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
          Started: ${new Date(cycle.started_at).toLocaleString()}
          ${cycle.completed_at ? html` | Completed: ${new Date(cycle.completed_at).toLocaleString()}` : ''}
        </div>
      </div>
    `;
  }
}
