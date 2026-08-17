/*
  Maze legend:
    # = wall
    space = corridor
    S = start position
    G = goal position
*/
let maze = [];
let numRows = 0, numCols = 0;
let startRow = 0, startCol = 0;
let goalRow = 0, goalCol = 0;
let shortestRoute = 0;

/*
  Each level names a checked-in maze plus the difficulty the generator should
  build when a fresh layout is requested. The structure of each difficulty
  (size, loops, dead ends, open rooms) lives in maze_generator.py so that the
  game and the tests agree on what "hard" means.
*/
const MAZE_LEVELS = {
    tutorial: {
        label: "Tutorial maze",
        url: "mazes/default.txt",
        difficulty: "easy",
    },
    easy: {
        label: "Easy",
        url: "mazes/easy_winding.txt",
        difficulty: "easy",
    },
    medium: {
        label: "Medium",
        url: "mazes/medium_crossroads.txt",
        difficulty: "medium",
    },
    hard: {
        label: "Hard",
        url: "mazes/hard_switchbacks.txt",
        difficulty: "hard",
    },
    expert: {
        label: "Expert",
        url: "mazes/expert_archipelago.txt",
        difficulty: "expert",
    },
};

let currentMazeLevel = "tutorial";

function parseMazeText(text) {
    return text
        .split(/\r?\n/)
        .filter(line => line.length > 0);
}

function validateMaze(nextMaze) {
    if (nextMaze.length === 0 || nextMaze[0].length === 0) {
        throw new Error("Maze is empty");
    }

    const columns = nextMaze[0].length;
    if (nextMaze.some(line => line.length !== columns)) {
        throw new Error("Maze rows must all have the same length");
    }

    const allowed = new Set(["#", ".", " ", "S", "G"]);
    const starts = [];
    const goals = [];

    nextMaze.forEach((line, row) => {
        Array.from(line).forEach((character, column) => {
            if (!allowed.has(character)) {
                throw new Error(`Unsupported maze character: ${character}`);
            }
            if (character === "S") starts.push([row, column]);
            if (character === "G") goals.push([row, column]);
        });
    });

    if (starts.length !== 1 || goals.length !== 1) {
        throw new Error("Maze must contain exactly one start and one goal");
    }

    const [start] = starts;
    const [goal] = goals;
    const queue = [start];
    const visited = new Set([start.join(",")]);
    // Distances double as the shortest possible number of moves, which the
    // run summary compares the learner's own move count against.
    const distance = new Map([[start.join(","), 0]]);

    for (let index = 0; index < queue.length; index++) {
        const [row, column] = queue[index];
        if (row === goal[0] && column === goal[1]) {
            return {start, goal, shortest: distance.get(`${row},${column}`)};
        }

        for (const [rowDelta, columnDelta] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
            const nextRow = row + rowDelta;
            const nextColumn = column + columnDelta;
            const key = `${nextRow},${nextColumn}`;
            if (
                nextRow >= 0 && nextRow < nextMaze.length &&
                nextColumn >= 0 && nextColumn < columns &&
                nextMaze[nextRow][nextColumn] !== "#" &&
                !visited.has(key)
            ) {
                visited.add(key);
                distance.set(key, distance.get(`${row},${column}`) + 1);
                queue.push([nextRow, nextColumn]);
            }
        }
    }

    throw new Error("Maze has no route from start to goal");
}

function applyMaze(nextMaze) {
    const {start, goal, shortest} = validateMaze(nextMaze);
    maze = nextMaze;
    numRows = maze.length;
    numCols = maze[0].length;
    [startRow, startCol] = start;
    [goalRow, goalCol] = goal;
    shortestRoute = shortest;

    // Expose maze data to Python.
    globalThis.JS_MAZE = maze;
    globalThis.JS_MAZE_NUM_ROWS = numRows;
    globalThis.JS_MAZE_NUM_COLS = numCols;
    globalThis.JS_MAZE_START_ROW = startRow;
    globalThis.JS_MAZE_START_COL = startCol;
    globalThis.JS_MAZE_GOAL_ROW = goalRow;
    globalThis.JS_MAZE_GOAL_COL = goalCol;
}

