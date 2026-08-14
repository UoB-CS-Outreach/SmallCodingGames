/*
 * Contextual tutorials for the maze activity.
 *
 * This file deliberately contains only the teaching layer. The maze and Python
 * execution continue to be managed by maze.js.
 */

const tutorialDefinitions = {
    programming: {
        label: "New to coding",
        steps: [
            {
                target: "#mazeCanvas",
                title: "A program is a set of instructions",
                body: `
                    <p>Your goal is to move the blue triangle from its starting
                    square to the green goal square.</p>
                    <p>A computer follows instructions exactly. You will write those
                    instructions as a <strong>program</strong> in the Python editor.
                    The triangle starts by facing right.</p>
                `,
            },
            {
                target: "#code",
                title: "Your first Python command",
                body: `
                    <p><code>move()</code> tells the triangle to move forward one
                    square. A named instruction like this is called a
                    <strong>function</strong>; the parentheses tell Python to run it.</p>
                    <p>Python needs the spelling and punctuation to be exact. Enter
                    the command, or insert the example below.</p>
                `,
                code: "move()",
            },
            {
                target: "#runBtn",
                title: "Run the program",
                body: `
                    <p>Select <strong>Run program</strong>. Python reads the editor
                    from top to bottom. The triangle should move one square.</p>
                    <p>Every run starts the triangle at the beginning, so it is safe
                    to experiment.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The triangle did not move. Check that the editor contains move() and try again.",
            },
            {
                target: "#buttons",
                title: "Controls for experimenting",
                body: `
                    <p><strong>Run program</strong> starts again from the maze's
                    starting square and executes everything in the editor.</p>
                    <p><strong>Reset position</strong> stops an animation and returns
                    the triangle to the start. The <strong>Speed</strong> slider changes
                    only the animation speed, not what the program does.</p>
                `,
            },
            {
                target: "#code",
                title: "Commands run in order",
                body: `
                    <p>Put each command on its own line. Python runs the first line,
                    then the next. Lines beginning with <code>#</code> are notes for
                    people, called <strong>comments</strong>.</p>
                    <p><code>print()</code> writes a message in the Output panel but
                    does not move the triangle.</p>
                `,
                code: "# Python reads from top to bottom\nturn_right()\nmove()\nmove()\nprint(\"Sequence finished\")",
            },
            {
                target: "#runBtn",
                title: "Run the sequence",
                body: `
                    <p>Run the program. Check that the triangle turns, moves twice,
                    and that the printed message appears in Output.</p>
                `,
                requiresRun: true,
                validate: result => (
                    !result.hadError &&
                    result.actions.includes("turnRight") &&
                    countActions(result, "move") >= 2
                ),
                failure: "The expected turn and two movements were not completed. Restore the example and try again.",
            },
            {
                target: "#output",
                title: "Read the output",
                body: `
                    <p>The Output box shows text from <code>print()</code>, useful
                    messages about the result, and any Python errors.</p>
                    <p>You do not type here. If something goes wrong, read the final
                    line, correct the code in the editor, and run it again.</p>
                `,
            },
            {
                target: "#code",
                title: "Make a decision with if",
                body: `
                    <p><code>path_ahead()</code> asks a question and gives the answer
                    <code>True</code> or <code>False</code>. An <code>if</code>
                    statement uses that answer to choose what to do.</p>
                    <p>The colon starts a block. The four spaces before
                    <code>move()</code> and <code>turn_right()</code> show which
                    instructions belong to each choice.</p>
                `,
                code: "if path_ahead():\n    move()\nelse:\n    turn_right()",
            },
            {
                target: "#runBtn",
                title: "Run the condition",
                body: `
                    <p>The starting path is open, so the question is
                    <code>True</code> and Python should run <code>move()</code>.</p>
                    <p>If Python reports an error, compare the colon and spaces with
                    the example.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The condition did not complete successfully. Check the colons and indentation, then try again.",
            },
            {
                target: "#code",
                title: "Repeat with while",
                body: `
                    <p>A <code>while</code> loop repeats its indented instructions
                    while a condition is true.</p>
                    <p>This program keeps asking whether the path is open. It moves
                    while the answer is <code>True</code>, then stops before the wall.</p>
                `,
                code: "while path_ahead():\n    move()",
            },
            {
                target: "#runBtn",
                title: "Run the loop",
                body: `
                    <p>Run the program. One short loop should make the triangle move
                    several squares and stop safely before the wall.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 3,
                failure: "The loop did not move to the first wall. Check the indentation and try again.",
            },
            {
                target: "#mazeControls",
                title: "Choose what comes next",
                body: `
                    <p>You now know the central Python ideas for this activity:
                    function calls, top-to-bottom order, comments, output, decisions
                    and loops.</p>
                    <p>To solve the maze, combine
                    <code>while not at_goal():</code> with the path questions,
                    movement commands and turns. The <strong>Beginner Guide</strong>
                    below builds this up one stage at a time.</p>
                    <p>The tutorial maze will remain loaded when this guidance
                    closes. Keep working on it, or use the <strong>Maze</strong>
                    menu to load another difficulty or special type.</p>
                `,
                final: true,
            },
        ],
    },
    python: {
        label: "New to Python",
        steps: [
            {
                target: "#mazeCanvas",
                title: "The task and program state",
                body: `
                    <p>Write a Python program that moves the blue triangle from the
                    top-left starting square to the green goal square.</p>
                    <p>The triangle starts facing right. Each run resets its position
                    and direction before executing your code from top to bottom.</p>
                `,
            },
            {
                target: "#code",
                title: "Calls, comments and output",
                body: `
                    <p>Call a function with parentheses, such as
                    <code>move()</code>. A line beginning with <code>#</code> is a
                    comment, and <code>print()</code> writes to the Output panel.</p>
                `,
                code: "# Function calls use parentheses\nmove()\nprint(\"Moved one square\")",
            },
            {
                target: "#runBtn",
                title: "Run the first example",
                body: `
                    <p>Run the program. The maze shows the function's effect, while
                    printed text and errors appear in Output.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The example did not move one square. Restore the example, check the parentheses and try again.",
            },
            {
                target: "#buttons",
                title: "Run, reset and speed",
                body: `
                    <p><strong>Run program</strong> resets the triangle and executes
                    the whole editor. <strong>Reset position</strong> stops an
                    animation without changing your code.</p>
                    <p>The <strong>Speed</strong> slider changes how quickly actions
                    are animated; it does not change Python's decisions.</p>
                `,
            },
            {
                target: "#output",
                title: "Output and errors",
                body: `
                    <p>This read-only box contains text from <code>print()</code>, the
                    final maze status, and Python errors.</p>
                    <p>When debugging, read the final error line first, edit the
                    Python Code box, and run the program again.</p>
                `,
            },
            {
                target: "#code",
                title: "Booleans and indented blocks",
                body: `
                    <p>The path functions return the Boolean values
                    <code>True</code> or <code>False</code>. Python starts a block with
                    a colon and groups it using consistent indentation rather than
                    braces.</p>
                    <p><code>elif</code> checks another condition only when earlier
                    conditions were false; <code>else</code> is the fallback.</p>
                `,
                code: "if path_right():\n    turn_right()\n    move()\nelif path_ahead():\n    move()\nelse:\n    turn_left()",
            },
            {
                target: "#runBtn",
                title: "Run the decision",
                body: `
                    <p>Run the program. Exactly one branch should be chosen. On the
                    tutorial maze, the right-hand path is open at the start.</p>
                `,
                requiresRun: true,
                validate: result => (
                    !result.hadError &&
                    result.actions.includes("turnRight") &&
                    countActions(result, "move") >= 1
                ),
                failure: "The expected right turn and movement did not complete. Check the colon and indentation, then try again.",
            },
            {
                target: "#code",
                title: "Repeat a block with while",
                body: `
                    <p>A <code>while</code> loop repeats its block for as long as its
                    condition is <code>True</code>. This one stops when the path ahead
                    becomes blocked.</p>
                `,
                code: "while path_ahead():\n    move()\n\nprint(\"Stopped before the wall\")",
            },
            {
                target: "#runBtn",
                title: "Run the loop",
                body: `
                    <p>Run the program. The triangle should move to the first wall,
                    then the line after the loop should print once.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 3,
                failure: "The loop did not reach the first wall. Check its colon and four-space indentation, then try again.",
            },
            {
                target: "#mazeControls",
                title: "Choose what comes next",
                body: `
                    <p>You have seen Python calls, comments, output, Boolean
                    conditions, <code>if</code>/<code>elif</code>/<code>else</code>,
                    indentation and <code>while</code> loops.</p>
                    <p>A complete solver commonly starts with
                    <code>while not at_goal():</code>. Use the
                    <strong>Beginner Guide</strong> for a staged solver or
                    <strong>Maze API &amp; Help</strong> for a concise function reference.</p>
                    <p>The tutorial maze will remain loaded. You can keep solving
                    it, use the <strong>Maze</strong> menu to load another type, or
                    select <strong>Generate new maze</strong> for a fresh layout.</p>
                `,
                final: true,
            },
        ],
    },
    instructions: {
        label: "Quick start",
        steps: [
            {
                target: "#mazeCanvas",
                title: "Maze objective",
                body: `
                    <p>Move the blue triangle from the top-left starting square to
                    the green goal square. It starts facing right, and every run
                    resets its position.</p>
                `,
            },
            {
                target: "#code",
                title: "Write code here",
                body: `
                    <p>The Python Code box is where you write or paste your program.
                    The line numbers help you match errors to the relevant line.</p>
                    <ul>
                        <li>Act: <code>move()</code>, <code>turn_left()</code>,
                        <code>turn_right()</code></li>
                        <li>Inspect: <code>path_ahead()</code>,
                        <code>path_behind()</code>, <code>path_left()</code>,
                        <code>path_right()</code></li>
                        <li>Finish condition: <code>at_goal()</code></li>
                    </ul>
                    <p><strong>Load sample</strong>, below the editor, replaces its
                    contents with a complete example solver.</p>
                `,
            },
            {
                target: "#buttons",
                title: "Run, reset and adjust speed",
                body: `
                    <p><strong>Run program</strong> resets the triangle to the start,
                    then executes the entire code box.</p>
                    <p><strong>Reset position</strong> stops the current animation.
                    The <strong>Speed</strong> slider controls only the animation rate.</p>
                `,
            },
            {
                target: "#output",
                title: "Check output and errors",
                body: `
                    <p>The Output box is read-only. It shows text produced by
                    <code>print()</code>, whether the goal was reached, and any Python
                    errors.</p>
                    <p>If a run fails, read the final line here before changing the
                    code and trying again.</p>
                `,
            },
            {
                target: "#referenceTabs",
                title: "Use the help tabs",
                body: `
                    <p><strong>Maze API &amp; Help</strong> is the concise function and
                    error reference. <strong>Beginner Guide</strong> builds a solver
                    step by step.</p>
                    <p>The panel scrolls, so the rest of each guide remains available
                    while you work.</p>
                `,
            },
            {
                target: "#mazeControls",
                title: "Choose or generate a maze",
                body: `
                    <p>The <strong>Maze</strong> menu loads a fixed difficulty or
                    special type. <strong>Generate new maze</strong> creates a fresh
                    layout for the selected type.</p>
                    <p>The tutorial maze stays loaded when this guidance closes, so
                    change it only when you are ready.</p>
                `,
                final: true,
            },
        ],
    },
};

const selector = document.getElementById("tutorialSelector");
const closeSelectorButton = document.getElementById("closeTutorialSelector");
const toolbar = document.getElementById("tutorialToolbar");
const status = document.getElementById("tutorialStatus");
const backdrop = document.getElementById("tutorialBackdrop");
const coachmark = document.getElementById("tutorialCoachmark");
const mazeCanvas = document.getElementById("mazeCanvas");
const stepCount = document.getElementById("tutorialStepCount");
const stepTitle = document.getElementById("tutorialStepTitle");
const stepBody = document.getElementById("tutorialStepBody");
const feedback = document.getElementById("tutorialFeedback");
const insertCodeButton = document.getElementById("tutorialInsertCodeBtn");
const closeTutorialButton = document.getElementById("tutorialCloseBtn");
const minimizeTutorialButton = document.getElementById("tutorialMinimizeBtn");
const backButton = document.getElementById("tutorialBackBtn");
const nextButton = document.getElementById("tutorialNextBtn");
const resumeButton = document.getElementById("resumeTutorialBtn");
const restartButton = document.getElementById("restartTutorialBtn");
const changeButton = document.getElementById("changeTutorialBtn");

let currentMode = null;
let currentStepIndex = 0;
let tutorialIsOpen = false;
let tutorialIsMinimized = false;
let highlightedElement = null;
let resumeAfterSelector = false;

function countActions(result, actionType) {
    return result.actions.filter(action => action === actionType).length;
}

function currentTutorial() {
    return currentMode ? tutorialDefinitions[currentMode] : null;
}

function currentStep() {
    const tutorial = currentTutorial();
    return tutorial ? tutorial.steps[currentStepIndex] : null;
}

function setFeedback(message, state = "") {
    feedback.textContent = message;
    feedback.hidden = !message;
    if (state) {
        feedback.dataset.state = state;
    } else {
        delete feedback.dataset.state;
    }
}

function clearHighlight() {
    if (highlightedElement) {
        highlightedElement.classList.remove("tutorial-highlight");
        highlightedElement = null;
    }
}

function clearRunningMazeHighlight() {
    mazeCanvas.classList.remove("tutorial-maze-running");
}

function hideCoachmark() {
    clearHighlight();
    clearRunningMazeHighlight();
    backdrop.hidden = true;
    coachmark.hidden = true;
    window.removeEventListener("resize", positionCoachmark);
    window.removeEventListener("scroll", positionCoachmark, true);
}

function updateStatus(completed = false) {
    const tutorial = currentTutorial();
    if (!tutorial) return;

    if (completed) {
        status.textContent = `${tutorial.label} — guidance closed; working independently`;
    } else if (tutorialIsMinimized) {
        status.textContent = `${tutorial.label} — minimized at ${currentStepIndex + 1} of ${tutorial.steps.length}`;
    } else {
        status.textContent = `${tutorial.label} — ${currentStepIndex + 1} of ${tutorial.steps.length}`;
    }
}

function positionCoachmark() {
    if (!highlightedElement || coachmark.hidden) return;

    if (window.matchMedia("(max-width: 600px)").matches) {
        coachmark.style.removeProperty("top");
        coachmark.style.removeProperty("left");
        return;
    }

    const margin = 14;
    const targetRect = highlightedElement.getBoundingClientRect();
    const cardRect = coachmark.getBoundingClientRect();
    const availableBelow = window.innerHeight - targetRect.bottom;
    const availableRight = window.innerWidth - targetRect.right;

    let top;
    let left;
    if (availableBelow >= cardRect.height + margin) {
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
    } else if (targetRect.top >= cardRect.height + margin) {
        top = targetRect.top - cardRect.height - margin;
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
    } else if (availableRight >= cardRect.width + margin) {
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        left = targetRect.right + margin;
    } else if (targetRect.left >= cardRect.width + margin) {
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        left = targetRect.left - cardRect.width - margin;
    } else {
        top = availableBelow >= targetRect.top
            ? targetRect.bottom + margin
            : targetRect.top - cardRect.height - margin;
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
    }

    top = Math.max(
        margin,
        Math.min(top, window.innerHeight - cardRect.height - margin),
    );
    left = Math.max(
        margin,
        Math.min(left, window.innerWidth - cardRect.width - margin),
    );

    coachmark.style.top = `${top}px`;
    coachmark.style.left = `${left}px`;
}

function showCoachmark() {
    const step = currentStep();
    if (!step) return;

    highlightedElement = document.querySelector(step.target);
    if (!highlightedElement) {
        finishTutorial();
        return;
    }

    const narrowScreen = window.matchMedia("(max-width: 600px)").matches;
    highlightedElement.scrollIntoView({
        block: narrowScreen ? "start" : "center",
        inline: "nearest",
    });
    highlightedElement.classList.add("tutorial-highlight");

    backdrop.hidden = false;
    coachmark.hidden = false;
    resumeButton.hidden = true;
    tutorialIsOpen = true;
    tutorialIsMinimized = false;
    updateStatus();

    window.addEventListener("resize", positionCoachmark);
    window.addEventListener("scroll", positionCoachmark, true);
    requestAnimationFrame(() => {
        positionCoachmark();
        coachmark.focus({preventScroll: true});
    });
}

function renderStep() {
    const tutorial = currentTutorial();
    const step = currentStep();
    if (!tutorial || !step) return;

    hideCoachmark();

    stepCount.textContent = `${tutorial.label} · ${currentStepIndex + 1} of ${tutorial.steps.length}`;
    stepTitle.textContent = step.title;
    stepBody.innerHTML = step.body;
    setFeedback(step.requiresRun ? "Run the program to complete this step." : "");

    insertCodeButton.hidden = !step.code;
    insertCodeButton.textContent = "Replace editor with example";
    backButton.disabled = currentStepIndex === 0;
    nextButton.disabled = Boolean(step.requiresRun);
    nextButton.textContent = step.final ? "Finish tutorial" : "Continue";

    showCoachmark();
}

function startTutorial(mode) {
    if (!tutorialDefinitions[mode]) return;

    currentMode = mode;
    currentStepIndex = 0;
    tutorialIsOpen = true;
    tutorialIsMinimized = false;
    resumeButton.hidden = true;
    toolbar.hidden = false;
    document.dispatchEvent(new CustomEvent("tutorial:start", {detail: {mode}}));
    renderStep();
}

function finishTutorial(completed = false) {
    tutorialIsOpen = false;
    tutorialIsMinimized = false;
    resumeButton.hidden = true;
    hideCoachmark();
    updateStatus(true);
    document.dispatchEvent(new CustomEvent("tutorial:end", {
        detail: {mode: currentMode, completed}
    }));

    if (completed) {
        document.dispatchEvent(new CustomEvent("tutorial:complete", {
            detail: {mode: currentMode}
        }));
    }

    const editor = document.getElementById("code");
    editor.scrollIntoView({block: "center"});
    editor.focus({preventScroll: true});
}

function openSelector() {
    resumeAfterSelector = tutorialIsOpen && !tutorialIsMinimized;
    hideCoachmark();
    closeSelectorButton.hidden = !currentMode;

    if (typeof selector.showModal === "function") {
        selector.showModal();
    } else {
        selector.setAttribute("open", "");
    }

    const selectedOption = currentMode
        ? selector.querySelector(`[data-tutorial-mode="${currentMode}"]`)
        : selector.querySelector("[data-tutorial-mode]");
    selectedOption?.focus();
}

function closeSelector() {
    if (typeof selector.close === "function") {
        selector.close();
    } else {
        selector.removeAttribute("open");
    }

    if (resumeAfterSelector) renderStep();
    resumeAfterSelector = false;
}

selector.querySelectorAll("[data-tutorial-mode]").forEach(option => {
    option.addEventListener("click", () => {
        const mode = option.dataset.tutorialMode;
        resumeAfterSelector = false;

        if (typeof selector.close === "function") {
            selector.close();
        } else {
            selector.removeAttribute("open");
        }

        startTutorial(mode);
    });
});

selector.addEventListener("cancel", event => {
    if (!currentMode) {
        event.preventDefault();
        return;
    }

    event.preventDefault();
    closeSelector();
});

closeSelectorButton.addEventListener("click", closeSelector);

insertCodeButton.addEventListener("click", () => {
    const step = currentStep();
    if (!step?.code) return;

    const editor = document.getElementById("code");
    editor.value = step.code;
    editor.dispatchEvent(new Event("input"));
    editor.focus();
});

backButton.addEventListener("click", () => {
    if (currentStepIndex === 0) return;
    currentStepIndex -= 1;
    renderStep();
});

nextButton.addEventListener("click", () => {
    const tutorial = currentTutorial();
    const step = currentStep();
    if (!tutorial || !step || nextButton.disabled) return;

    if (step.final || currentStepIndex >= tutorial.steps.length - 1) {
        finishTutorial(true);
        return;
    }

    currentStepIndex += 1;
    renderStep();
});

closeTutorialButton.addEventListener("click", () => {
    const shouldClose = window.confirm(
        "Close the tutorial guidance? You can restart it below the help tabs.",
    );
    if (shouldClose) finishTutorial();
});

minimizeTutorialButton.addEventListener("click", () => {
    if (!tutorialIsOpen) return;

    tutorialIsMinimized = true;
    hideCoachmark();
    resumeButton.hidden = false;
    updateStatus();
    resumeButton.focus({preventScroll: true});
});

resumeButton.addEventListener("click", () => {
    if (!tutorialIsOpen || !tutorialIsMinimized) return;
    showCoachmark();
});

restartButton.addEventListener("click", () => {
    if (currentMode) startTutorial(currentMode);
});

changeButton.addEventListener("click", openSelector);

document.addEventListener("maze:run-start", () => {
    const step = currentStep();
    if (!tutorialIsOpen || !step?.requiresRun) return;

    if (!tutorialIsMinimized) {
        mazeCanvas.classList.add("tutorial-maze-running");
    }
    nextButton.disabled = true;
    setFeedback("Program running…");
});

document.addEventListener("maze:run-complete", event => {
    clearRunningMazeHighlight();
    const step = currentStep();
    if (!tutorialIsOpen || !step?.requiresRun) return;

    const result = event.detail;
    const passed = step.validate ? step.validate(result) : !result.hadError;

    if (passed) {
        nextButton.disabled = false;
        setFeedback("Completed. Continue when you are ready.", "success");
    } else if (result.hadError) {
        setFeedback("The program stopped with an error. Review the Output panel, make a correction and run it again.", "error");
    } else {
        setFeedback(step.failure || "The expected result was not completed. Make a correction and try again.", "error");
    }

    positionCoachmark();
});

document.getElementById("resetBtn").addEventListener(
    "click",
    clearRunningMazeHighlight,
);

openSelector();
