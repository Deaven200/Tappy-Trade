/**
 * Tappy Trade - Main Entry Point
 * Modular version integrating all game systems
 */

// ===== IMPORTS =====

// Config modules
import { R, RESOURCES, ITEM_CATS } from './config/resources.js';
import { T, B, PLOTS, SUBPLOT_TYPES, BUILDINGS } from './config/buildings.js';
import { ACH, ACHIEVEMENTS } from './config/achievements.js';
import { GAME_VERSION, VERSION_DATE, CONFIG, EVENTS, DAILY_REWARDS, SAVE_VERSION } from './config/constants.js';

// Utility modules
import { sanitizeHTML, sanitizeInput } from './utils/security.js';
import { $, updateSaveIndicator, setLastSaveTime, setupImageErrorFallback } from './utils/dom.js';
import { toast, notif, floatText, floatTextAt, playS, vibrate } from './utils/feedback.js';
import { getInvTotal, hasItem, addItem, remItem } from './utils/inventory.js';

// Init global error handlers
setupImageErrorFallback();

// Core modules
import { S, getDefaultState } from './core/state.js';
import { save, load, saveToCloud, loadFromCloud } from './core/storage.js';

// UI modules (Phase 2D)
import {
    render, switchScreen, updateStats, setInvView, setInvSort,
    showHome, showInventory, showWorkers, showPlayerMarket, showStats, showHelp, showAchievements, showPriceList
} from './ui/render.js';
import { initializeEventHandlers } from './ui/eventHandlers.js';

// Mechanics modules (Phase 2E)
import { tap } from './mechanics/harvesting.js';
import { buyPlot, getPlotCost, canAffordPlot } from './mechanics/plots.js';
import { hireWorker, fireWorker, updateWorkers } from './mechanics/workers.js';
import { sell, sellAll, buyFromGov, submitLimitOrder, cancelOrder, getPrice } from './mechanics/market.js';
import { update, startGameLoop } from './mechanics/gameLoop.js';
import { openBuild, doBuild, closeBuild, canAfford, pay, getUpgradeCost } from './mechanics/building.js';

// Multiplayer modules (Phase 2F)
import { showAccount, closeAccount, registerAccount, loginAccount, logoutAccount, loadSavedUser, getLoggedInUser, updateAccountButton } from './multiplayer/accounts.js';
import { showChat, closeChat, sendChat, setupChatKeyboard } from './multiplayer/chat.js';
import { showLeaderboard, closeLeaderboard } from './multiplayer/leaderboard.js';
import { loadGovernmentTiers, recordGovernmentSale, calculateGovernmentPrice, getAllPlayerTiers } from './mechanics/governmentTiers.js';
// Duplicate removed

// UI System modules (Phase 2H)
import { applySettings, setTheme, setFontSize, toggleTheme, updateThemeButton } from './ui/settings.js';
import { showMenu, closeMenu, toggleMenu } from './ui/menu.js';
import { showConfetti, closeAchieve } from './ui/achievementsUI.js';
import { closeTutorial, showTutorialIfNeeded } from './ui/tutorial.js';
import { renderHelp } from './ui/help.js';
import { renderStats } from './ui/stats.js';
import { showGovernmentDev, closeGovernmentDev } from './ui/governmentDev.js';
import { renameFarm } from './ui/farmNaming.js';
import { resetGame } from './ui/gameReset.js';
import { showTip } from './ui/tooltip.js';
import { renderMarket, renderPlayerMarket, setSellQty, resetMarketInit, renderPriceList } from './ui/markets.js';
import { showSuggestions, closeSuggestions, sendSuggestion } from './ui/suggestions.js';

