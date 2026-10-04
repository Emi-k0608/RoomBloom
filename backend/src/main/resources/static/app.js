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
    const RUG_COST = 30;
    const BIG_BEAVER_COST = 50;
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
            button.textContent = completed ? 'Done' : chore.enabled ? 'Done' : 'Unavailable';
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

        // Colorful Rug
        const isRugUnlocked = unlockedItemIds.has('rug');

        renderReward(
            rugReward,
            isRugUnlocked,
            RUG_COST,
            points,
            'Colorful Rug'
        );
        root.querySelector('.rug')
            .classList.toggle('unlocked', isRugUnlocked);

        // Big Beaver
        const isBigBeaverUnlocked =
            unlockedItemIds.has('big-beaver');

        renderReward(
            growReward,
            isBigBeaverUnlocked,
            BIG_BEAVER_COST,
            points,
            'Big Beaver'
        );

        // Big Beaver
        if (isBigBeaverUnlocked) {
            setPose('big');
        }

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
            setPose(getRestingPose());
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
            // sound
            playSound(greatJobSound);
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
            const snapshot = await apiRequest('/api/rooms/demo/rewards/rug/unlock', 'POST');
            render(snapshot);
            status.textContent = `A cozy rug for everyone! ${RUG_COST} points spent.`;
            celebrate('celebrate');
            // sound
            playSound(newRewardSound);
        } catch (error) {
            console.error('Unlock rug failed:', error);
            status.textContent = 'Failed to unlock rug. Check if you have enough points.';
            if (currentSnapshot) {
                render(currentSnapshot);
            }
        }
    });

    growReward.addEventListener('click', async () => {
        growReward.disabled = true;

        try {
            const snapshot = await apiRequest(
                '/api/rooms/demo/rewards/big-beaver/unlock',
                'POST'
            );

            render(snapshot);

            status.textContent =
                `Mochi grew bigger! ${BIG_BEAVER_COST} points spent.`;

            celebrate('big');
            // sound
            playSound(newRewardSound);
        } catch (error) {
            console.error('Unlock Big Beaver failed:', error);

            status.textContent =
                'Failed to unlock Big Beaver. Check if you have enough points.';

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

    function getRestingPose() {
        const unlockedItemIds =
            currentSnapshot?.unlockedItemIds || [];

        return unlockedItemIds.includes('big-beaver')
            ? 'big'
            : 'default';
    }

    const greatJobSound = new Audio('/sounds/great-job.mp3');
    const newRewardSound = new Audio('/sounds/new-reward.mp3');

    function playSound(sound) {
        sound.currentTime = 0;

        sound.play().catch(error => {
            console.error('Sound playback failed:', error);
        });
    }

    loadInitialState();
    // Keep chore poses and room cleanup in sync with Java snapshots.
    let lastCompletedChorePose;
    const originalRender = render;
    getRestingPose = function () {
        if ((currentSnapshot?.unlockedItemIds || []).includes('big-beaver')) return 'big';
        return lastCompletedChorePose || 'default';
    };
    render = function (snapshot) {
        const completed = snapshot.completedChoreIds || [];
        const previous = currentSnapshot?.completedChoreIds || [];
        const latest = completed.filter(id => !previous.includes(id)).pop();
        if (!completed.length) lastCompletedChorePose = undefined;
        else if (latest) lastCompletedChorePose = chorePoses[latest] || 'love';
        else if (!lastCompletedChorePose) lastCompletedChorePose = chorePoses[completed[completed.length - 1]] || 'love';
        const reset = currentSnapshot && completed.length === 0 && (snapshot.unlockedItemIds || []).length === 0 && snapshot.points === 0;
        if (reset) {
            clearTimeout(timer);
            room.classList.remove('happy');
            room.querySelector('.confetti')?.remove();
        }
        originalRender(snapshot);
        room.querySelectorAll('[data-cleanup]').forEach(layer => {
            const id = choreIdsByIndex[Number(layer.dataset.cleanup)] || layer.dataset.cleanup;
            layer.classList.toggle('cleaned', completed.includes(id));
        });
        room.classList.toggle('vacuumed', completed.includes('vacuum'));
        room.classList.toggle('all-clean', choreIdsByIndex.every(id => completed.includes(id)));
        room.classList.toggle('grown', (snapshot.unlockedItemIds || []).includes('big-beaver'));
        if (!room.classList.contains('happy')) setPose(getRestingPose());
    };
})();