/* Load a maze definition from a text file. */
async function fetchMaze(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load maze from ${url}: ${res.status} ${res.statusText}`);
    }

    return parseMazeText(await res.text());
}

applyMaze(await fetchMaze(MAZE_LEVELS.tutorial.url));

/*
  Directions used for drawing and for updating the visual
  position: 0 = up, 1 = right, 2 = down, 3 = left
*/
const DIRS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
];

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

/*
  The maze fills whatever width its panel offers, so a wide screen shows a
  large maze rather than shrinking the harder, bigger layouts into a corner.
  A cap stops the small tutorial maze from becoming comically large.
*/
const MAX_CELL_SIZE = 44;
/* Roughly the height of the panel's heading, controls and status line. */
const MAZE_PANEL_CHROME_HEIGHT = 300;

let cellSize;
let offsetX = 0;
let offsetY = 0;
let canvasWidth = 0;
let canvasHeight = 0;

/* Width the maze may occupy, inside its stage's padding. */
function availableMazeWidth() {
    const stage = canvas.parentElement;
    const styles = getComputedStyle(stage);
    const padding =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    return Math.max(200, stage.clientWidth - padding);
}

function updateMazeGeometry() {
    // Keep the whole maze panel inside the window where possible, so on a
    // wide screen the maze and the editor can be read side by side.
    const maxHeight = Math.max(
        260,
        Math.min(window.innerHeight - MAZE_PANEL_CHROME_HEIGHT, 780),
    );
    cellSize = Math.min(
        availableMazeWidth() / numCols,
        maxHeight / numRows,
        MAX_CELL_SIZE,
    );

    canvasWidth = numCols * cellSize;
    canvasHeight = numRows * cellSize;

    // Draw at device resolution so the grid lines stay crisp, then work in
    // CSS pixels everywhere else. Resizing a canvas resets its context, so
    // the scale transform has to be reapplied here.
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = Math.max(1, Math.round(canvasWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(canvasHeight * pixelRatio));
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

updateMazeGeometry();

/* Follow panel resizes, including the switch between one and two columns. */
let lastMazeWidth = Math.round(availableMazeWidth());

function refitMaze() {
    updateMazeGeometry();
    if (visRow !== undefined) drawMaze();
}

if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => {
        const width = Math.round(availableMazeWidth());
        if (width === lastMazeWidth) return;
        lastMazeWidth = width;
        refitMaze();
    }).observe(canvas.parentElement);
}

// The window's height also limits the maze, and it can change without the
// panel's width changing at all. This also covers browsers where the
// observer above is unavailable, since the panel only reflows with the
// window in practice.
window.addEventListener("resize", refitMaze);

// Fonts and the panel's own borders can settle after this module first runs,
// so measure once more when the page has finished loading.
window.addEventListener("load", refitMaze);
requestAnimationFrame(refitMaze);

/*
  Visual state of the player. This is separate from the logical
  position stored on the Python side.
*/
let visRow, visCol, visDir;

/* Queue of actions emitted by Python, e.g. "move", "turnLeft", "turnRight". */
let actionQueue = [];

/* lets Python add an action that JS will animate later. */
globalThis.js_enqueue_action = function (type) {
    actionQueue.push({type});
};

/* Draw the triangular player marker in the current cell. */
function drawPlayer(row, col, dir) {
    const x = offsetX + col * cellSize;
    const y = offsetY + row * cellSize;
    const cx = x + cellSize / 2;
    const cy = y + cellSize / 2;
    const r = cellSize * 0.35;

    ctx.fillStyle = "#1e88e5";
    ctx.beginPath();
    if (dir === 0) {           // up
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx - r, cy + r);
        ctx.lineTo(cx + r, cy + r);
    } else if (dir === 1) {    // right
        ctx.moveTo(cx + r, cy);
        ctx.lineTo(cx - r, cy - r);
        ctx.lineTo(cx - r, cy + r);
    } else if (dir === 2) {    // down
        ctx.moveTo(cx, cy + r);
        ctx.lineTo(cx - r, cy - r);
        ctx.lineTo(cx + r, cy - r);
    } else {                   // left
        ctx.moveTo(cx - r, cy);
        ctx.lineTo(cx + r, cy - r);
        ctx.lineTo(cx + r, cy + r);
    }
    ctx.closePath();
    ctx.fill();
}

/* Draw the full maze plus current player position. */
function drawMaze() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Grid lines help pupils count squares, but on the biggest mazes they
    // crowd the passages, so they are dropped once cells get small.
    const showGrid = cellSize >= 11;

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const ch = maze[r][c];
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;

            ctx.fillStyle = (ch === "#") ? "#243b57" : "#ffffff";
            ctx.fillRect(x, y, cellSize, cellSize);

            // Highlight the goal cell
            if (r === goalRow && c === goalCol) {
                ctx.fillStyle = goalPulseOn ? "#33d6a6" : "#b6f0da";
                ctx.fillRect(x, y, cellSize, cellSize);
            }

            if (showGrid && ch !== "#") {
                ctx.strokeStyle = "#e4eaf1";
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }
    }

    drawPlayer(visRow, visCol, visDir);
}

/*
  Flash the goal a few times when the maze is solved. Reaching the goal is
  the whole point of the activity, so it should be visibly rewarded rather
  than only reported as a line of text.
*/
let goalPulseOn = false;

async function celebrateGoal(runId) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (let pulse = 0; pulse < 3; pulse++) {
        if (runId !== runCounter) break;
        goalPulseOn = true;
        drawMaze();
        await sleep(150);
        goalPulseOn = false;
        drawMaze();
        await sleep(130);
    }

    goalPulseOn = false;
    if (runId === runCounter) drawMaze();
}

/* Reset just the JS visual state, not the Python logic. */
function resetVisualState() {
    visRow = startRow;
    visCol = startCol;
    visDir = 1;
    actionQueue = [];
    drawMaze();
}

/* Append a line of text to the output text area. */
function appendOutput(text) {
    const output = document.getElementById("output");
    output.value += text + "\n";
    output.scrollTop = output.scrollHeight;
}

/* Simple async sleep function for the animation loop. */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* Helper to compute one step forward from a given position and direction. */
function stepForward(row, col, dir) {
    const [dr, dc] = DIRS[dir];
    return [row + dr, col + dc];
}

/*
  Animate all actions currently in the queue.

  runId is used so that if the user hits "Run" again we can cancel
  the previous animation by checking that runId is still current.
*/
async function playActions(runId) {
    const speedInput = document.getElementById("speed");
    const actionCount = actionQueue.length;
    drawMaze();

    // A solver stuck in a loop can queue thousands of actions. Played at the
    // normal pace that is minutes of watching, so long runs are drawn in
    // batches and hurried along.
    const framesToDraw = Math.min(actionCount, MAX_ANIMATION_FRAMES);
    const drawEvery = Math.max(1, Math.ceil(actionCount / framesToDraw));
    if (drawEvery > 1) {
        setMazeStatus(`${actionCount} steps — animation sped up.`);
    }

    for (let index = 0; index < actionCount; index++) {
        if (runId !== runCounter) return; // cancelled

        const action = actionQueue[index];
        if (action.type === "move") {
            [visRow, visCol] = stepForward(visRow, visCol, visDir);
        } else if (action.type === "turnLeft") {
            visDir = (visDir + 3) % 4;
        } else if (action.type === "turnRight") {
            visDir = (visDir + 1) % 4;
        }

        const isLastAction = index === actionCount - 1;
        if (index % drawEvery === 0 || isLastAction) {
            drawMaze();
            await sleep(getActionDelay(speedInput, actionCount) * drawEvery);
        }
    }
}

let pyodide;
let pythonReady = false;
let runCounter = 0;
let tutorialAnimationActive = false;

const TUTORIAL_TARGET_ACTION_DELAY_MS = 1000;
const TUTORIAL_EXTRA_DELAY_BUDGET_MS = 10000;

/* Longest a whole animation should take, and how many frames it may draw. */
const MAX_ANIMATION_MS = 10000;
const MAX_ANIMATION_FRAMES = 500;

function getActionDelay(speedInput, actionCount) {
    const raw = parseInt(speedInput.value, 10);
    const min = parseInt(speedInput.min, 10);
    const max = parseInt(speedInput.max, 10);
    const chosenDelay = (max + min) - raw;
    const normalDelay = Math.min(
        chosenDelay,
        MAX_ANIMATION_MS / Math.max(1, actionCount),
    );

    if (!tutorialAnimationActive) return normalDelay;

    // Make short tutorial examples easy to follow. For a long program, divide
    // a bounded amount of extra time across its actions so the tutorial pace
    // cannot add more than roughly ten seconds to the complete animation.
    const actionTotal = Math.max(1, actionCount);
    const extraDelayBudget = TUTORIAL_EXTRA_DELAY_BUDGET_MS / actionTotal;
    const extraDelayNeeded = Math.max(
        0,
        TUTORIAL_TARGET_ACTION_DELAY_MS - normalDelay,
    );

    return normalDelay + Math.min(extraDelayNeeded, extraDelayBudget);
}

/*
  Create a single Pyodide instance and load maze.py into it.
  This promise resolves once Pyodide is fully ready.
*/
const pyodideReadyPromise = (async () => {
    pyodide = await loadPyodide();

    const outputEl = document.getElementById("output");

    // Send Python's stdout and stderr into the output text area
    pyodide.setStdout({
      batched: (msg) => {
        // normalise Windows newlines just in case
        msg = msg.replace(/\r/g, "");

        outputEl.value += msg;
        if (msg.length && !msg.endsWith("\n")) outputEl.value += "\n";

        outputEl.scrollTop = outputEl.scrollHeight;
      }
    });
    pyodide.setStderr({
      batched: (msg) => {
        msg = msg.replace(/\r/g, "");

        outputEl.value += msg;
        if (msg.length && !msg.endsWith("\n")) outputEl.value += "\n";

        outputEl.scrollTop = outputEl.scrollHeight;
      }
    });

    // Load the Python game API and generator into the interpreter.
    const [apiResponse, generatorResponse] = await Promise.all([
        fetch(`maze.py?v=${Date.now()}`, {cache: "no-store"}),
        fetch(`maze_generator.py?v=${Date.now()}`, {cache: "no-store"}),
    ]);
    if (!apiResponse.ok) {
        throw new Error(`Failed to load maze.py: ${apiResponse.status}`);
    }
    if (!generatorResponse.ok) {
        throw new Error(`Failed to load maze_generator.py: ${generatorResponse.status}`);
    }

    const apiCode = await apiResponse.text();
    await pyodide.runPythonAsync(apiCode);

    const generatorCode = await generatorResponse.text();
    pyodide.globals.set("PMG_GENERATOR_SOURCE", generatorCode);
    await pyodide.runPythonAsync(`
import types as _pmg_types
PMG_MAZE_GENERATOR = _pmg_types.ModuleType("maze_generator")
exec(
    compile(PMG_GENERATOR_SOURCE, "maze_generator.py", "exec"),
    PMG_MAZE_GENERATOR.__dict__,
)
`);

    pythonReady = true;
    document.getElementById("runBtn").textContent = "Run program";
    setMazeChangeInProgress(false);
    setMazeStatus("Tutorial maze loaded.");
    document.dispatchEvent(new CustomEvent("maze:ready"));

    return pyodide;
})();

pyodideReadyPromise.catch(error => {
    pythonReady = false;
    setMazeChangeInProgress(false);
    setMazeStatus("The Python runtime could not be loaded. Refresh the page to try again.", true);
    appendOutput(`Unable to start Python: ${error}`);
});

let mazeChangeCounter = 0;

function setMazeStatus(message, isError = false) {
    const mazeStatus = document.getElementById("mazeStatus");
    mazeStatus.textContent = message;
    mazeStatus.classList.toggle("error", isError);
}

function clearMazeChoicePrompt() {
    document.getElementById("mazeControls").classList.remove("maze-controls-prompt");
}

function showMazeChoicePrompt() {
    document.getElementById("mazeControls").classList.add("maze-controls-prompt");
    setMazeStatus(
        "Tutorial complete. The tutorial maze is still loaded. Use the Maze menu " +
        "to load another type, or generate a fresh layout when you are ready.",
    );
}

function setMazeControlsEnabled(enabled) {
    document.getElementById("mazeSelect").disabled = !enabled;
    document.getElementById("generateMazeBtn").disabled = !enabled;
}

function setMazeChangeInProgress(inProgress) {
    const controlsEnabled = pythonReady && !inProgress;
    setMazeControlsEnabled(controlsEnabled);
    document.getElementById("runBtn").disabled = !controlsEnabled;
    document.getElementById("resetBtn").disabled = !controlsEnabled;
}

async function activateMaze(nextMaze, level, description) {
    applyMaze(nextMaze);
    currentMazeLevel = level;
    document.getElementById("mazeSelect").value = level;

    runCounter++;
    updateMazeGeometry();
    resetVisualState();
    document.getElementById("output").value = "";
    await pyodide.runPythonAsync("_sync_maze_from_js()");

    setMazeStatus(description);
    document.dispatchEvent(new CustomEvent("maze:changed", {
        detail: {
            level,
            rows: numRows,
            columns: numCols,
            start: [startRow, startCol],
            goal: [goalRow, goalCol],
        }
    }));
}

async function loadPresetMaze(level) {
    const config = MAZE_LEVELS[level];
    if (!config) return;

    clearMazeChoicePrompt();
    const changeId = ++mazeChangeCounter;
    setMazeChangeInProgress(true);
    setMazeStatus(`Loading ${config.label.toLowerCase()}…`);

    try {
        const [nextMaze] = await Promise.all([
            fetchMaze(config.url),
            pyodideReadyPromise,
        ]);
        if (changeId !== mazeChangeCounter) return;

        await activateMaze(nextMaze, level, `${config.label} loaded.`);
    } catch (error) {
        if (changeId !== mazeChangeCounter) return;
        setMazeStatus(`Could not load ${config.label.toLowerCase()}.`, true);
        appendOutput(String(error));
    } finally {
        if (changeId === mazeChangeCounter) setMazeChangeInProgress(false);
    }
}

async function generateNewMaze(level = currentMazeLevel) {
    const generatedLevel = level === "tutorial" ? "easy" : level;
    const config = MAZE_LEVELS[generatedLevel];
    if (!config) return;

    clearMazeChoicePrompt();
    const changeId = ++mazeChangeCounter;
    setMazeChangeInProgress(true);
    setMazeStatus(`Generating a new ${config.label.toLowerCase()} maze…`);

    try {
        await pyodideReadyPromise;
        if (changeId !== mazeChangeCounter) return;

        pyodide.globals.set("PMG_GENERATED_DIFFICULTY", config.difficulty);
        const generatedText = await pyodide.runPythonAsync(`
PMG_MAZE_GENERATOR.maze_to_text(
    PMG_MAZE_GENERATOR.generate_difficulty(PMG_GENERATED_DIFFICULTY)
)
`);
        if (changeId !== mazeChangeCounter) return;

        await activateMaze(
            parseMazeText(String(generatedText)),
            generatedLevel,
            `New ${config.label.toLowerCase()} maze generated.`,
        );
    } catch (error) {
        if (changeId !== mazeChangeCounter) return;
        setMazeStatus("Could not generate a new maze.", true);
        appendOutput(String(error));
    } finally {
        if (changeId === mazeChangeCounter) setMazeChangeInProgress(false);
    }
}

async function runProgram() {
    // Wait for Pyodide and maze.py to be ready
    await pyodideReadyPromise;

    const code = document.getElementById("code").value;
    const outputEl = document.getElementById("output");
    outputEl.value = "";

    // Increment runCounter so any previous animation loops stop
    runCounter++;
    const thisRun = runCounter;
    document.dispatchEvent(new CustomEvent("maze:run-start", {
        detail: {runId: thisRun}
    }));

    // Reset JS visual state
    resetVisualState();

    let hadError = false;

    // Reset Python side game state
    try {
        await pyodide.runPythonAsync("reset_state()");
    } catch (err) {
        hadError = true;
        appendOutput("Python error in reset_state(): " + err);
    }

    // Run the user's Python program
    try {
        // Budget for a generous but finite program. A looping wall follower
        // reaches this in a couple of seconds, which keeps the wait before a
        // StepLimitError short enough to stay interesting.
        pyodide.globals.set("PMG_SRC", code);
        pyodide.globals.set("PMG_MAX_SECONDS", 5);
        pyodide.globals.set("PMG_MAX_STEPS", 25000);

        await pyodide.runPythonAsync("run_user_code(PMG_SRC, PMG_MAX_SECONDS, PMG_MAX_STEPS)");
    } catch (err) {
        hadError = true;
        appendOutput(formatPyodideError(err));
    }

    const actionTypes = actionQueue.map(action => action.type);

    // Animate the recorded actions
    await playActions(thisRun);

    // A newer run or reset has replaced this one.
    if (thisRun !== runCounter) return;

    // Ask Python whether the player reached the goal
    let reached = false;
    try {
        reached = pyodide.runPython("at_goal()");
    } catch (err) {
        hadError = true;
        appendOutput("Python error in at_goal(): " + err);
    }

    if (reached) {
        const moves = actionTypes.filter(type => type === "move").length;
        appendOutput(
            `Reached the goal in ${moves} moves. ` +
            `The shortest route is ${shortestRoute}.`,
        );
        setMazeStatus(`Solved in ${moves} moves (shortest route ${shortestRoute}).`);
    } else if (!hadError) {
        appendOutput("Program finished without reaching goal.");
    }

    // Reported before the celebration so the tutorial unlocks immediately.
    document.dispatchEvent(new CustomEvent("maze:run-complete", {
        detail: {
            runId: thisRun,
            reached,
            hadError,
            actions: actionTypes
        }
    }));

    if (reached) await celebrateGoal(thisRun);
}

function formatPyodideError(err) {
    let msg = String(err);

    msg = msg.replace(/^PythonError:\s*/, "");

    const lines = msg.split("\n");

    const execIdx = lines.findIndex(l => l.includes('File "<exec>"'));

    if (execIdx !== -1) {
        return lines.slice(execIdx).join("\n").trim();
    }

    const filtered = lines.filter(l =>
        !l.includes("/_pyodide/") &&
        !l.includes("python312.zip") &&
        !l.includes("_pyodide")
    );

    return filtered.join("\n").trim();
}


/* UI wiring and defaults */

const initialCodeBox = document.getElementById("code");
if (!initialCodeBox.value.trim()) {
    initialCodeBox.value = `# Enter your python code here`;
}

