// Home Pet API-Integrated Frontend
(() => {
    const root = document.getElementById('home-pet-beaver');
    const room = root.querySelector('.room');
    const choreList = root.querySelector('.quest-list');
    const unlock = root.querySelector('.unlock');
    const status = root.querySelector('.status');
    const choreIcons = { trash: '🗑', dishes: '🍽', vacuum: '🧹' };
    let timer;

    // Send API requests through one helper.
    async function apiRequest(path, method = 'GET') {
        const response = await fetch(path, { method });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
    }

    // Render the UI from the backend snapshot.
    function render(snapshot) {
        const points = snapshot.points;
        const completedChoreIds = snapshot.completedChoreIds || [];
        const chores = snapshot.chores || [];
        const isRugUnlocked = (snapshot.unlockedItemIds || []).includes('rug');

        // 1. Update the shared point total.
        root.querySelector('.hp-score').textContent = points;

        // 2. Render chores provided by the backend.
        choreList.replaceChildren(...chores.map(createChoreRow));

        // 3. Update the rug unlock button.
        unlock.disabled = isRugUnlocked || points < 50;
        unlock.textContent = isRugUnlocked
            ? '✓ Rug unlocked'
            : points >= 50
                ? 'Unlock rug · 50 pts'
                : `${50 - points} more pts to unlock`;

        // 4. Update the rug's appearance in the room.
        root.querySelector('.rug').classList.toggle('unlocked', isRugUnlocked);

        // 5. Update the completed quest count.
        const activeChores = chores.filter(chore => chore.enabled);
        const completedCount = activeChores.filter(chore => chore.completedToday).length;
        root.querySelector('.task-count').textContent = `${completedCount} of ${activeChores.length} quests completed`;
    }

    function createChoreRow(chore) {
        const row = document.createElement('div');
        row.className = 'quest';

        const icon = document.createElement('div');
        icon.className = 'quest-icon';
        const iconText = document.createElement('span');
        iconText.setAttribute('aria-hidden', 'true');
        iconText.textContent = choreIcons[chore.choreId] || '✦';
        icon.append(iconText);

        const copy = document.createElement('div');
        copy.className = 'quest-copy';
        const title = document.createElement('h3');
        title.textContent = chore.title;
        const reward = document.createElement('p');
        reward.textContent = chore.enabled
            ? `+${chore.rewardPoints} shared points`
            : 'Not active in this room';
        copy.append(title, reward);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chore cursor-interaction';
        button.disabled = !chore.canComplete;
        button.textContent = chore.completedToday ? '✓ Done' : chore.enabled ? 'Done' : 'Unavailable';
        button.setAttribute('aria-label', `Complete: ${chore.title}`);
        button.addEventListener('click', () => completeChore(chore, button));

        row.append(icon, copy, button);
        return row;
    }

    async function completeChore(chore, button) {
        button.disabled = true;
        try {
            const snapshot = await apiRequest(`/api/rooms/demo/chores/${encodeURIComponent(chore.choreId)}/complete`, 'POST');
            render(snapshot);
            status.textContent = `${chore.title} completed! +${chore.rewardPoints} points for our home.`;
            celebrate();
        } catch (err) {
            console.error('Complete chore failed:', err);
            status.textContent = 'Failed to complete chore. Please retry.';
            button.disabled = false;
        }
    }

    // Play the celebration animation.
    function celebrate() {
        clearTimeout(timer);
        room.classList.remove('happy');
        void room.offsetWidth;
        room.classList.add('happy');
        room.setAttribute('aria-label', 'Mochi celebrates your contribution to the shared home');
        room.querySelector('.confetti')?.remove();

        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 22; i++) {
            const bit = document.createElement('i');
            bit.style.left = `${(i * 37) % 100}%`;
            bit.style.background = ['#d88775', '#e4c573', '#89a389'][i % 3];
            bit.style.animationDelay = `${(i % 5) * 0.06}s`;
            confetti.append(bit);
        }
        room.append(confetti);

        timer = setTimeout(() => {
            room.classList.remove('happy');
            confetti.remove();
            room.setAttribute('aria-label', 'Mochi is resting comfortably in your shared room');
        }, 1900);
    }

    // 1. Load the initial room state.
    async function loadInitialState() {
        try {
            const snapshot = await apiRequest('/api/rooms/demo', 'GET');
            render(snapshot);
        } catch (err) {
            console.error('Failed to load room state:', err);
            status.textContent = 'Error loading room data from server.';
        }
    }

    // 3. Handle rug unlocking.
    unlock.addEventListener('click', async () => {
        unlock.disabled = true; 
        try {
            const snapshot = await apiRequest('/api/rooms/demo/items/rug/unlock', 'POST');
            render(snapshot);
            status.textContent = 'A cozy rug for everyone! 50 points spent.';
            celebrate();
        } catch (err) {
            console.error('Unlock rug failed:', err);
            status.textContent = 'Failed to unlock rug. Check if you have enough points.';
            unlock.disabled = false;
        }
    });

    // 4. Reset the demo room.
    root.querySelector('.reset')?.addEventListener('click', async () => {
        try {
            const snapshot = await apiRequest('/api/rooms/demo/reset', 'POST');
            clearTimeout(timer);
            room.classList.remove('happy');
            room.querySelector('.confetti')?.remove();
            status.textContent = 'A little teamwork makes Mochi’s day.';
            render(snapshot);
        } catch (err) {
            console.error('Reset failed:', err);
        }
    });

    // Load the initial state.
    loadInitialState();
    // Open an SSE connection to receive real-time updates.
    function setupRealtimeSubscription() {
        const eventSource = new EventSource('/api/rooms/demo/subscribe');

        // Listen for the 'room-update' event sent by the backend.
        eventSource.addEventListener('room-update', (event) => {
            const snapshot = JSON.parse(event.data);
            console.log('Received real-time room update:', snapshot);

            // Render the updated state and play the celebration animation.
            render(snapshot);
            celebrate();
        });

        eventSource.onerror = (err) => {
            console.warn('SSE 連線中斷，嘗試自動重連...', err);
        };
    }

// Start the SSE subscription.
    setupRealtimeSubscription();
})();