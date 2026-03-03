/**
 * Self-Healing View for Athena Control UI
 *
 * Dashboard for monitoring and managing self-healing actions.
 *
 * Author: Athena
 * Date: 2026-03-02
 */

import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export function renderHealing(props: { config: any }) {
  return html`
    <healing-view .config=${props.config}></healing-view>
  `;
}

@customElement('healing-view')
export class HealingView extends LitElement {
  @property({ type: Object }) config: any = {};
  @state() private status: any = null;
  @state() private proposals: any[] = [];
  @state() private history: any[] = [];
  @state() private loading: boolean = true;
  @state() private error: string | null = null;
  @state() private monitoringEnabled: boolean = false;

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

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .status-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .status-card h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-value {
      font-size: 32px;
      font-weight: bold;
      color: #7dd3fc;
    }

    .status-value.healthy {
      color: #4ade80;
    }

    .status-value.warning {
      color: #fbbf24;
    }

    .status-value.critical {
      color: #f87171;
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

    .proposal-item, .history-item {
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
    }

    .proposal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .proposal-action {
      font-weight: 600;
      color: #7dd3fc;
    }

    .proposal-target {
      color: #94a3b8;
      font-size: 14px;
    }

    .proposal-details {
      font-size: 13px;
      color: #cbd5e1;
      margin-top: 10px;
    }

    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .risk-low {
      background: #065f46;
      color: #6ee7b7;
    }

    .risk-medium {
      background: #78350f;
      color: #fcd34d;
    }

    .risk-high {
      background: #7f1d1d;
      color: #fca5a5;
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

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      background: #475569;
      color: white;
    }

    .btn-secondary:hover {
      background: #334155;
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

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toggle {
      position: relative;
      width: 50px;
      height: 26px;
      background: #475569;
      border-radius: 13px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .toggle.active {
      background: #0ea5e9;
    }

    .toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: left 0.3s;
    }

    .toggle.active .toggle-knob {
      left: 27px;
    }

    .container-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }

    .container-chip {
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .container-name {
      font-weight: 500;
      color: #e0f2fe;
    }

    .container-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4ade80;
    }

    .container-status.unhealthy {
      background: #f87171;
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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchStatus();
    this.startAutoRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRefresh();
  }

  private startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.fetchStatus();
    }, 5000); // Refresh every 5 seconds
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private async fetchStatus() {
    try {
      const response = await fetch('/api/v1/healing/status', {
        headers: {
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        }
      });

      if (!response.ok) {throw new Error('Failed to fetch status');}

      this.status = await response.json();
      this.monitoringEnabled = this.status.monitor?.running || false;
      this.error = null;
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  private async fetchProposals() {
    try {
      const response = await fetch('/api/v1/healing/proposals/pending', {
        headers: {
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        }
      });

      if (!response.ok) {throw new Error('Failed to fetch proposals');}

      const data = await response.json();
      this.proposals = data.proposals || [];
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
    }
  }

  private async fetchHistory() {
    try {
      const response = await fetch('/api/v1/healing/history?limit=10', {
        headers: {
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        }
      });

      if (!response.ok) {throw new Error('Failed to fetch history');}

      const data = await response.json();
      this.history = data.events || [];
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
    }
  }

  private async toggleMonitoring() {
    try {
      const endpoint = this.monitoringEnabled ? 'stop' : 'start';
      const response = await fetch(`/api/v1/healing/monitor/${endpoint}`, {
        method: 'POST',
        headers: {
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        }
      });

      if (!response.ok) {throw new Error(`Failed to ${endpoint} monitoring`);}

      this.monitoringEnabled = !this.monitoringEnabled;
      await this.fetchStatus();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  private async approveProposal(proposalId: string) {
    try {
      const response = await fetch(`/api/v1/healing/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          approved_by: 'athena-ui'
        })
      });

      if (!response.ok) {throw new Error('Failed to approve proposal');}

      await this.fetchProposals();
      await this.fetchHistory();
    } catch (err: any) {
      this.error = err.message;
    }
  }

  private async triggerManualHealing() {
    const container = prompt('Container name (e.g., backend):');
    if (!container) {return;}

    const service = prompt('Service name (e.g., pronetheia-api):');
    if (!service) {return;}

    try {
      const response = await fetch('/api/v1/healing/manual-healing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Secret': this.config.gatewaySecret || ''
        },
        body: JSON.stringify({
          container,
          service,
          approved_by: 'athena-ui'
        })
      });

      if (!response.ok) {throw new Error('Manual healing failed');}

      await this.fetchHistory();
      alert('Healing cycle completed successfully!');
    } catch (err: any) {
      this.error = err.message;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div>🔄 Loading healing status...</div>
        </div>
      `;
    }

    return html`
      <div class="header">
        <div>
          <h1>🦉 Self-Healing Engine</h1>
          <div class="subtitle">Autonomy Level 1: Human Approval Required</div>
        </div>
        <div class="toggle-container">
          <span>Monitoring:</span>
          <div class="toggle ${this.monitoringEnabled ? 'active' : ''}" @click=${this.toggleMonitoring}>
            <div class="toggle-knob"></div>
          </div>
          <button class="btn btn-primary" @click=${this.triggerManualHealing}>
            ⚡ Manual Heal
          </button>
        </div>
      </div>

      ${this.error ? html`
        <div class="error-message">
          ❌ ${this.error}
        </div>
      ` : ''}

      ${this.status ? html`
        <div class="status-grid">
          <div class="status-card">
            <h3>Containers Monitored</h3>
            <div class="status-value">${Object.keys(this.status.monitor.containers).length}</div>
          </div>

          <div class="status-card">
            <h3>Pending Approvals</h3>
            <div class="status-value ${this.status.pending_proposals > 0 ? 'warning' : 'healthy'}">
              ${this.status.pending_proposals}
            </div>
          </div>

          <div class="status-card">
            <h3>Healing Events</h3>
            <div class="status-value">${this.status.events_count}</div>
          </div>

          <div class="status-card">
            <h3>Registry Stats</h3>
            <div class="status-value" style="font-size: 18px;">
              ${this.status.registry.approved} approved / ${this.status.registry.executed} executed
            </div>
          </div>
        </div>

        ${Object.keys(this.status.monitor.containers).length > 0 ? html`
          <div class="section">
            <div class="section-header">
              <div class="section-title">Monitored Containers</div>
            </div>
            <div class="container-list">
              ${Object.entries(this.status.monitor.containers).map(([name, info]: [string, any]) => html`
                <div class="container-chip">
                  <span class="container-name">${name}</span>
                  <div class="container-status ${info.status === 'healthy' ? '' : 'unhealthy'}"></div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${this.proposals.length > 0 ? html`
          <div class="section">
            <div class="section-header">
              <div class="section-title">⏳ Pending Approvals</div>
              <button class="btn btn-secondary" @click=${this.fetchProposals}>Refresh</button>
            </div>
            ${this.proposals.map(p => html`
              <div class="proposal-item">
                <div class="proposal-header">
                  <div>
                    <div class="proposal-action">${p.action}</div>
                    <div class="proposal-target">${p.target} on ${p.container}</div>
                  </div>
                  <span class="risk-badge risk-${p.risk_level}">${p.risk_level}</span>
                </div>
                <div class="proposal-details">
                  <div><strong>Impact:</strong> ${p.estimated_impact}</div>
                  <div><strong>Command:</strong> <code>${p.command}</code></div>
                  ${p.rollback_command ? html`<div><strong>Rollback:</strong> <code>${p.rollback_command}</code></div>` : ''}
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                  <button class="btn btn-success" @click=${() => this.approveProposal(p.id)}>
                    ✓ Approve
                  </button>
                  <button class="btn btn-danger">
                    ✗ Reject
                  </button>
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this.history.length > 0 ? html`
          <div class="section">
            <div class="section-header">
              <div class="section-title">📜 Healing History</div>
              <button class="btn btn-secondary" @click=${this.fetchHistory}>Refresh</button>
            </div>
            ${this.history.map(h => html`
              <div class="history-item">
                <div class="proposal-header">
                  <div>
                    <div class="proposal-action">${h.action}</div>
                    <div class="proposal-target">${h.service} on ${h.container}</div>
                  </div>
                  <span style="color: ${h.success ? '#4ade80' : '#f87171'}">
                    ${h.success ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                <div class="proposal-details">
                  <div><strong>Time:</strong> ${new Date(h.timestamp).toLocaleString()}</div>
                  ${h.verification ? html`
                    <div><strong>Checks:</strong> ${h.verification.checks?.length || 0} performed</div>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this.proposals.length === 0 && this.history.length === 0 ? html`
          <div class="section">
            <div class="empty-state">
              <div class="empty-state-icon">🦉</div>
              <div>No healing activity yet</div>
              <div style="font-size: 14px; margin-top: 10px;">
                Start monitoring or trigger a manual healing cycle
              </div>
            </div>
          </div>
        ` : ''}
      ` : ''}
    `;
  }
}
