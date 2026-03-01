import { MissionsDashboard } from '../../components/MissionsDashboard';

/**
 * MissionsPage - Parallel Team Orchestration
 *
 * Phase 5: Launch and manage parallel teams working on missions.
 */
export function MissionsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto ni-scrollbar">
        <MissionsDashboard />
      </div>
    </div>
  );
}
