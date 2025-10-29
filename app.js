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
        INITIAL_PLAYER_POSITION: 40
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
        animationId: null
    };

    const maps = [
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
        ]
    ];

    // Utility Functions
    const utils = {
        isValidPosition(position) {
            return position >= 0 && position < gameState.squares.length;
        },
        getPositionFromCoords(x, y) {
            return y * GAME_CONFIG.GRID_WIDTH + x;
        },
        getCoordsFromPosition(position) {
            return {
                x: position % GAME_CONFIG.GRID_WIDTH,
                y: Math.floor(position / GAME_CONFIG.GRID_WIDTH)
            };
        },
        hasWallClass(square) {
            return WALL_CLASSES.some(className => square.classList.contains(className));
        }
    };

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

    function addMapElement(square, char, x, y) {
        if (MAP_ELEMENTS[char]) {
            square.classList.add(MAP_ELEMENTS[char]);
        } else if (char === '*') {
            createSlicer(x, y);
        } else if (char === '}') {
            createSkeletor(x, y);
        }
    }

    function createPlayer() {
        const playerElement = document.createElement('div');
        playerElement.classList.add('link-going-right');
        playerElement.id = 'player';
        updatePlayerPosition(playerElement);
        elements.grid.appendChild(playerElement);
    }

    function updatePlayerPosition(playerElement) {
        const coords = utils.getCoordsFromPosition(gameState.playerPosition);
        playerElement.style.left = `${coords.x * GAME_CONFIG.TILE_SIZE}px`;
        playerElement.style.top = `${coords.y * GAME_CONFIG.TILE_SIZE}px`;
    }

    function createSlicer(x, y) {
        const slicerElement = document.createElement('div');
        slicerElement.classList.add('slicer');
        slicerElement.style.left = `${x * GAME_CONFIG.TILE_SIZE}px`;
        slicerElement.style.top = `${y * GAME_CONFIG.TILE_SIZE}px`;

        const slicer = { x, y, direction: -1, type: 'slicer', element: slicerElement };
        gameState.enemies.push(slicer);
        elements.grid.appendChild(slicerElement);
    }

    function createSkeletor(x, y) {
        const skeletorElement = document.createElement('div');
        skeletorElement.classList.add('skeletor');
        skeletorElement.style.left = `${x * GAME_CONFIG.TILE_SIZE}px`;
        skeletorElement.style.top = `${y * GAME_CONFIG.TILE_SIZE}px`;

        const skeletor = { x, y, direction: -1, timer: Math.random() * 5, type: 'skeletor', element: skeletorElement };
        gameState.enemies.push(skeletor);
        elements.grid.appendChild(skeletorElement);
    }

    function movePlayer(direction) {
        const playerElement = document.getElementById('player');
        const newPosition = calculateNewPosition(direction);
        
        updatePlayerDirection(playerElement, direction);
        
        if (canMoveTo(newPosition)) {
            handlePlayerMovement(newPosition);
        }
    }

    function calculateNewPosition(direction) {
        const movements = {
            left: gameState.playerPosition % GAME_CONFIG.GRID_WIDTH !== 0 ? -1 : 0,
            right: gameState.playerPosition % GAME_CONFIG.GRID_WIDTH !== GAME_CONFIG.GRID_WIDTH - 1 ? 1 : 0,
            up: gameState.playerPosition - GAME_CONFIG.GRID_WIDTH >= 0 ? -GAME_CONFIG.GRID_WIDTH : 0,
            down: gameState.playerPosition + GAME_CONFIG.GRID_WIDTH < GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT ? GAME_CONFIG.GRID_WIDTH : 0
        };
        
        return gameState.playerPosition + (movements[direction] || 0);
    }

    function updatePlayerDirection(playerElement, direction) {
        const directionClasses = {
            left: 'link-going-left', right: 'link-going-right', 
            up: 'link-going-up', down: 'link-going-down'
        };
        
        playerElement.className = directionClasses[direction];
        gameState.playerDirection = direction;
    }

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

    function canMoveTo(position) {
        if (!utils.isValidPosition(position)) return false;
        return !utils.hasWallClass(gameState.squares[position]);
    }

    function checkPlayerEnemyCollision() {
        const playerCoords = utils.getCoordsFromPosition(gameState.playerPosition);
        
        for (const enemy of gameState.enemies) {
            if (Math.round(enemy.x) === playerCoords.x && Math.round(enemy.y) === playerCoords.y) {
                gameOver();
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
        gameState.level = (gameState.level + 1) % maps.length;
        createBoard();
    }

    function gameOver() {
        gameState.gameRunning = false;
        showTemporaryMessage(`Game Over! Final Score: ${gameState.score}`, 'white', 3000);
    }

    function moveEnemies(deltaTime) {
        gameState.enemies.forEach(enemy => {
            if (enemy.type === 'slicer') {
                moveSlicer(enemy, deltaTime);
            } else if (enemy.type === 'skeletor') {
                moveSkeletor(enemy, deltaTime);
            }
        });
    }

    function moveSlicer(slicer, deltaTime) {
        const speed = GAME_CONFIG.ENEMY_SPEEDS.SLICER * deltaTime;
        const newX = slicer.x + (slicer.direction * speed);
        const y = Math.round(slicer.y);

        if (newX < 0 || newX >= GAME_CONFIG.GRID_WIDTH || isWall(Math.round(newX), y)) {
            slicer.direction *= -1;
        } else {
            slicer.x = newX;
        }
        
        slicer.element.style.left = `${slicer.x * GAME_CONFIG.TILE_SIZE}px`;
    }

    function moveSkeletor(skeletor, deltaTime) {
        const speed = GAME_CONFIG.ENEMY_SPEEDS.SKELETOR * deltaTime;
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

    function isWall(x, y) {
        const position = utils.getPositionFromCoords(x, y);
        if (!utils.isValidPosition(position)) return true;
        return utils.hasWallClass(gameState.squares[position]);
    }

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - gameState.lastTime) / 1000;
        gameState.lastTime = currentTime;
        
        if (gameState.gameRunning && deltaTime < 0.1) {
            moveEnemies(deltaTime);
            checkPlayerEnemyCollision();
        }
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (!gameState.gameRunning) return;

        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                movePlayer('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                movePlayer('right');
                break;
            case 'ArrowUp':
                e.preventDefault();
                movePlayer('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                movePlayer('down');
                break;
            case 'Space':
                e.preventDefault();
                spawnKaboom();
                break;
        }
    });

    // Initialize Game
    createBoard();
    gameState.animationId = requestAnimationFrame(gameLoop);
});
