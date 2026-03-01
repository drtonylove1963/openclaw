import { SwarmDashboard } from '../../components/SwarmDashboard';

/**
 * SwarmPage - Agent Swarm Orchestration
 *
 * Wraps the SwarmDashboard component for the neural interface routing.
 * Provides decentralized multi-agent coordination with democratic decision-making.
 */
export function SwarmPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto ni-scrollbar">
        <SwarmDashboard />
      </div>
    </div>
  );
}