// Additional Mechanics (Phase 2H)
import { claimDaily, canClaimDaily, getDailyRewardInfo, showDaily, closeDaily } from './mechanics/dailyRewards.js';
import { checkAchievements, getAchievementProgress, getUnlockedCount } from './mechanics/achievements.js';
import { calculateSynergyBonus, getPlotBackground } from './mechanics/plotEffects.js';
import { createLimitOrder, cancelLimitOrder, processLimitOrders } from './firebase/limitOrders.js';
import { postOrder, fillOrder, cancelOrder as cancelPlayerOrder } from './firebase/playerMarket.js';
import { updateDayNight, startDayNightCycle } from './ui/dayNight.js';
import { showLoginScreen, hideLoginScreen, showLoginForm, showRegisterForm, backToMainLogin, handleLogin, handleRegister, continueAsGuest, convertGuestToAccount, shouldShowLoginScreen } from './ui/loginScreen.js';
import { init } from './core/init.js';

// ===== GLOBAL EXPORTS FOR BACKWARDS COMPATIBILITY =====

// Make everything available on window for the remaining non-modular code
window.R = R;
window.RESOURCES = RESOURCES;
window.ITEM_CATS = ITEM_CATS;
window.T = T;
window.SUBPLOT_TYPES = SUBPLOT_TYPES;
window.B = B;
window.BUILDINGS = BUILDINGS;
window.PLOTS = PLOTS;
window.ACH = ACH;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.GAME_VERSION = GAME_VERSION;
window.VERSION_DATE = VERSION_DATE;
window.CONFIG = CONFIG;
window.EVENTS = EVENTS;
window.DAILY_REWARDS = DAILY_REWARDS;
window.SAVE_VERSION = SAVE_VERSION;

// Utilities
window.sanitizeHTML = sanitizeHTML;
window.sanitizeInput = sanitizeInput;
window.$ = $;
window.updateSaveIndicator = updateSaveIndicator;
window.setLastSaveTime = setLastSaveTime;
window.toast = toast;
window.notif = notif;
window.floatText = floatText;
window.floatTextAt = floatTextAt; // Actual function, not alias
window.playS = playS;
window.vibrate = vibrate;
window.toast = toast;
window.notif = notif;

// Inventory helpers - wrap to auto-pass S.inv
window.getInvTotal = () => getInvTotal(S.inv || {});
window.hasItem = (id, n) => hasItem(S.inv || {}, id, n);
window.addItem = (id, n) => addItem(S.inv || {}, id, n);
window.remItem = (id, n) => remItem(id, n); // Uses S.inv directly now

// Core  
window.S = S;
window.getDefaultState = getDefaultState;
window.save = save;
window.load = load;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;

// UI (Phase 2D)
window.render = render;
window.switchScreen = switchScreen;
window.updateStats = updateStats;
window.setInvView = setInvView;
window.setInvSort = setInvSort;
window.showHome = showHome;
window.showInventory = showInventory;
window.showWorkers = showWorkers;
window.showPlayerMarket = showPlayerMarket;
window.showStats = showStats;
window.showHelp = showHelp;
window.showAchievements = showAchievements;
window.initializeEventHandlers = initializeEventHandlers;

// Mechanics (Phase 2E)
window.tap = tap;
window.buyPlot = buyPlot;
window.getPlotCost = getPlotCost;
window.canAffordPlot = canAffordPlot;
window.hireWorker = hireWorker;
window.fireWorker = fireWorker;
window.updateWorkers = updateWorkers;
window.sell = sell;
window.sellAll = sellAll;
window.buyFromGov = buyFromGov;
window.submitLimitOrder = submitLimitOrder;
window.cancelOrder = cancelOrder;
window.getPrice = getPrice;
window.update = update;
window.startGameLoop = startGameLoop;

// Building (Phase 2G)
window.openBuild = openBuild;
window.doBuild = doBuild;
window.closeBuild = closeBuild;
window.canAfford = canAfford;
window.pay = pay;
window.getUpgradeCost = getUpgradeCost;

