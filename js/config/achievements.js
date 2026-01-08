/**
 * Achievement Definitions
 * Defines all game achievements with unlock conditions
 */

export const ACHIEVEMENTS = [
    // Harvest milestones
    { id: 'h100', n: 'Harvester', d: 'Harvest 100 items', type: 'harvest', req: 100 },
    { id: 'h1000', n: 'Farmer', d: 'Harvest 1000 items', type: 'harvest', req: 1000 },
    { id: 'h5000', n: 'Agriculturist', d: 'Harvest 5000 items', type: 'harvest', req: 5000 },

    // Money milestones
    { id: 'm1000', n: 'Trader', d: 'Earn $1000', type: 'money', req: 1000 },
    { id: 'm10000', n: 'Merchant', d: 'Earn $10000', type: 'money', req: 10000 },
    { id: 'm50000', n: 'Tycoon', d: 'Earn $50000', type: 'money', req: 50000 },

    // Land ownership
    { id: 'p2', n: 'Landowner', d: 'Own 2 plots', type: 'plot', req: 2 },
    { id: 'p4', n: 'Estate Owner', d: 'Own 4 plots', type: 'plot', req: 4 },

    // Building milestones
    { id: 'b1', n: 'Builder', d: 'Build 1 building', type: 'build', req: 1 },
    { id: 'b5', n: 'Architect', d: 'Build 5 buildings', type: 'build', req: 5 },
    { id: 'b10', n: 'Developer', d: 'Build 10 buildings', type: 'build', req: 10 },

    // Worker milestones
    { id: 'w1', n: 'Employer', d: 'Hire 1 worker', type: 'worker', req: 1 },
    { id: 'w5', n: 'Manager', d: 'Hire 5 workers', type: 'worker', req: 5 },
    { id: 'w10', n: 'CEO', d: 'Hire 10 workers', type: 'worker', req: 10 },

    // Trading achievements
    { id: 'sell100', n: 'Salesman', d: 'Sell 100 items', type: 'sell', req: 100 },
    { id: 'sell1000', n: 'Wholesaler', d: 'Sell 1000 items', type: 'sell', req: 1000 },
];

// Backwards compatibility
export const ACH = ACHIEVEMENTS;