// Run button
document.getElementById("runBtn").addEventListener("click", () => {
    runProgram();
});

// Reset button clears output and resets both JS and Python state
document.getElementById("resetBtn").addEventListener("click", () => {
    runCounter++;
    document.getElementById("output").value = "";
    resetVisualState();
    pyodideReadyPromise.then(() => pyodide.runPythonAsync("reset_state()"));
});

/*
  Sample button loads the worked solver. Replacing work in progress needs a
  confirmation, but an empty or untouched editor does not, and a browser
  confirm() dialog in the middle of a short activity is worth avoiding.
*/
document.getElementById("sampleBtn").addEventListener("click", async () => {
    const code = document.getElementById("code");
    const written = code.value.trim();
    const untouched = written === "" || written === "# Enter your python code here";

    if (!untouched && !window.confirm(
        "Replace your code with the sample solver?"
    )) {
        return;
    }

    const response = await fetch("samples/default.txt");
    code.value = await response.text();
    code.dispatchEvent(new Event("input")); // refresh line numbers
    code.focus();
});

document.getElementById("mazeSelect").addEventListener("change", event => {
    loadPresetMaze(event.target.value);
});

document.getElementById("generateMazeBtn").addEventListener("click", () => {
    generateNewMaze();
});

// Tutorials always use the known fixed maze. It stays loaded afterward so the
// learner can choose when and how to move on to another maze.
document.addEventListener("tutorial:start", () => {
    tutorialAnimationActive = true;
    clearMazeChoicePrompt();
    if (currentMazeLevel !== "tutorial") loadPresetMaze("tutorial");
});

