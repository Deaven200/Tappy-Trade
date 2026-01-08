/**
 * Day/Night Cycle Module
 * Updates CSS variables based on time of day
 */

/**
 * Update day/night visual theme based on current time
 */
export function updateDayNight() {
    const hour = new Date().getHours();
    const root = document.documentElement;

    if (hour >= 6 && hour < 12) {
        // Morning (6am-12pm)
        root.style.setProperty('--bg', '#1a1a2e');
        root.style.setProperty('--bg2', '#16213e');
        document.body.style.background = 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)';
    } else if (hour >= 12 && hour < 18) {
        // Afternoon (12pm-6pm)
        root.style.setProperty('--bg', '#1e1e3f');
        root.style.setProperty('--bg2', '#252552');
        document.body.style.background = 'linear-gradient(180deg, #1e1e3f 0%, #252552 100%)';
    } else if (hour >= 18 && hour < 21) {
        // Evening (6pm-9pm) - sunset colors
        root.style.setProperty('--bg', '#1a1025');
        root.style.setProperty('--bg2', '#251a35');
        document.body.style.background = 'linear-gradient(180deg, #1a1025 0%, #251a35 100%)';
    } else {
        // Night (9pm-6am)
        root.style.setProperty('--bg', '#0d0d1a');
        root.style.setProperty('--bg2', '#12121f');
        document.body.style.background = 'linear-gradient(180deg, #0d0d1a 0%, #12121f 100%)';
    }
}

/**
 * Start the day/night cycle interval
 */
export function startDayNightCycle() {
    updateDayNight();
    setInterval(updateDayNight, 60000); // Update every minute
}
