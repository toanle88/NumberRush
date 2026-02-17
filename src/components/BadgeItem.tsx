import { memo } from 'react';
import type { Badge } from '../hooks/useGame';

interface BadgeItemProps {
    badge: Badge;
    isUnlocked: boolean;
}

const BadgeItem = memo(({ badge, isUnlocked }: BadgeItemProps) => (
    <div className={`badge-item ${isUnlocked ? 'unlocked' : ''}`}>
        <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
        <div className="badge-tooltip">
            <strong>{badge.name}</strong>
            <p>{badge.description}</p>
            {!isUnlocked && <span style={{ fontSize: '0.6rem', color: 'var(--color-accent)' }}>Locked</span>}
        </div>
    </div>
));

export default BadgeItem;
