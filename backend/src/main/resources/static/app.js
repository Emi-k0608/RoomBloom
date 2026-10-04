// RoomBloom frontend connected to the demo room API.
(() => {
    const root = document.getElementById('home-pet-beaver');
    const room = root.querySelector('.room');
    const status = root.querySelector('.status');
    const choreButtons = [...root.querySelectorAll('[data-chore]')];
    const rugReward = root.querySelector('.unlock');
    const growReward = root.querySelector('.grow');
    const choreIdsByIndex = ['trash', 'dishes', 'vacuum'];
    const chorePoses = {
        trash: 'normal',
        dishes: 'sparkle',
        vacuum: 'love'
    };
    const poseFiles = {
        default: 'default.png',
        relaxed: 'hi.png',
        normal: 'usual.png',
        love: 'heart.png',
        sparkle: 'bright.png',
        celebrate: 'raise hand.png',
        big: 'level up.png'
    };
    const poseBounds = {
        default: [1024, 1024, 86, 147, 994, 893],
        relaxed: [800, 800, 109, 150, 730, 661],
        normal: [800, 800, 108, 149, 730, 663],
        love: [800, 800, 109, 150, 730, 661],
        sparkle: [800, 800, 110, 151, 729, 660],
        celebrate: [800, 800, 96, 150, 729, 661],
        big: [943, 981, 47, 75, 916, 858]
    };
    // Mirrors the current backend cost; the snapshot does not expose reward prices yet.
    const RUG_COST = 50;
    let timer;
    let currentSnapshot;
    let lastEventVersion;

    async function apiRequest(path, method = 'GET') {
        const response = await fetch(path, { method });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
    }

    function setPose(pose) {
        const image = root.querySelector('.beaver-illustration');
        const [width, height, left, top, right, bottom] = poseBounds[pose];
        const [defaultWidth, defaultHeight, defaultLeft, defaultTop, defaultRight, defaultBottom] = poseBounds.default;
        const factor = ((defaultBottom - defaultTop) / defaultHeight) / (bottom - top);
        const center = (defaultLeft + defaultRight) / 2 / defaultWidth;

        image.style.width = `${width * factor * 100}%`;
        image.style.height = `${height * factor * 100}%`;
        image.style.left = `${(center - (left + right) / 2 * factor) * 100}%`;
        image.style.top = `${(defaultBottom / defaultHeight - bottom * factor) * 100}%`;
        image.src = `assets/${poseFiles[pose]}`;
    }

    function renderReward(card, applied, cost, points, name) {
        const ready = !applied && points >= cost;
        card.disabled = !ready;
        card.classList.toggle('is-locked', !applied && !ready);
        card.classList.toggle('is-ready', ready);
        card.classList.toggle('is-applied', applied);
        card.querySelector('.reward-lock').src = ready ? 'assets/lock-open.svg' : 'assets/lock.svg';
        card.querySelector('.reward-state').textContent = applied ? 'Applied' : ready ? 'Unlocked' : 'Locked';
        card.querySelector('.reward-price').textContent = `${cost} pts`;
        card.querySelector('.reward-action').textContent = applied
            ? ''
            : ready
                ? 'Apply to Mochi →'
                : `${cost - points} pts to unlock`;
        card.setAttribute(
            'aria-label',
            `${name}: ${applied ? 'Applied' : ready ? 'Unlocked. Apply to Mochi' : `Locked. ${cost - points} more points needed`}`
        );
    }

    function render(snapshot) {
        currentSnapshot = snapshot;
        const points = snapshot.points;
        const chores = snapshot.chores || [];
        const choresById = new Map(chores.map(chore => [chore.choreId, chore]));
        const completedChoreIds = new Set(snapshot.completedChoreIds || []);
        const unlockedItemIds = new Set(snapshot.unlockedItemIds || []);

        root.querySelector('.hp-score').textContent = points;

        choreButtons.forEach(button => {
            const choreId = choreIdsByIndex[Number(button.dataset.chore)];
            const chore = choresById.get(choreId);
            const row = button.closest('.quest');

            if (!chore) {
                button.disabled = true;
                row.classList.remove('is-completed');
                return;
            }

            const completed = chore.completedToday || completedChoreIds.has(choreId);
            button.disabled = !chore.canComplete;
            button.textContent = completed ? '✓ Done' : chore.enabled ? 'Done' : 'Unavailable';
            button.setAttribute('aria-label', `${completed ? 'Completed' : 'Complete'}: ${chore.title}`);
            row.classList.toggle('is-completed', completed);
            row.querySelector('.quest-copy p').textContent = chore.enabled
                ? `+${chore.rewardPoints} shared points`
                : 'Not active in this room';
        });

        const activeChores = chores.filter(chore => chore.enabled);
        const isChoreCompleted = chore =>
            chore.completedToday || completedChoreIds.has(chore.choreId);
        const completedCount = activeChores.filter(isChoreCompleted).length;

        renderReward(rugReward, unlockedItemIds.has('rug'), RUG_COST, points, 'Colorful Rug');
        root.querySelector('.rug').classList.toggle('unlocked', unlockedItemIds.has('rug'));

        // Growth is visual-only in the prototype; leave it unavailable until the backend supports it.
        growReward.disabled = true;
        growReward.classList.add('is-locked');
        growReward.classList.remove('is-ready', 'is-applied');
        growReward.querySelector('.reward-lock').src = 'assets/lock.svg';
        growReward.querySelector('.reward-state').textContent = 'Coming soon';
        growReward.querySelector('.reward-action').textContent = 'Not available yet';
        growReward.setAttribute('aria-label', 'Big Beaver: Not available yet');

        const taskCount = root.querySelector('.task-count');
        if (taskCount) {
            taskCount.textContent = `${completedCount} of ${activeChores.length} quests completed`;
        }
    }

    function celebrate(pose = 'love') {
        clearTimeout(timer);
        setPose(pose);
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
            setPose('default');
            room.setAttribute('aria-label', 'Mochi is resting comfortably in your shared room');
        }, 1900);
    }

    async function completeChore(choreId, button) {
        button.disabled = true;
        try {
            const snapshot = await apiRequest(
                `/api/rooms/demo/chores/${encodeURIComponent(choreId)}/complete`,
                'POST'
            );
            render(snapshot);
            const chore = snapshot.chores.find(candidate => candidate.choreId === choreId);
            status.textContent = chore
                ? `${chore.title} completed! +${chore.rewardPoints} points for our home.`
                : 'Chore state updated.';
            celebrate(chorePoses[choreId] || 'love');
        } catch (error) {
            console.error('Complete chore failed:', error);
            status.textContent = 'Failed to complete chore. Please retry.';
            if (currentSnapshot) {
                render(currentSnapshot);
            } else {
                button.disabled = false;
            }
        }
    }

    choreButtons.forEach(button => {
        const choreId = choreIdsByIndex[Number(button.dataset.chore)];
        if (choreId) {
            button.addEventListener('click', () => completeChore(choreId, button));
        }
    });

    rugReward.addEventListener('click', async () => {
        rugReward.disabled = true;
        try {
            const snapshot = await apiRequest('/api/rooms/demo/items/rug/unlock', 'POST');
            render(snapshot);
            status.textContent = `A cozy rug for everyone! ${RUG_COST} points spent.`;
            celebrate('celebrate');
        } catch (error) {
            console.error('Unlock rug failed:', error);
            status.textContent = 'Failed to unlock rug. Check if you have enough points.';
            if (currentSnapshot) {
                render(currentSnapshot);
            }
        }
    });

    const resetButton = root.querySelector('.reset');
    if (resetButton) {
        resetButton.addEventListener('click', async () => {
            try {
                const snapshot = await apiRequest('/api/rooms/demo/reset', 'POST');
                clearTimeout(timer);
                room.classList.remove('happy');
                room.querySelector('.confetti')?.remove();
                setPose('default');
                status.textContent = 'A little teamwork makes Mochi’s day.';
                render(snapshot);
            } catch (error) {
                console.error('Reset failed:', error);
                status.textContent = 'Failed to reset the demo room. Please retry.';
            }
        });
    }

    async function loadInitialState() {
        try {
            const snapshot = await apiRequest('/api/rooms/demo', 'GET');
            render(snapshot);
        } catch (error) {
            console.error('Failed to load room state:', error);
            status.textContent = 'Error loading room data from server.';
        }
    }

    const eventSource = new EventSource('/api/rooms/demo/subscribe');
    eventSource.addEventListener('room-update', event => {
        try {
            const snapshot = JSON.parse(event.data);
            const shouldCelebrate = lastEventVersion !== undefined &&
                lastEventVersion !== snapshot.version &&
                currentSnapshot?.version !== snapshot.version;
            lastEventVersion = snapshot.version;
            render(snapshot);
            if (shouldCelebrate) {
                celebrate();
            }
        } catch (error) {
            console.error('Failed to process room update:', error);
            status.textContent = 'Could not process a room update.';
        }
    });

    eventSource.onerror = error => {
        console.warn('SSE connection interrupted; the browser will retry automatically.', error);
    };

    loadInitialState();
})();