document.addEventListener("tutorial:end", () => {
    tutorialAnimationActive = false;
});

document.addEventListener("tutorial:complete", async () => {
    if (currentMazeLevel !== "tutorial") {
        await loadPresetMaze("tutorial");
    }
    if (currentMazeLevel === "tutorial") showMazeChoicePrompt();
});

/*
  Small bridge for other scripts on the page (this file is a module, so
  pyodide itself is not global). Anything that needs to run Python or swap the
  displayed maze should go through here rather than reaching into maze.js.
*/
globalThis.mazeGame = {
    loadPreset: loadPresetMaze,
    generate: generateNewMaze,

    /* Resolves once Pyodide, maze.py and the generator are all loaded. */
    ready: () => pyodideReadyPromise,

    /* Run a snippet of Python and return its value. */
    runPython: async source => {
        await pyodideReadyPromise;
        return pyodide.runPythonAsync(source);
    },

    /* Set a Python global, for passing values in before runPython(). */
    setGlobal: async (name, value) => {
        await pyodideReadyPromise;
        pyodide.globals.set(name, value);
    },

    /* Display an arbitrary maze, e.g. one that a challenge run failed on. */
    loadMazeText: async (text, level, description) => {
        await pyodideReadyPromise;
        await activateMaze(parseMazeText(String(text)), level, description);
    },

    /* Disable the run and maze controls while a long task is in progress. */
    setBusy: inProgress => setMazeChangeInProgress(inProgress),

    /* The current contents of the Python editor. */
    getCode: () => document.getElementById("code").value,

    /* Status line under the maze controls. */
    setStatus: (message, isError = false) => setMazeStatus(message, isError),
};

