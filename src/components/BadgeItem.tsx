import { memo } from 'react'
import type { Badge } from '../hooks/useGame'
import { createTranslator, getBadgeTranslationKeys } from '../utils/i18n'
import type { Translator } from '../utils/i18n'
interface BadgeItemProps {
    badge: Badge
    isUnlocked: boolean
    translate?: Translator
}

const BadgeItem = memo(({ badge, isUnlocked, translate = createTranslator('en') }: BadgeItemProps) => {
    const [nameKey, descriptionKey] = getBadgeTranslationKeys(badge.id)
    return (
    <div className={`badge-item ${isUnlocked ? 'unlocked' : ''}`}>
        <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
        <div className="badge-tooltip">
            <strong>{translate(nameKey)}</strong>
            <p>{translate(descriptionKey)}</p>
            {!isUnlocked && <span style={{ fontSize: '0.6rem', color: 'var(--color-accent)' }}>{translate('locked')}</span>}
        </div>
    </div>
    )
})
export default BadgeItem
