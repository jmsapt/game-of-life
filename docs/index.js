import { Universe } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/game_of_life_bg.wasm";

// play-pause button functionality
let animationId = null;
const playPauseButton = document.getElementById("play-pause-button");
const blankResetButton = document.getElementById("blank-reset-button");
const randomResetButton = document.getElementById("random-reset-button");
const tickrateSlider = document.getElementById("tick-rate-slider");
const tickrateLabel= document.getElementById("tick-rate-label");
let tickrate = tickrateSlider.value;
tickrateLabel.innerText = tickrate;

// 20% border on left, right, and bottom
const CELL_SIZE = 16; // px
const WIDTH = Number(window.innerWidth * 0.8 / CELL_SIZE); // cells
const HEIGHT = Number(window.innerHeight * 0.7 / CELL_SIZE); // cells

console.log(WIDTH, HEIGHT)

const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";



tickrateSlider.addEventListener("input", event => {
    tickrate = tickrateSlider.value;
    tickrateLabel.innerText = tickrate;
})


// Construct the universe, and get its width and height.
const universe = Universe.new(WIDTH, HEIGHT);
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
const ctx = canvas.getContext('2d');


const isPaused = () => {
    return animationId === null;
}

const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
}

const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
}

playPauseButton.addEventListener("click", event => {
    console.log("Clicked!")
    if (isPaused()) {
        play();
    }
    else {
        pause();
    }
});

randomResetButton.addEventListener("click", event => {
    // pause game
    pause();

    // reset universe to random with 25% alive chance
    universe.set_random(0.25);
    console.log("Universe reset to random");

    // redraw cells
    drawCells();
});

blankResetButton.addEventListener("click", event => {
    // pause game
    pause();
    
    // reset universe to blank
    universe.set_blank();
    console.log("Universe reset to blank");

    // redraw cells
    drawCells();
});



// toggling cells
canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    drawGrid();
    drawCells();
});

let now;
let delta;
let then = performance.now();

// rendering logic
const renderLoop = () => {
    now = Date.now();
    delta = now - then;
    
    if (delta > 1000 / tickrate) {
        drawGrid();
        drawCells();
        universe.tick();
        
        then = now - (delta % (1000 / tickrate));
    }
    
    animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};


const drawCells = () => {
    const cellsPtr = universe.cells();

    // This is updated!
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            // This is updated!
            ctx.fillStyle = bitIsSet(idx, cells)
                ? ALIVE_COLOR
                : DEAD_COLOR;

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};


const bitIsSet = (n, arr) => {
    const byte = Math.floor(n / 8);
    const mask = 1 << (n % 8);
    return (arr[byte] & mask) === mask;
};




// start paused
drawGrid();
drawCells();
pause();
