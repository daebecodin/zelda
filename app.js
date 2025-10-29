/**
 * Zelda JS Game - A Legend of Zelda-inspired dungeon crawler
 */
document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const GAME_CONFIG = {
        GRID_WIDTH: 10,
        GRID_HEIGHT: 9,
        TILE_SIZE: 48,
        ENEMY_SPEEDS: { SLICER: 2, SKELETOR: 1.5 },
        INITIAL_PLAYER_POSITION: 40,
        HEALTH: {
            MAX: 3,
            INVULNERABILITY_TIME: 1000, // 1 second
            REGEN_DELAY: 5000, // 5 seconds
            DAMAGE_PER_LEVEL: 1 // base damage, increases with level
        }
    };

    const WALL_CLASSES = [
        'left-wall', 'right-wall', 'top-wall', 'bottom-wall',
        'top-left-wall', 'top-right-wall', 'bottom-left-wall', 'bottom-right-wall',
        'lanterns', 'fire-pot'
    ];

    const MAP_ELEMENTS = {
        'a': 'left-wall', 'b': 'right-wall', 'c': 'top-wall', 'd': 'bottom-wall',
        'w': 'top-right-wall', 'x': 'bottom-left-wall', 'y': 'top-left-wall', 'z': 'bottom-right-wall',
        '%': 'left-door', '^': 'top-door', '$': 'stairs', ')': 'lanterns', '(': 'fire-pot'
    };

    // DOM Elements
    const elements = {
        grid: document.getElementById('grid'),
        scoreDisplay: document.getElementById('score'),
        levelDisplay: document.getElementById('level'),
        enemyDisplay: document.getElementById('enemies')
    };

    // Game State
    const gameState = {
        squares: [],
        score: 0,
        level: 0,
        playerPosition: GAME_CONFIG.INITIAL_PLAYER_POSITION,
        enemies: [],
        playerDirection: 'right',
        gameRunning: true,
        lastTime: 0,
        animationId: null,
        controlScheme: 'arrows', // 'arrows' or 'wasd'
        health: 3,
        maxHealth: 3,
        lastDamageTime: 0,
        invulnerable: false,
        lastRegenTime: 0,
        completedLevels: new Set(), // Track completed levels
        allLevelsCompleted: false,
        enemySpeedMultiplier: 1 // 0.5 = slow, 1 = normal, 1.5 = fast
    };

    const maps = [
        // Level 1 - Tutorial (2 slicers)
        [
            'ycc)cc^ccw',
            'a        b',
            'a      * b',
            'a    (   b',
            '%        b',
            'a    (   b',
            'a  *     b',
            'a        b',
            'xdd)dd)ddz'
        ],
        // Level 2 - Introduction to skeletors (1 skeletor)
        [
            'yccccccccw',
            'a        b',
            ')        )',
            'a        b',
            'a        b',
            'a    $   b',
            ')   }    )',
            'a        b',
            'xddddddddz',
        ],
        // Level 3 - Mixed enemies (2 slicers, 2 skeletors)
        [
            'ycc)cc^ccw',
            'a *      b',
            'a   }    b',
            'a    (   b',
            '%        b',
            'a    (   b',
            'a   }  * b',
            'a        b',
            'xdd)dd)ddz'
        ],
        // Level 4 - Narrow corridors (3 slicers, 1 skeletor) - FIXED
        [
            'yccccccccw',
            'a*      }b',
            'accc     b',
            'a   c    b',
            'a   c   *b',
            'a        b',
            'a *     $b',
            'a        b',
            'xddddddddz'
        ],
        // Level 5 - Enemy maze (2 slicers, 3 skeletors) - FIXED
        [
            'ycc^cccccw',
            'a}  c  * b',
            'a   c    b',
            'a       cb',
            'a}     } b',
            'accc     b',
            'a *    $ b',
            'a        b',
            'xddddddddz'
        ],
        // Level 6 - Crowded room (4 slicers, 2 skeletors)
        [
            'yccccccccw',
            'a* }   *}b',
            ')        )',
            'a  (  (  b',
            'a        b',
            'a  (  (  b',
            ')   *  * )',
            'a        b',
            'xddd^ddddz'
        ],
        // Level 7 - Complex layout (3 slicers, 4 skeletors) - FIXED
        [
            'ycc)cc^ccw',
            'a}*    } b',
            'acc     cb',
            'a }    * b',
            '%   ((   b',
            'a }    } b',
            'acc     cb',
            'a *      b',
            'xdd)dd)ddz'
        ],
        // Level 8 - Final challenge (5 slicers, 3 skeletors) - FIXED
        [
            'yccccccccw',
            'a*} * }*}b',
            'a        b',
            'acc     cb',
            'a *    * b',
            'acc     cb',
            'a        b',
            'a   $    b',
            'xddddddddz'
        ]
    ];

    // Utility Functions
    const utils = {
        /**
         * Checks if a grid position is within valid bounds
         * @param {number} position - Grid position to validate (0-89 for 10x9 grid)
         * @returns {boolean} True if position is within grid boundaries
         */
        isValidPosition(position) {
            return position >= 0 && position < gameState.squares.length;
        },

        /**
         * Converts x,y coordinates to single grid position index
         * @param {number} x - X coordinate (0-9)
         * @param {number} y - Y coordinate (0-8)
         * @returns {number} Grid position index (y * width + x)
         */
        getPositionFromCoords(x, y) {
            return y * GAME_CONFIG.GRID_WIDTH + x;
        },

        /**
         * Converts single grid position index to x,y coordinates
         * @param {number} position - Grid position index (0-89)
         * @returns {{x: number, y: number}} Object containing x and y coordinates
         */
        getCoordsFromPosition(position) {
            return {
                x: position % GAME_CONFIG.GRID_WIDTH,
                y: Math.floor(position / GAME_CONFIG.GRID_WIDTH)
            };
        },

        /**
         * Checks if a DOM square element has any wall-blocking CSS classes
         * @param {HTMLElement} square - DOM element to check for wall classes
         * @returns {boolean} True if square contains any wall or obstacle class
         */
        hasWallClass(square) {
            return WALL_CLASSES.some(className => square.classList.contains(className));
        }
    };

    /**
     * Initializes and creates the complete game board for the current level
     * Resets game state, clears existing elements, builds grid from map data
     */
    function createBoard() {
        gameState.gameRunning = true;
        elements.grid.innerHTML = '';
        gameState.squares.length = 0;
        gameState.enemies = [];
        
        const currentMap = maps[gameState.level];
        for (let i = 0; i < GAME_CONFIG.GRID_HEIGHT; i++) {
            for (let j = 0; j < GAME_CONFIG.GRID_WIDTH; j++) {
                const square = document.createElement('div');
                square.setAttribute('id', i * GAME_CONFIG.GRID_WIDTH + j);
                addMapElement(square, currentMap[i][j], j, i);
                elements.grid.appendChild(square);
                gameState.squares.push(square);
            }
        }
        createPlayer();
        updateDisplays();
    }

    /**
     * Adds appropriate CSS classes or creates game entities based on map character
     * @param {HTMLElement} square - DOM element to modify with classes
     * @param {string} char - Single character from map array representing tile type
     * @param {number} x - X coordinate for enemy placement
     * @param {number} y - Y coordinate for enemy placement
     */
    function addMapElement(square, char, x, y) {
        if (MAP_ELEMENTS[char]) {
            square.classList.add(MAP_ELEMENTS[char]);
        } else if (char === '*') {
            createSlicer(x, y);
        } else if (char === '}') {
            createSkeletor(x, y);
        }
    }

    /**
     * Creates the player (Link) DOM element and positions it on the grid
     * Sets initial sprite direction and adds to game grid
     */
    function createPlayer() {
        const playerElement = document.createElement('div');
        playerElement.classList.add('link-going-right');
        playerElement.id = 'player';
        updatePlayerPosition(playerElement);
        elements.grid.appendChild(playerElement);
    }

    /**
     * Updates the visual position of the player element on screen
     * @param {HTMLElement} playerElement - The player DOM element to position
     */
    function updatePlayerPosition(playerElement) {
        const coords = utils.getCoordsFromPosition(gameState.playerPosition);
        playerElement.style.left = `${coords.x * GAME_CONFIG.TILE_SIZE}px`;
        playerElement.style.top = `${coords.y * GAME_CONFIG.TILE_SIZE}px`;
    }

    /**
     * Creates a slicer enemy at specified grid coordinates
     * Slicers move horizontally and bounce off walls
     * @param {number} x - X coordinate (0-9) for enemy placement
     * @param {number} y - Y coordinate (0-8) for enemy placement
     */
    function createSlicer(x, y) {
        const slicerElement = document.createElement('div');
        slicerElement.classList.add('slicer');
        slicerElement.style.left = `${x * GAME_CONFIG.TILE_SIZE}px`;
        slicerElement.style.top = `${y * GAME_CONFIG.TILE_SIZE}px`;

        const slicer = { x, y, direction: -1, type: 'slicer', element: slicerElement };
        gameState.enemies.push(slicer);
        elements.grid.appendChild(slicerElement);
    }

    /**
     * Creates a skeletor enemy at specified grid coordinates
     * Skeletors move vertically with random direction changes
     * @param {number} x - X coordinate (0-9) for enemy placement
     * @param {number} y - Y coordinate (0-8) for enemy placement
     */
    function createSkeletor(x, y) {
        const skeletorElement = document.createElement('div');
        skeletorElement.classList.add('skeletor');
        skeletorElement.style.left = `${x * GAME_CONFIG.TILE_SIZE}px`;
        skeletorElement.style.top = `${y * GAME_CONFIG.TILE_SIZE}px`;

        const skeletor = { x, y, direction: -1, timer: Math.random() * 5, type: 'skeletor', element: skeletorElement };
        gameState.enemies.push(skeletor);
        elements.grid.appendChild(skeletorElement);
    }

    /**
     * Handles player movement in the specified direction
     * Updates sprite direction and moves if path is clear
     * @param {string} direction - Movement direction: 'left', 'right', 'up', or 'down'
     */
    function movePlayer(direction) {
        const playerElement = document.getElementById('player');
        const newPosition = calculateNewPosition(direction);
        
        updatePlayerDirection(playerElement, direction);
        
        if (canMoveTo(newPosition)) {
            handlePlayerMovement(newPosition);
        }
    }

    /**
     * Calculates the new grid position based on current position and direction
     * Prevents movement outside grid boundaries
     * @param {string} direction - Movement direction: 'left', 'right', 'up', or 'down'
     * @returns {number} New grid position or current position if move is invalid
     */
    function calculateNewPosition(direction) {
        const movements = {
            left: gameState.playerPosition % GAME_CONFIG.GRID_WIDTH !== 0 ? -1 : 0,
            right: gameState.playerPosition % GAME_CONFIG.GRID_WIDTH !== GAME_CONFIG.GRID_WIDTH - 1 ? 1 : 0,
            up: gameState.playerPosition - GAME_CONFIG.GRID_WIDTH >= 0 ? -GAME_CONFIG.GRID_WIDTH : 0,
            down: gameState.playerPosition + GAME_CONFIG.GRID_WIDTH < GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT ? GAME_CONFIG.GRID_WIDTH : 0
        };
        
        return gameState.playerPosition + (movements[direction] || 0);
    }

    /**
     * Updates the player sprite's CSS class to match movement direction
     * @param {HTMLElement} playerElement - The player DOM element
     * @param {string} direction - New facing direction for sprite animation
     */
    function updatePlayerDirection(playerElement, direction) {
        const directionClasses = {
            left: 'link-going-left', right: 'link-going-right', 
            up: 'link-going-up', down: 'link-going-down'
        };
        
        playerElement.className = directionClasses[direction];
        gameState.playerDirection = direction;
    }

    /**
     * Processes player movement to a new valid position
     * Handles door interactions, level transitions, and collision detection
     * @param {number} newPosition - Target grid position for player movement
     */
    function handlePlayerMovement(newPosition) {
        const square = gameState.squares[newPosition];
        
        if (square.classList.contains('left-door')) {
            square.classList.remove('left-door');
        }
        
        if (square.classList.contains('top-door') || square.classList.contains('stairs')) {
            if (gameState.enemies.length === 0) {
                nextLevel();
            } else {
                showEnemiesRemainingMessage();
            }
            return;
        }
        
        gameState.playerPosition = newPosition;
        updatePlayerPosition(document.getElementById('player'));
        checkPlayerEnemyCollision();
    }

    /**
     * Checks if the player can move to the specified grid position
     * Validates position bounds and checks for wall/obstacle collisions
     * @param {number} position - Target grid position to validate
     * @returns {boolean} True if position is walkable, false if blocked
     */
    function canMoveTo(position) {
        if (!utils.isValidPosition(position)) return false;
        return !utils.hasWallClass(gameState.squares[position]);
    }

    function checkPlayerEnemyCollision() {
        const playerCoords = utils.getCoordsFromPosition(gameState.playerPosition);
        
        for (const enemy of gameState.enemies) {
            if (Math.round(enemy.x) === playerCoords.x && Math.round(enemy.y) === playerCoords.y) {
                damagePlayer(performance.now());
                return;
            }
        }
    }

    function spawnKaboom() {
        const coords = utils.getCoordsFromPosition(gameState.playerPosition);
        const kaboomCoords = calculateKaboomPosition(coords);
        
        if (isValidKaboomPosition(kaboomCoords)) {
            createKaboomEffect(kaboomCoords);
        }
    }

    function calculateKaboomPosition(playerCoords) {
        const directions = {
            left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
            up: { x: 0, y: -1 }, down: { x: 0, y: 1 }
        };
        
        const offset = directions[gameState.playerDirection];
        return { x: playerCoords.x + offset.x, y: playerCoords.y + offset.y };
    }

    function isValidKaboomPosition(coords) {
        return coords.x >= 0 && coords.x < GAME_CONFIG.GRID_WIDTH && 
               coords.y >= 0 && coords.y < GAME_CONFIG.GRID_HEIGHT;
    }

    function createKaboomEffect(coords) {
        const kaboomElement = document.createElement('div');
        kaboomElement.className = 'kaboom';
        kaboomElement.style.left = `${coords.x * GAME_CONFIG.TILE_SIZE}px`;
        kaboomElement.style.top = `${coords.y * GAME_CONFIG.TILE_SIZE}px`;
        
        elements.grid.appendChild(kaboomElement);
        checkKaboomEnemyCollision(coords.x, coords.y);
        
        setTimeout(() => kaboomElement.remove(), 1000);
    }

    function checkKaboomEnemyCollision(kaboomX, kaboomY) {
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            
            if (Math.round(enemy.x) === kaboomX && Math.round(enemy.y) === kaboomY) {
                enemy.element.remove();
                gameState.enemies.splice(i, 1);
                gameState.score++;
                updateDisplays();
                break;
            }
        }
    }

    function updateDisplays() {
        elements.scoreDisplay.innerHTML = gameState.score;
        elements.levelDisplay.innerHTML = gameState.level + 1;
        elements.enemyDisplay.innerHTML = gameState.enemies.length;
        updateHeartsDisplay();
    }

    function showEnemiesRemainingMessage() {
        elements.grid.style.filter = 'hue-rotate(0deg) saturate(2) brightness(1.5)';
        elements.grid.style.boxShadow = '0 0 20px red';

        setTimeout(() => {
            elements.grid.style.filter = '';
            elements.grid.style.boxShadow = '';
        }, 300);

        showTemporaryMessage('Defeat all enemies first!', 'red', 2000);
    }

    function showTemporaryMessage(message, color, duration) {
        document.getElementById('temp-message')?.remove();

        const messageElement = document.createElement('div');
        messageElement.id = 'temp-message';
        messageElement.textContent = message;
        messageElement.style.color = color;
        
        elements.grid.appendChild(messageElement);
        setTimeout(() => messageElement.remove(), duration);
    }

    function nextLevel() {
        // Mark current level as completed
        gameState.completedLevels.add(gameState.level);
        
        // Check if all levels completed
        if (gameState.completedLevels.size === maps.length) {
            gameState.allLevelsCompleted = true;
        }
        
        gameState.level = (gameState.level + 1) % maps.length;
        createBoard();
        updateLevelSelectButton();
    }

    /**
     * Updates the level select button state based on completion
     */
    function updateLevelSelectButton() {
        const btn = document.getElementById('level-select-btn');
        btn.disabled = !gameState.allLevelsCompleted;
    }

    /**
     * Opens the level selection modal
     */
    function openLevelModal() {
        if (!gameState.allLevelsCompleted) return;
        
        generateLevelGrid();
        document.getElementById('level-modal').style.display = 'block';
    }

    /**
     * Closes the level selection modal
     */
    function closeLevelModal() {
        document.getElementById('level-modal').style.display = 'none';
    }

    /**
     * Generates the level selection grid
     */
    function generateLevelGrid() {
        const grid = document.getElementById('level-grid');
        const msg = document.getElementById('level-unlock-msg');
        
        if (!gameState.allLevelsCompleted) {
            grid.style.display = 'none';
            msg.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        msg.style.display = 'none';
        grid.innerHTML = '';
        
        for (let i = 0; i < maps.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = `Level ${i + 1}`;
            
            if (gameState.completedLevels.has(i)) {
                btn.classList.add('completed');
            }
            
            if (i === gameState.level) {
                btn.classList.add('current');
            }
            
            btn.onclick = () => selectLevel(i);
            grid.appendChild(btn);
        }
    }

    /**
     * Selects and loads a specific level
     */
    function selectLevel(levelIndex) {
        gameState.level = levelIndex;
        createBoard();
        closeLevelModal();
    }

    function gameOver() {
        gameState.gameRunning = false;
        showTemporaryMessage(`Game Over! Final Score: ${gameState.score}`, 'white', 3000);
    }

    /**
     * Updates positions of all enemies based on their movement patterns
     * Called each frame to animate enemy movement with delta time
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    function moveEnemies(deltaTime) {
        gameState.enemies.forEach(enemy => {
            if (enemy.type === 'slicer') {
                moveSlicer(enemy, deltaTime);
            } else if (enemy.type === 'skeletor') {
                moveSkeletor(enemy, deltaTime);
            }
        });
    }

    /**
     * Moves a slicer enemy horizontally with wall collision detection
     * Slicers bounce off walls and grid boundaries
     * @param {Object} slicer - Slicer enemy object with position and direction
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    function moveSlicer(slicer, deltaTime) {
        const speed = GAME_CONFIG.ENEMY_SPEEDS.SLICER * deltaTime * gameState.enemySpeedMultiplier;
        const newX = slicer.x + (slicer.direction * speed);
        const y = Math.round(slicer.y);

        if (newX < 0 || newX >= GAME_CONFIG.GRID_WIDTH || isWall(Math.round(newX), y)) {
            slicer.direction *= -1;
        } else {
            slicer.x = newX;
        }
        
        slicer.element.style.left = `${slicer.x * GAME_CONFIG.TILE_SIZE}px`;
    }

    /**
     * Moves a skeletor enemy vertically with random direction changes
     * Skeletors change direction randomly and bounce off walls
     * @param {Object} skeletor - Skeletor enemy object with position, direction, and timer
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    function moveSkeletor(skeletor, deltaTime) {
        const speed = GAME_CONFIG.ENEMY_SPEEDS.SKELETOR * deltaTime * gameState.enemySpeedMultiplier;
        skeletor.timer -= deltaTime;
        
        if (skeletor.timer <= 0) {
            skeletor.direction *= -1;
            skeletor.timer = Math.random() * 5;
        }

        const newY = skeletor.y + (skeletor.direction * speed);
        const x = Math.round(skeletor.x);

        if (newY < 0 || newY >= GAME_CONFIG.GRID_HEIGHT || isWall(x, Math.round(newY))) {
            skeletor.direction *= -1;
        } else {
            skeletor.y = newY;
        }
        
        skeletor.element.style.top = `${skeletor.y * GAME_CONFIG.TILE_SIZE}px`;
    }

    /**
     * Checks if specified coordinates contain a wall or obstacle
     * @param {number} x - X coordinate to check (0-9)
     * @param {number} y - Y coordinate to check (0-8)
     * @returns {boolean} True if position contains wall or obstacle
     */
    function isWall(x, y) {
        const position = utils.getPositionFromCoords(x, y);
        if (!utils.isValidPosition(position)) return true;
        return utils.hasWallClass(gameState.squares[position]);
    }

    /**
     * Main game loop function called by requestAnimationFrame
     * Handles enemy movement and collision detection each frame
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    function gameLoop(currentTime) {
        const deltaTime = (currentTime - gameState.lastTime) / 1000;
        gameState.lastTime = currentTime;
        
        if (gameState.gameRunning && deltaTime < 0.1) {
            moveEnemies(deltaTime);
            checkPlayerEnemyCollision();
            handleHealthRegen(currentTime);
        }
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    function restartGame() {
        gameState.score = 0;
        gameState.level = 0;
        gameState.playerPosition = GAME_CONFIG.INITIAL_PLAYER_POSITION;
        gameState.health = GAME_CONFIG.HEALTH.MAX;
        gameState.lastDamageTime = 0;
        gameState.invulnerable = false;
        gameState.lastRegenTime = 0;
        // Don't reset completed levels - keep progress
        createBoard();
        updateLevelSelectButton();
    }

    /**
     * Creates and updates the hearts display in the UI
     * Shows current health as filled/empty hearts
     */
    function updateHeartsDisplay() {
        const heartsContainer = document.getElementById('hearts-display');
        heartsContainer.innerHTML = '';
        
        for (let i = 0; i < GAME_CONFIG.HEALTH.MAX; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            
            if (i >= gameState.health) {
                heart.classList.add('empty');
            }
            
            heartsContainer.appendChild(heart);
        }
    }

    /**
     * Damages the player and handles invulnerability frames
     * @param {number} currentTime - Current timestamp for timing calculations
     */
    function damagePlayer(currentTime) {
        if (gameState.invulnerable) return;
        
        const damage = GAME_CONFIG.HEALTH.DAMAGE_PER_LEVEL + Math.floor(gameState.level / 2);
        gameState.health = Math.max(0, gameState.health - damage);
        gameState.lastDamageTime = currentTime;
        gameState.invulnerable = true;
        gameState.lastRegenTime = currentTime; // Reset regen timer
        
        // Visual feedback
        const player = document.getElementById('player');
        player.style.opacity = '0.5';
        
        setTimeout(() => {
            gameState.invulnerable = false;
            player.style.opacity = '1';
        }, GAME_CONFIG.HEALTH.INVULNERABILITY_TIME);
        
        updateHeartsDisplay();
        
        if (gameState.health <= 0) {
            gameOver();
        }
    }

    /**
     * Handles health regeneration over time
     * @param {number} currentTime - Current timestamp for timing calculations
     */
    function handleHealthRegen(currentTime) {
        if (gameState.health < GAME_CONFIG.HEALTH.MAX && 
            currentTime - gameState.lastDamageTime > GAME_CONFIG.HEALTH.REGEN_DELAY &&
            currentTime - gameState.lastRegenTime > GAME_CONFIG.HEALTH.REGEN_DELAY) {
            
            gameState.health = Math.min(GAME_CONFIG.HEALTH.MAX, gameState.health + 1);
            gameState.lastRegenTime = currentTime;
            updateHeartsDisplay();
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR') {
            e.preventDefault();
            restartGame();
            return;
        }

        if (!gameState.gameRunning) return;

        const isArrowScheme = gameState.controlScheme === 'arrows';
        const isWasdScheme = gameState.controlScheme === 'wasd';

        switch(e.code) {
            case 'ArrowLeft':
                if (isArrowScheme) {
                    e.preventDefault();
                    movePlayer('left');
                }
                break;
            case 'KeyA':
                if (isWasdScheme) {
                    e.preventDefault();
                    movePlayer('left');
                }
                break;
            case 'ArrowRight':
                if (isArrowScheme) {
                    e.preventDefault();
                    movePlayer('right');
                }
                break;
            case 'KeyD':
                if (isWasdScheme) {
                    e.preventDefault();
                    movePlayer('right');
                }
                break;
            case 'ArrowUp':
                if (isArrowScheme) {
                    e.preventDefault();
                    movePlayer('up');
                }
                break;
            case 'KeyW':
                if (isWasdScheme) {
                    e.preventDefault();
                    movePlayer('up');
                }
                break;
            case 'ArrowDown':
                if (isArrowScheme) {
                    e.preventDefault();
                    movePlayer('down');
                }
                break;
            case 'KeyS':
                if (isWasdScheme) {
                    e.preventDefault();
                    movePlayer('down');
                }
                break;
            case 'Space':
                e.preventDefault();
                spawnKaboom();
                break;
        }
    });

    // Modal Functions
    /**
     * Opens the settings modal by making it visible
     * Allows player to change control scheme preferences
     */
    function openSettingsModal() {
        document.getElementById('settings-modal').style.display = 'block';
    }

    /**
     * Closes the settings modal by hiding it
     * Returns player to the game interface
     */
    function closeSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    /**
     * Sets the active control scheme and updates UI accordingly
     * @param {string} scheme - Control scheme: 'arrows' or 'wasd'
     */
    function setControls(scheme) {
        gameState.controlScheme = scheme;
        
        // Update button states
        document.getElementById('arrow-btn').classList.toggle('active', scheme === 'arrows');
        document.getElementById('wasd-btn').classList.toggle('active', scheme === 'wasd');
        
        // Update info text
        const infoText = scheme === 'arrows' 
            ? 'Use arrow keys to move, SPACE to attack, R to restart'
            : 'Use WASD to move, SPACE to attack, R to restart';
        document.getElementById('controls-info').textContent = infoText;
    }

    /**
     * Sets the enemy speed multiplier and updates UI accordingly
     * @param {string} speed - Speed setting: 'slow', 'normal', or 'fast'
     */
    function setEnemySpeed(speed) {
        const speedMap = {
            slow: 0.5,
            normal: 1,
            fast: 1.5
        };
        
        gameState.enemySpeedMultiplier = speedMap[speed];
        
        // Update button states
        document.getElementById('slow-btn').classList.toggle('active', speed === 'slow');
        document.getElementById('normal-btn').classList.toggle('active', speed === 'normal');
        document.getElementById('fast-btn').classList.toggle('active', speed === 'fast');
    }

    // Make functions global for HTML onclick
    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
    window.setControls = setControls;
    window.setEnemySpeed = setEnemySpeed;
    window.openLevelModal = openLevelModal;
    window.closeLevelModal = closeLevelModal;

    // Initialize Game
    createBoard();
    updateLevelSelectButton();
    gameState.animationId = requestAnimationFrame(gameLoop);
});
