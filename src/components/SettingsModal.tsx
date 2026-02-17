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
    <div className="modal-overlay animate-pop" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Settings ⚙️</h3>
            <div className="setting-item">
                <label>Your Name:</label>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => onUpdateName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                />
            </div>
            <div className="setting-item">
                <label>Speed (Seconds):</label>
                <div className="timer-options">
                    {[5, 10, 15, 20].map(t => (
                        <button
                            type="button"
                            key={t}
                            className={initialTime === t ? 'primary' : ''}
                            onClick={() => onUpdateTimer(t)}
                        >
                            {t}s
                        </button>
                    ))}
                </div>
            </div>
            <div className="setting-item">
                <button
                    type="button"
                    className="danger"
                    onClick={() => { if (confirm('Reset all stats?')) onResetStats(); }}
                >
                    Reset Progress 🗑️
                </button>
            </div>
            <button type="button" className="close-modal" onClick={onClose}>Close</button>
        </div>
    </div>
);

export default SettingsModal;
