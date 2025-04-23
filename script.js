// Disable console.log to prevent cluttering
console.log = function() {};

// Encapsulation of the snake game
var Snake = (function() {

    // Constants and variable initialization
    const INITIAL_TAIL_LENGTH = 3; // Initial length is now 3
    const SNAKE_THICKNESS_FACTOR = 0.9; // Adjust for skinnier snake
    var fixedTail = true;
    var intervalID;
    var tileCount = 20;
    var gridSize = 500 / tileCount;
    const INITIAL_PLAYER = {
        x: Math.floor(tileCount / 2),
        y: Math.floor(tileCount / 2)
    };
    var velocity = { x: 0, y: 0 };
    var player = { x: INITIAL_PLAYER.x, y: INITIAL_PLAYER.y };
    var walls = true; // Enable walls by default
    var fruit = { x: 1, y: 1 };
    var trail = [];
    var tail = INITIAL_TAIL_LENGTH; // Use the new constant
    var reward = 0;
    var points = 0;
    var pointsMax = localStorage.getItem('snakeHighScore') || 0; // Load high score from storage

    // New pause flag
    var paused = false;

    // Enumeration for actions
    var ActionEnum = {
        'none': 0,
        'up': 1,
        'down': 2,
        'left': 3,
        'right': 4
    };
    Object.freeze(ActionEnum);
    var lastAction = ActionEnum.none;

    // Setup function for canvas and context
    function setup() {
        canv = document.getElementById('gc');
        ctx = canv.getContext('2d');
        // Initialize the game
        game.reset();
    }

    var game = {

        reset: function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canv.width, canv.height);
            tail = INITIAL_TAIL_LENGTH; // Reset to initial length
            points = 0;
            velocity.x = 0;
            velocity.y = 0;
            player.x = INITIAL_PLAYER.x;
            player.y = INITIAL_PLAYER.y;
            reward = -1;
            lastAction = ActionEnum.none;
            trail = [];
            trail.push({ x: player.x, y: player.y });
            for (var i = 1; i <= tail; i++) { // Start loop from 1 to correctly initialize the trail
                trail.push({ x: player.x, y: player.y });
            }
            game.RandomFruit(); // Ensure a fruit exists after reset
        },

        action: {
            up: function() {
                if (lastAction != ActionEnum.down) {
                    velocity.x = 0;
                    velocity.y = -1;
                }
            },
            down: function() {
                if (lastAction != ActionEnum.up) {
                    velocity.x = 0;
                    velocity.y = 1;
                }
            },
            left: function() {
                if (lastAction != ActionEnum.right) {
                    velocity.x = -1;
                    velocity.y = 0;
                }
            },
            right: function() {
                if (lastAction != ActionEnum.left) {
                    velocity.x = 1;
                    velocity.y = 0;
                }
            }
        },

        RandomFruit: function() {
            let newFruitPosition;
            let isOverlapping;

            do {
                isOverlapping = false;
                newFruitPosition = {
                    x: 1 + Math.floor(Math.random() * (tileCount - 2)),
                    y: 1 + Math.floor(Math.random() * (tileCount - 2))
                };

                // Check if the new fruit position overlaps with the snake's trail
                for (var i = 0; i < trail.length; i++) {
                    if (trail[i].x === newFruitPosition.x && trail[i].y === newFruitPosition.y) {
                        isOverlapping = true;
                        break;
                    }
                }
            } while (isOverlapping);

            fruit.x = newFruitPosition.x;
            fruit.y = newFruitPosition.y;
        },

        log: function() {
            console.log('x:' + player.x + ', y:' + player.y);
            console.log('fruit x:' + fruit.x + ', fruit y:' + fruit.y); // Added fruit position logging
            console.log('tail:' + tail + ', trail.length:' + trail.length);
        },

        // Main game loop function (modified for pause and score counter)
        loop: function() {

            // If paused, show pause overlay and update score, then skip updating game state
            if (paused) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canv.width, canv.height);
                ctx.fillStyle = 'black';
                ctx.font = "bold 20px Arial";
                ctx.fillText("Paused", canv.width / 2 - 40, canv.height / 2);
                if (document.getElementById("score-counter")) {
                    document.getElementById("score-counter").innerText = "Score: " + points + " | Max: " + pointsMax;
                }
                return reward;
            }

            reward = -0.1;
            // (Existing inner functions: moveToLargerSide, DontHitWall remain unchanged)
            function moveToLargerSide() {
                let distLeft = player.x;
                let distRight = tileCount - 1 - player.x;
                let distTop = player.y;
                let distBottom = tileCount - 1 - player.y;
                let maxDistance = Math.max(distLeft, distRight, distTop, distBottom);
                if (maxDistance === distLeft) { player.x--; }
                else if (maxDistance === distRight) { player.x++; }
                else if (maxDistance === distTop) { player.y--; }
                else { player.y++; }
            }

            function DontHitWall() {
                // No wrap-around anymore
            }

            function HitWall() {
                if (player.x < 0 || player.x >= tileCount || player.y < 0 || player.y >= tileCount) {
                    game.reset();
                }
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, gridSize - 1, canv.height);
                ctx.fillRect(0, 0, canv.width, gridSize - 1);
                ctx.fillRect(canv.width - gridSize + 1, 0, gridSize, canv.height);
                ctx.fillRect(0, canv.height - gridSize + 1, canv.width, gridSize);
            }

            var stopped = velocity.x == 0 && velocity.y == 0;
            player.x += velocity.x;
            player.y += velocity.y;

            if (velocity.x == 0 && velocity.y == -1) lastAction = ActionEnum.up;
            if (velocity.x == 0 && velocity.y == 1) lastAction = ActionEnum.down;
            if (velocity.x == -1 && velocity.y == 0) lastAction = ActionEnum.left;
            if (velocity.x == 1 && velocity.y == 0) lastAction = ActionEnum.right;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canv.width, canv.height);

            HitWall(); // Always check for wall collisions

            game.log();

            if (!stopped) {
                trail.push({ x: player.x, y: player.y });
                while (trail.length > tail) trail.shift();
            }

            if (!stopped) {
                ctx.fillStyle = 'rgba(200,200,200,0.8)';
                ctx.font = "bold 12px Arial";
                ctx.fillText("(esc) reset", 30, 33);
                ctx.fillText("(space) pause", 30, 20);
                ctx.font = "10px Arial";
                ctx.fillText("", 33, 485);
            }

            // Draw the snake with rounded head and skinnier body
            ctx.fillStyle = 'lime';
            const segmentInset = gridSize * (1 - SNAKE_THICKNESS_FACTOR) / 2;
            const segmentSize = gridSize * SNAKE_THICKNESS_FACTOR;

            for (var i = 0; i < trail.length; i++) {
                const segment = trail[i];
                const x = segment.x * gridSize + segmentInset;
                const y = segment.y * gridSize + segmentInset;

                // Draw rounded rectangles for the body
                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, segmentSize - 2, segmentSize - 2, 3); // Adjust roundness
                ctx.fill();

                if (!stopped && segment.x == player.x && segment.y == player.y && i < trail.length - 1) {
                    game.reset();
                }
            }
            // Draw the head with a slightly different color
            const headX = trail[trail.length - 1].x * gridSize + segmentInset;
            const headY = trail[trail.length - 1].y * gridSize + segmentInset;
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.roundRect(headX + 1, headY + 1, segmentSize - 2, segmentSize - 2, 5); // More rounded head
            ctx.fill();

            if (player.x == fruit.x && player.y == fruit.y) {
                if (!fixedTail) tail++;
                points++;
                if (points > pointsMax) {
                    pointsMax = points;
                    localStorage.setItem('snakeHighScore', pointsMax); // Save new high score
                }
                reward = 1;
                game.RandomFruit();
            }

            // Draw the apple emoji
            ctx.font = `${gridSize - 2}px sans-serif`; // Use a sans-serif font for better emoji rendering
            ctx.fillStyle = 'red'; // Set the color to red (although the emoji has its own color)
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🍎", fruit.x * gridSize + gridSize / 2, fruit.y * gridSize + gridSize / 2);
            ctx.textAlign = "start"; // Reset text alignment
            ctx.textBaseline = "alphabetic"; // Reset text baseline


            if (stopped) {
                ctx.fillStyle = 'rgba(250,250,250,0.8)';
                ctxfont = `${gridSize}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("🍎", fruit.x * gridSize + gridSize / 2, fruit.y * gridSize + gridSize / 2);
                ctx.fillStyle = 'white';
                ctx.font = "bold 10px Arial";
                ctx.textAlign = "start"; // Reset text alignment
                ctx.textBaseline = "alphabetic"; // Reset text baseline
                ctx.fillText("Total Points: " + points, 370, 40);
                ctx.fillText("Max Points: " + pointsMax, 370, 60);

                // Update the external score counter
                if (document.getElementById("score-counter")) {
                    document.getElementById("score-counter").innerText = "Score: " + points + " | Max: " + pointsMax;
                }

                return reward;
            }
            return reward;
        }
    };

    // Key event handling remains the same
    function keyPush(evt) {
        switch (evt.keyCode) {
            case 37: // Left key (corrected key code)
                game.action.left();
                evt.preventDefault();
                break;
            case 38: // Up key
                game.action.up();
                evt.preventDefault();
                break;
            case 39: // Right key (corrected key code)
                game.action.right();
                evt.preventDefault();
                break;
            case 40: // Down key.
                game.action.down();
                evt.preventDefault();
                break;
            case 32: // (space) key.
                Snake.pause();
                evt.preventDefault();
                break;
            case 27: // (esc) key.
                game.reset();
                evt.preventDefault();
                break;
        }
    }

    return {
        start: function(fps = 7) { // Set an even slower FPS (e.g., 7)
            window.onload = setup;
            intervalID = setInterval(game.loop, 1000 / fps); // Corrected interval calculation
        },
        loop: game.loop,
        reset: game.reset,
        stop: function() {
            clearInterval(intervalID);
        },
        setup: {
            keyboard: function(state) {
                if (state) {
                    document.addEventListener('keydown', keyPush);
                } else {
                    document.removeEventListener('keydown', keyPush);
                }
            },
            wall: function(state) {
                walls = state;
            },
            tileCount: function(size) {
                tileCount = size;
                gridSize = 500 / tileCount;
            },
            fixedTail: function(state) {
                fixedTail = state;
            }
        },
        action: function(act) {
            switch (act) {
                case 'left': game.action.left(); break;
                case 'up': game.action.up(); break;
                case 'right': game.action.right(); break;
                case 'down': game.action.down(); break;
            }
        },
        // Updated pause function: toggle the paused flag.
        pause: function() {
            paused = !paused;
        },
        // Expose the pause state for external checking
        isPaused: function() {
            return paused;
        },
        clearTopScore: function() {
            pointsMax = 0;
            localStorage.removeItem('snakeHighScore'); // Optionally clear local storage
            if (document.getElementById("score-counter")) {
                document.getElementById("score-counter").innerText = "Score : 0 | Max : 0";
            }
        },
        data: {
            player: player,
            fruit: fruit,
            trail: function() {
                return trail;
            }
        },
        info: {
            tileCount: tileCount,
            highScore: function() {
                return localStorage.getItem('snakeHighScore') || 0;
            }
        }
    };

})();

// Start the game and set up keyboard controls
Snake.start(7); // Set a slower FPS value for slower speed (e.g., 7)
Snake.setup.keyboard(true);
Snake.setup.wall(true); // Ensure walls are enabled
Snake.setup.fixedTail(false);

// Add an event listener to the pause button to toggle pause and update its label
document.addEventListener("DOMContentLoaded", function() { // Ensure the DOM is loaded
    const pauseButton = document.getElementById("pause-btn");
    if (pauseButton) {
        pauseButton.addEventListener("click", function() {
            Snake.pause();
            this.textContent = Snake.isPaused() ? "Resume" : "Pause";
        });
    }

    // Optional: Add a button to clear the high score
    const clearScoreButton = document.getElementById("clear-score-btn");
    if (clearScoreButton) {
        clearScoreButton.addEventListener("click", function() {
            Snake.clearTopScore();
        });
    }

    // Initialize the score display on load
    const scoreCounter = document.getElementById("score-counter");
    if (scoreCounter) {
        scoreCounter.innerText = "Score: 0 | Max: " + Snake.info.highScore();
    }
});