// Multiplayer (Phase 2F)
window.showAccount = showAccount;
window.closeAccount = closeAccount;
window.registerAccount = registerAccount;
window.loginAccount = loginAccount;
window.logoutAccount = logoutAccount;
window.loadSavedUser = loadSavedUser;
window.getLoggedInUser = getLoggedInUser;
window.updateAccountButton = updateAccountButton;
window.showChat = showChat;
window.closeChat = closeChat;
window.sendChat = sendChat;
window.setupChatKeyboard = setupChatKeyboard;
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard;
window.loadGovernmentTiers = loadGovernmentTiers;
window.recordGovernmentSale = recordGovernmentSale;
window.calculateGovernmentPrice = calculateGovernmentPrice;
window.getAllPlayerTiers = getAllPlayerTiers;

// UI Systems (Phase 2H)
window.applySettings = applySettings;
window.setTheme = setTheme;
window.setFontSize = setFontSize;
window.toggleTheme = toggleTheme;
window.updateThemeButton = updateThemeButton;
window.showMenu = showMenu;
window.closeMenu = closeMenu;
window.toggleMenu = toggleMenu;
window.showConfetti = showConfetti;
window.closeAchieve = closeAchieve;
window.closeTutorial = closeTutorial;
window.showTutorialIfNeeded = showTutorialIfNeeded;
window.renderHelp = renderHelp;
window.renderStats = renderStats;
window.showGovernmentDev = showGovernmentDev;
window.closeGovernmentDev = closeGovernmentDev;
window.renameFarm = renameFarm;
window.resetGame = resetGame;
window.showTip = showTip;
window.renderMarket = renderMarket;
window.renderPlayerMarket = renderPlayerMarket;
window.resetMarketInit = resetMarketInit;
window.setSellQty = setSellQty;
window.showSuggestions = showSuggestions;
window.closeSuggestions = closeSuggestions;
window.sendSuggestion = sendSuggestion;

// Additional Mechanics (Phase 2H)
window.claimDaily = claimDaily;
window.canClaimDaily = canClaimDaily;
window.getDailyRewardInfo = getDailyRewardInfo;
window.showDaily = showDaily;
window.closeDaily = closeDaily;
window.checkAchievements = checkAchievements;
window.getAchievementProgress = getAchievementProgress;
window.getUnlockedCount = getUnlockedCount;
window.calculateSynergyBonus = calculateSynergyBonus;
window.getPlotBackground = getPlotBackground;
window.createLimitOrder = createLimitOrder;
window.cancelLimitOrder = cancelLimitOrder;
window.processLimitOrders = processLimitOrders;
window.postOrder = postOrder;
window.fillOrder = fillOrder;
window.cancelOrder = cancelPlayerOrder; // Renamed to avoid conflict
window.updateDayNight = updateDayNight;
window.startDayNightCycle = startDayNightCycle;
window.showLoginScreen = showLoginScreen;
window.hideLoginScreen = hideLoginScreen;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.backToMainLogin = backToMainLogin;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.continueAsGuest = continueAsGuest;
window.convertGuestToAccount = convertGuestToAccount;
window.shouldShowLoginScreen = shouldShowLoginScreen;
window.renderPriceList = renderPriceList; // Export renderPriceList
window.showPriceList = showPriceList; // Export showPriceList
window.initializeEventHandlers = initializeEventHandlers; // Export initializeEventHandlers
window.init = init; // MOBILE FIX: Now properly imported at top of file

// ===== MODULE STATUS LOG =====

