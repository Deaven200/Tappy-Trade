// Menu System for Tappy Trade
let menuOpen = false;

function toggleMenu() {
    menuOpen = !menuOpen;
    const menu = document.getElementById('menu-modal');
    const overlay = document.getElementById('menu-overlay');

    if (menuOpen) {
        menu.classList.add('active');
        overlay.classList.add('active');
    } else {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function closeMenu() {
    menuOpen = false;
    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('menu-overlay').classList.remove('active');
}

function showStats() {
    closeMenu();
    screen = 'stats';
    render();
}

function showHelp() {
    closeMenu();
    const helpText = `
        <div class="panel">
            <h3>📖 How to Play Tappy Trade</h3>
            
            <h4>🌾 Harvesting</h4>
            <p>Tap resource nodes (trees, berries, herbs) to collect items. Watch the progress bars refill!</p>
            
            <h4>💰 Selling</h4>
            <p>Go to <strong>Inventory</strong> → Switch to <strong>List View</strong> → Click <strong>Sell</strong> buttons or <strong>Sell All</strong> to earn money from the government at fixed prices.</p>
            
            <h4>🏪 Player Market</h4>
            <p>Trade with other players for better prices! Create buy/sell orders or match existing orders. This is where you make real profits!</p>
            
            <h4>👷 Workers</h4>
            <p>Hire workers to automate resource gathering. They work even when you're offline!</p>
            
            <h4>🏗️ Building</h4>
            <p>Expand your plots with farms, livestock, and manufacturing buildings. Each building produces different resources.</p>
            
            <h4>💬 Chat</h4>
            <p>Talk to other players in global chat. Share tips and make deals!</p>
            
            <h4>☁️ Cloud Save</h4>
            <p>Create an account to save your progress online. Your game syncs automatically!</p>
            
            <p style="margin-top:20px;text-align:center;color:var(--muted)">Have fun farming! 🌾</p>
            
            <button class="btn" onclick="screen='home';render()" style="margin-top:20px;width:100%">Back to Game</button>
        </div>
    `;
    document.getElementById('main').innerHTML = helpText;
}
