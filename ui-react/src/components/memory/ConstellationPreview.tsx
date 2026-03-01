import { EntityNode } from './EntityNode';

export interface ConstellationEntity {
  label: string;
  size?: 'normal' | 'large';
  top: string;
  left?: string;
  right?: string;
  delay: number;
}

export interface ConstellationPreviewProps {
  entities?: ConstellationEntity[];
  className?: string;
}

const DEFAULT_ENTITIES: ConstellationEntity[] = [
  { label: 'FastAPI', size: 'large', top: '10%', left: '40%', delay: 0 },
  { label: 'PostgreSQL', size: 'normal', top: '35%', left: '18%', delay: 0.5 },
  { label: 'JWT', size: 'normal', top: '35%', right: '18%', delay: 1 },
  { label: 'SQLAlchemy', size: 'normal', top: '65%', left: '8%', delay: 1.5 },
  { label: 'Pydantic', size: 'normal', top: '65%', right: '8%', delay: 2 },
  { label: 'Redis', size: 'normal', top: '72%', left: '35%', delay: 2.5 },
  { label: 'Uvicorn', size: 'normal', top: '60%', right: '25%', delay: 3 },
  { label: 'REST API', size: 'large', top: '45%', left: '42%', delay: 0.2 },
];

/**
 * ConstellationPreview - Mini knowledge graph with entity nodes and SVG lines
 *
 * Shows floating entity labels connected by faint lines.
 */
export function ConstellationPreview({
  entities = DEFAULT_ENTITIES,
  className = '',
}: ConstellationPreviewProps) {
  return (
    <div className={`relative ${className}`} style={{ height: '200px', margin: '20px 0' }}>
      {/* Connection lines */}
      <svg
        className="absolute w-full h-full"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <line x1="50%" y1="20%" x2="30%" y2="50%" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
        <line x1="50%" y1="20%" x2="70%" y2="50%" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
        <line x1="30%" y1="50%" x2="20%" y2="80%" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
        <line x1="70%" y1="50%" x2="80%" y2="80%" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
        <line x1="30%" y1="50%" x2="50%" y2="85%" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
      </svg>

      {/* Entity nodes */}
      {entities.map((entity) => (
        <EntityNode
          key={entity.label}
          label={entity.label}
          size={entity.size}
          animationDelay={entity.delay}
          style={{
            top: entity.top,
            left: entity.left,
            right: entity.right,
          }}
        />
      ))}
    </div>
  );
}