if (CONFIG.DEBUG_MODE || true) {  // Always log for now
    console.log('%c🎮 TAPPY TRADE - MODULAR VERSION', 'font-size:20px; font-weight:bold; color:#ffd700');
    console.log('%cVersion: ' + GAME_VERSION, 'font-size:14px; color:#4ade80');
    console.log('✅ Modularization: 43 modules active');

    // Detailed logs commented out - enable if debugging:
    /*
    console.log('%cSave Version: ' + SAVE_VERSION, 'font-size:12px; color:#60a5fa');
    console.log('');
    console.log('✅ Phase 2A: Config modules loaded');
    console.log('  📦 Resources: ' + Object.keys(RESOURCES).length + ' types');
    console.log('  🏗️ Buildings: ' + Object.keys(SUBPLOT_TYPES).length + ' types');
    console.log('  🏆 Achievements: ' + ACHIEVEMENTS.length + ' total');
    console.log('✅ Phase 2B: Utility modules loaded');
    console.log('  🔒 Security utilities');
    console.log('  🎨 UI feedback');
    console.log('  📦 Inventory helpers');
    console.log('✅ Phase 2C: Core modules loaded');
    console.log('  💾 State management');
    console.log('  💿 Storage system');
    console.log('🔄 Phase 2D: UI modules loading...');
    console.log('  🎨 Render coordinator');
    console.log('  🏠 Home screen (extracted)');
    console.log('  📦 Inventory screen (extracted)');
    console.log('  👷 Workers screen (extracted)');
    console.log('  📊 Stats screen (extracted)');
    console.log('🔄 Phase 2E: Mechanics modules loading...');
    console.log('  ⛏️ Harvesting (tap mechanics)');
    console.log('  🏞️ Plot management');
    console.log('  👷 Workers (hire/fire/automation)');
    console.log('  💰 Market (sell/buy/orders)');
    console.log('  🔄 Game loop (update cycle)');
    console.log('🔄 Phase 2F: Multiplayer modules loading...');
    console.log('  👤 Accounts (login/register/logout)');
    console.log('🔄 Phase 2G: Building system loading...');
    console.log('  🏗️ Building placement & upgrades');
    console.log('  ⬆️ Upgrade cost calculations');
    console.log('  🔨 Build modal UI');
    console.log('✅ Phase 2H: UI & User Systems loaded');
    console.log('  ⚙️ Settings & Theme');
    console.log('  📋 Menu System');
    console.log('  🏆 Achievements UI');
    console.log('  🎁 Daily Rewards');
    console.log('  🎲 Events System');
    console.log('  📖 Tutorial');
    console.log('✅ Phase 2I: Chat System loaded');
    console.log('  💬 Firebase Chat (fully functional)');
    console.log('✅ Phase 2J: Leaderboard loaded');
    console.log('  🏆 Top 20 Players');
    console.log('✅ Phase 2K: Help Screen loaded');
    console.log('  📖 Tutorial Content');
    console.log('✅ Phase 2L: Final UI Utilities loaded');
    console.log('  📊 Stats Screen');
    console.log('  ✏️ Farm Naming');
    console.log('  🔄 Game Reset');
    console.log('  💡 Tooltips');
    console.log('');
    console.log('✅ Modularization progress: 43 modules active!');
    console.log('📝 Remaining in index.html: Firebase init, account functions, music, utilities');
    */
}

// Save on page close/exit (Reliable for Desktop)
window.addEventListener('beforeunload', () => {
    console.log('💾 Saving before page unload...');
    if (!window.isResetting) save();
});

// Save on visibility change (Reliable for Mobile/Tab Switch)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !window.isResetting) {
        console.log('💾 Saving on visibility hide...');
        save();
    }
});

// MOBILE FIX: Dispatch event to signal modules are ready
// This allows index.html to wait for all exports before calling init()
window.dispatchEvent(new Event('modulesReady'));
console.log('📡 modulesReady event dispatched - all window exports complete');

// LOGIN SCREEN: Check if should show login screen
// Only auto-init if user is logged in or in guest mode
if (shouldShowLoginScreen()) {
    console.log('🔐 Showing login screen...');
    showLoginScreen();
} else {
    console.log('✅ User already logged in or in guest mode, auto-initializing...');
    // User is logged in or chose guest - proceed with init
    // Init will be called from index.html's modulesReady handler
}

// NOTE: The game init() function and remaining game logic is still in index.html
// This will be extracted in future phases
