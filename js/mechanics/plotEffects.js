/**
 * Plot Effects Module
 * Visual effects and bonus calculations for plots
 */

/**
 * Show confetti animation
 */
export function showConfetti() {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `position:absolute;width:10px;height:10px;background:${['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'][Math.floor(Math.random() * 6)]};top:-20px;left:${Math.random() * 100}%;animation:confetti-fall ${2 + Math.random() * 2}s linear forwards`;
        container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
}

/**
 * Calculate synergy bonus for a plot based on building diversity
 * @param {Object} plot - Plot object
 * @returns {number} - Bonus multiplier (1.0 = no bonus)
 */
export function calculateSynergyBonus(plot) {
    if (!plot || !plot.subs || plot.subs.length < 3) return 1.0;

    const types = new Set(plot.subs.map(s => s.t).filter(t => t));
    if (types.size >= 3) return 1.2; // 20% bonus for 3+ different types
    if (types.size >= 2) return 1.1; // 10% bonus for 2+ different types
    return 1.0;
}

/**
 * Get background color for a plot based on subplot types
 * @param {Object} plot - Plot object
 * @returns {string} - CSS color value
 */
export function getPlotBackground(plot) {
    if (!plot || !plot.subs || plot.subs.length < 3) return 'var(--bg2)';

    const types = plot.subs.map(s => window.T?.[s.t]?.category || 'none');
    const farmCount = types.filter(t => t === 'farm').length;
    const mineCount = types.filter(t => t === 'mine').length;

    if (farmCount >= 3) return 'linear-gradient(135deg, var(--bg2), #2d4a2d)'; // Green tint
    if (mineCount >= 3) return 'linear-gradient(135deg, var(--bg2), #4a3d2d)'; // Brown tint

    return 'var(--bg2)';
}
