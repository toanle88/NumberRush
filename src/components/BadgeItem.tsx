import type { Badge } from '../hooks/useGame';

interface BadgeItemProps {
    badge: Badge;
    isUnlocked: boolean;
}

const BadgeItem = ({ badge, isUnlocked }: BadgeItemProps) => (
    <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-white/5 transition-all duration-300 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-90'} group`}>
        <span className="text-2xl" aria-hidden="true">{badge.icon}</span>
        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-3 rounded-lg bg-slate-800/95 backdrop-blur-md border border-white/20 shadow-xl z-50 text-left">
            <strong className="block text-sm text-white">{badge.name}</strong>
            <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
            {!isUnlocked && <span className="text-[10px] text-pink-500 font-bold uppercase mt-1 block">Locked</span>}
        </div>
    </div>
);

export default BadgeItem;
