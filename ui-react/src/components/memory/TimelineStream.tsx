import { StreamLine } from './StreamLine';
import { DateMarker } from './DateMarker';
import { EpisodeCard } from './EpisodeCard';

export interface TimelineEpisode {
  id: string;
  agent: string;
  icon: string;
  eventType: string;
  content: string;
  time: string;
  salience: number;
  accentColor: string;
}

export interface TimelineDateGroup {
  date: string;
  episodes: TimelineEpisode[];
}

export interface TimelineStreamProps {
  groups: TimelineDateGroup[];
  className?: string;
}

/**
 * TimelineStream - Vertical timeline with gradient stream line and episode cards
 *
 * Renders date groups with a vertical animated line and branching episode cards.
 */
export function TimelineStream({ groups, className = '' }: TimelineStreamProps) {
  let episodeIndex = 0;

  return (
    <div className={`flex-1 overflow-y-auto pr-5 ni-scrollbar ${className}`}>
      <div className="relative" style={{ paddingLeft: '40px' }}>
        <StreamLine />

        {groups.map((group) => (
          <div key={group.date}>
            <DateMarker date={group.date} />
            {group.episodes.map((ep) => {
              const delay = episodeIndex * 0.1;
              episodeIndex++;
              return (
                <EpisodeCard
                  key={ep.id}
                  agent={ep.agent}
                  icon={ep.icon}
                  eventType={ep.eventType}
                  content={ep.content}
                  time={ep.time}
                  salience={ep.salience}
                  accentColor={ep.accentColor}
                  animationDelay={delay}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