// Initial draw when the page loads
resetVisualState();

/*  Simple JS tabs for the help panel */

function initHelpTabs() {
    const tabs = document.getElementById("help-tabs");
    if (!tabs) return;

    const buttons = tabs.querySelectorAll(".tabs-nav button");
    const panes = tabs.querySelectorAll(".tab-pane");

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            // update button active state
            buttons.forEach((b) => {
                b.classList.toggle("active", b === btn);
            });

            // show matching pane
            panes.forEach((pane) => {
                pane.classList.toggle("active", pane.dataset.tab === target);
            });
        });
    });
}

initHelpTabs();


function initTabIndent(textarea) {
    textarea.addEventListener("keydown", (e) => {
        if (e.key !== "Tab") return;

        e.preventDefault();

        const value = textarea.value;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = "    ";

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const selEnd = (lineEnd === -1) ? value.length : lineEnd;

        const selectedBlock = value.slice(lineStart, selEnd);
        const lines = selectedBlock.split("\n");

        // Indent or unindent each line
        if (!e.shiftKey) {
            const newBlock = lines.map(l => indent + l).join("\n");
            textarea.value = value.slice(0, lineStart) + newBlock + value.slice(selEnd);

            textarea.selectionStart = start + indent.length;
            textarea.selectionEnd = end + indent.length * lines.length;
        } else {
            const newLines = lines.map(l => l.startsWith(indent) ? l.slice(indent.length)
                : l.startsWith(" ") ? l.replace(/^ {1,4}/, "")
                    : l);
            const newBlock = newLines.join("\n");
            textarea.value = value.slice(0, lineStart) + newBlock + value.slice(selEnd);

            textarea.selectionStart = Math.max(lineStart, start - 4);
            textarea.selectionEnd = Math.max(lineStart, end - 4 * lines.length);
        }

        textarea.dispatchEvent(new Event("input"));
    });
}

const codeBox = document.getElementById("code");
initTabIndent(codeBox);

function initLineNumbers(textarea, gutter) {
    function update() {
        const lines = textarea.value.split("\n").length;
        let out = "";
        for (let i = 1; i <= lines; i++) out += i + "\n";
        gutter.textContent = out;
    }

    textarea.addEventListener("input", update);
    textarea.addEventListener("scroll", () => {
        gutter.scrollTop = textarea.scrollTop;
    });

    update();
}

const lineNumbers = document.getElementById("lineNumbers");
initLineNumbers(codeBox, lineNumbers);
