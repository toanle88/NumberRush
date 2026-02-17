interface SettingsModalProps {
    playerName: string;
    initialTime: number;
    onClose: () => void;
    onUpdateName: (name: string) => void;
    onUpdateTimer: (time: number) => void;
    onResetStats: () => void;
}

const SettingsModal = ({
    playerName,
    initialTime,
    onClose,
    onUpdateName,
    onUpdateTimer,
    onResetStats,
}: SettingsModalProps) => (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[100] animate-pop-in" onClick={onClose}>
        <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-extrabold text-white mb-6">Settings ⚙️</h3>

            <div className="space-y-6">
                <div className="text-left">
                    <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Name</label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => onUpdateName(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="text-left">
                    <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Speed (Seconds)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map(t => (
                            <button
                                type="button"
                                key={t}
                                className={`py-2 text-sm font-bold rounded-lg border transition-all ${initialTime === t ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                onClick={() => onUpdateTimer(t)}
                            >
                                {t}s
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <button
                        type="button"
                        className="w-full py-3 text-sm font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl hover:bg-red-400/20 transition-all"
                        onClick={() => { if (confirm('Reset all stats?')) onResetStats(); }}
                    >
                        Reset Progress 🗑️
                    </button>

                    <button
                        type="button"
                        className="w-full py-3 text-sm font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default SettingsModal;
