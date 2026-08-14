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

const MAZE_LEVELS = {
    tutorial: {
        label: "Tutorial maze",
        url: "mazes/default.txt",
        rows: 11,
        columns: 11,
        style: "perfect",
    },
    easy: {
        label: "Easy",
        url: "mazes/easy_winding.txt",
        rows: 11,
        columns: 15,
        style: "perfect",
    },
    medium: {
        label: "Medium",
        url: "mazes/medium_crossroads.txt",
        rows: 15,
        columns: 19,
        style: "perfect",
    },
    hard: {
        label: "Hard",
        url: "mazes/hard_switchbacks.txt",
        rows: 19,
        columns: 25,
        style: "perfect",
    },
    expert: {
        label: "Loops and islands",
        url: "mazes/expert_archipelago.txt",
        rows: 21,
        columns: 29,
        style: "braided",
        braid: 0.38,
    },
    random: {
        label: "Random blocks",
        url: "mazes/blocks_test.txt",
        rows: 15,
        columns: 19,
        style: "blocks",
        blockDensity: 0.42,
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

    for (let index = 0; index < queue.length; index++) {
        const [row, column] = queue[index];
        if (row === goal[0] && column === goal[1]) {
            return {start, goal};
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
                queue.push([nextRow, nextColumn]);
            }
        }
    }

    throw new Error("Maze has no route from start to goal");
}

function applyMaze(nextMaze) {
    const {start, goal} = validateMaze(nextMaze);
    maze = nextMaze;
    numRows = maze.length;
    numCols = maze[0].length;
    [startRow, startCol] = start;
    [goalRow, goalCol] = goal;

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
  Resize the canvas to the maze's aspect ratio, then compute the cell size.
  This keeps the largest dimension at 480px without leaving unused bands
  above/below or beside rectangular mazes.
*/
const MAX_MAZE_CANVAS_SIZE = 480;
let cellSize;
let offsetX;
let offsetY;

function updateMazeGeometry() {
    const scale = Math.min(
        MAX_MAZE_CANVAS_SIZE / numCols,
        MAX_MAZE_CANVAS_SIZE / numRows,
    );

    canvas.width = Math.max(1, Math.round(numCols * scale));
    canvas.height = Math.max(1, Math.round(numRows * scale));
    cellSize = Math.min(canvas.width / numCols, canvas.height / numRows);
    offsetX = (canvas.width - numCols * cellSize) / 2;
    offsetY = (canvas.height - numRows * cellSize) / 2;
}

updateMazeGeometry();

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const ch = maze[r][c];
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;

            ctx.fillStyle = (ch === "#") ? "#333333" : "#ffffff";
            ctx.fillRect(x, y, cellSize, cellSize);

            // Highlight the goal cell
            if (r === goalRow && c === goalCol) {
                ctx.fillStyle = "#b2f2b2";
                ctx.fillRect(x, y, cellSize, cellSize);
            }

            // Light grid lines
            ctx.strokeStyle = "#aaaaaa";
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }

    drawPlayer(visRow, visCol, visDir);
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
    drawMaze();

    for (const action of actionQueue) {
        if (runId !== runCounter) return; // cancelled

        if (action.type === "move") {
            [visRow, visCol] = stepForward(visRow, visCol, visDir);
        } else if (action.type === "turnLeft") {
            visDir = (visDir + 3) % 4;
        } else if (action.type === "turnRight") {
            visDir = (visDir + 1) % 4;
        }

        drawMaze();
        const delay = getActionDelay(speedInput, actionQueue.length);
        await sleep(delay);
    }
}

let pyodide;
let pythonReady = false;
let runCounter = 0;
let tutorialAnimationActive = false;

const TUTORIAL_TARGET_ACTION_DELAY_MS = 1000;
const TUTORIAL_EXTRA_DELAY_BUDGET_MS = 10000;

function getActionDelay(speedInput, actionCount) {
    const raw = parseInt(speedInput.value, 10);
    const min = parseInt(speedInput.min, 10);
    const max = parseInt(speedInput.max, 10);
    const normalDelay = (max + min) - raw;

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

        pyodide.globals.set("PMG_GENERATED_ROWS", config.rows);
        pyodide.globals.set("PMG_GENERATED_COLUMNS", config.columns);
        pyodide.globals.set("PMG_GENERATED_STYLE", config.style);
        pyodide.globals.set("PMG_GENERATED_BRAID", config.braid ?? 0.15);
        pyodide.globals.set(
            "PMG_GENERATED_BLOCK_DENSITY",
            config.blockDensity ?? 0.32,
        );
        const generatedText = await pyodide.runPythonAsync(`
PMG_MAZE_GENERATOR.maze_to_text(
    PMG_MAZE_GENERATOR.generate_maze(
        PMG_GENERATED_ROWS,
        PMG_GENERATED_COLUMNS,
        style=PMG_GENERATED_STYLE,
        braid=PMG_GENERATED_BRAID,
        block_density=PMG_GENERATED_BLOCK_DENSITY,
    )
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
        pyodide.globals.set("PMG_SRC", code);
        pyodide.globals.set("PMG_MAX_SECONDS", 5);
        pyodide.globals.set("PMG_MAX_STEPS", 50000);

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
        appendOutput("Reached goal!");
    } else if (!hadError) {
        appendOutput("Program finished without reaching goal.");
    }

    document.dispatchEvent(new CustomEvent("maze:run-complete", {
        detail: {
            runId: thisRun,
            reached,
            hadError,
            actions: actionTypes
        }
    }));
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

// Sample button restores the sample code
document.getElementById("sampleBtn").addEventListener("click", async () => {
  const code = document.getElementById("code");

  const ok = window.confirm(
    "Load sample code?\n\nThis will overwrite the current contents of the code box."
  );
  if (!ok) return;

  const txt = await fetch("samples/default.txt");
  code.value = await txt.text();
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

globalThis.mazeGame = {
    loadPreset: loadPresetMaze,
    generate: generateNewMaze,
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
