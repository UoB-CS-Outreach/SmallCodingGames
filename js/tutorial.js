/*
 * Contextual tutorials for the maze activity.
 *
 * This file deliberately contains only the teaching layer. The maze and Python
 * execution continue to be managed by maze.js.
 */

const RIGHT_HAND_ROUND = "if path_right():\n    turn_right()\n    move()\nelif path_ahead():\n    move()\nelse:\n    turn_left()";

const RIGHT_HAND_SOLVER = "while not at_goal():\n    if path_right():\n        turn_right()\n        move()\n    elif path_ahead():\n        move()\n    else:\n        turn_left()";

const tutorialDefinitions = {
    programming: {
        label: "New to coding",
        steps: [
            {
                target: "#runBtn",
                title: "Make something move",
                body: `
                    <p>There is already a short program in the editor.</p>
                    <p>Press <strong>Run program</strong> and watch the blue
                    triangle.</p>
                    <p>Greyed out? Python is still loading.</p>
                `,
                code: "move()\nmove()\nmove()",
                autoInsert: true,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The triangle did not move. Put move() back in the editor, one per line, and press Run program again.",
            },
            {
                target: "#code",
                title: "That was a program",
                body: `
                    <p>Three instructions. The computer obeyed them exactly, in
                    order, top to bottom.</p>
                    <p><code>move()</code> is a <strong>function</strong>: a job with
                    a name. The brackets mean <em>do it now</em>.</p>
                `,
            },
            {
                target: "#buttons",
                title: "Run, reset, speed",
                body: `
                    <p><strong>Run program</strong> always starts again from the
                    beginning, so you cannot break anything.</p>
                    <p><strong>Reset position</strong> stops an animation.
                    <strong>Speed</strong> changes only how fast it is drawn.</p>
                `,
            },
            {
                target: "#code",
                title: "Turn as well as move",
                body: `
                    <p><code>turn_right()</code> and <code>turn_left()</code> turn on
                    the spot without moving.</p>
                    <p><code>print()</code> puts a message in Output. A line starting
                    with <code>#</code> is a note for humans; Python skips it.</p>
                `,
                code: "# Turn right, then move twice\nturn_right()\nmove()\nmove()\nprint(\"Done\")",
            },
            {
                target: "#runBtn",
                title: "Run the sequence",
                body: `
                    <p>Press <strong>Run program</strong>. The triangle should turn
                    downwards, move two squares, and print your message.</p>
                `,
                requiresRun: true,
                validate: result => (
                    !result.hadError &&
                    result.actions.includes("turnRight") &&
                    countActions(result, "move") >= 2
                ),
                failure: "That did not turn and then move twice. Insert the example again and press Run program.",
            },
            {
                target: "#output",
                title: "Python talks back here",
                body: `
                    <p>Output shows your <code>print()</code> messages, whether you
                    reached the goal, and any error.</p>
                    <p>You never type here. When something breaks, read the last line,
                    fix the editor, run again.</p>
                `,
            },
            {
                target: "#code",
                title: "Ask the maze a question",
                body: `
                    <p><code>path_ahead()</code> asks: is the next square open? The
                    answer is <code>True</code> or <code>False</code>.</p>
                    <p><code>if</code> takes the first block, <code>else</code> the
                    other. The four spaces show which lines belong to which
                    choice.</p>
                `,
                code: "if path_ahead():\n    move()\nelse:\n    turn_right()",
            },
            {
                target: "#runBtn",
                title: "Run the decision",
                body: `
                    <p>The way ahead is open, so the answer is <code>True</code> and
                    the triangle moves.</p>
                    <p>If Python complains, check the colon and the spaces.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "That did not finish cleanly. Check the colons and the four-space indents, then run it again.",
            },
            {
                target: "#code",
                title: "Repeat with while",
                body: `
                    <p><code>while</code> repeats its indented block for as long as
                    the answer stays <code>True</code>.</p>
                    <p>Two lines, many moves. You never say how many.</p>
                `,
                code: "while path_ahead():\n    move()",
            },
            {
                target: "#runBtn",
                title: "Run the loop",
                body: `
                    <p>Press <strong>Run program</strong>. The triangle runs down the
                    corridor and stops itself at the wall.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 3,
                failure: "The loop did not reach the wall. Insert the example again, check the indent, and run it.",
            },
            {
                target: "#runBtn",
                title: "Keep one hand on the wall",
                body: `
                    <p>A rule that works in a real maze: <strong>turn right if you
                    can; otherwise go straight; otherwise turn left.</strong></p>
                    <p><code>elif</code> means "otherwise, if" — Python takes the
                    first branch that fits. Run one round.</p>
                `,
                code: RIGHT_HAND_ROUND,
                requiresRun: true,
                validate: result => (
                    !result.hadError &&
                    result.actions.includes("turnRight") &&
                    countActions(result, "move") >= 1
                ),
                failure: "Expected a right turn and a move. Insert the example again and press Run program.",
            },
            {
                target: "#runBtn",
                title: "Solve the whole maze",
                body: `
                    <p><code>at_goal()</code> is <code>True</code> only on the green
                    square, and <code>not</code> flips it. So this repeats the rule
                    until you arrive.</p>
                    <p>Insert it, press <strong>Run program</strong> and watch.</p>
                `,
                code: RIGHT_HAND_SOLVER,
                requiresRun: true,
                validate: result => !result.hadError && result.reached === true,
                failure: "Not on the green square yet. Insert the example again, keeping the rule indented inside the loop, and run it.",
            },
            {
                target: "#mazeControls",
                title: "You solved the maze",
                body: `
                    <p>Eight lines of Python did that on their own.</p>
                    <p>Now try to break it. Pick a harder maze from the
                    <strong>Maze</strong> menu, or <strong>Generate new maze</strong>.
                    Does your rule still work?</p>
                    <p>The <strong>Beginner Guide</strong> tab explains what to try
                    next.</p>
                `,
                final: true,
            },
        ],
    },
    python: {
        label: "New to Python",
        steps: [
            {
                target: "#runBtn",
                title: "The whole API",
                body: `
                    <p>Act with <code>move()</code>, <code>turn_left()</code>,
                    <code>turn_right()</code>. Ask with <code>path_ahead()</code>,
                    <code>path_left()</code>, <code>path_right()</code>,
                    <code>path_behind()</code>, <code>at_goal()</code>.</p>
                    <p>The questions return <code>True</code> or <code>False</code>
                    and change nothing. Everything is relative to the way the triangle
                    faces. Press <strong>Run program</strong>.</p>
                `,
                code: "print(path_ahead(), path_right(), at_goal())\nmove()",
                autoInsert: true,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "No movement was recorded. Restore the example and run it again.",
            },
            {
                target: "#output",
                title: "Output and errors",
                body: `
                    <p>Output holds <code>print()</code> text, the final maze status
                    and the traceback. Read the last line first.</p>
                    <p>Every run clears Output and returns the triangle to the top-left
                    start facing right, so runs are repeatable.</p>
                `,
            },
            {
                target: "#code",
                title: "Python, not C or Java",
                body: `
                    <p>No braces, no semicolons. A colon opens a block and
                    <strong>indentation is the syntax</strong> — four spaces here, and
                    Tab inserts them.</p>
                    <p><code>True</code> and <code>False</code> are capitalised. Use
                    <code>and</code>, <code>or</code>, <code>not</code> rather than
                    <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>. Names are
                    <code>snake_case</code>.</p>
                `,
            },
            {
                target: "#code",
                title: "if / elif / else",
                body: `
                    <p><code>elif</code> is "else if". Python tests the branches in
                    order and runs exactly one.</p>
                    <p>Insert this and run it. The right-hand path is open at the
                    start, so the first branch wins.</p>
                `,
                code: RIGHT_HAND_ROUND,
                requiresRun: true,
                validate: result => (
                    !result.hadError &&
                    result.actions.includes("turnRight") &&
                    countActions(result, "move") >= 1
                ),
                failure: "Expected a right turn then a move. Restore the example, check the indentation, and run it again.",
            },
            {
                target: "#code",
                title: "while not at_goal()",
                body: `
                    <p><code>not</code> inverts a Boolean, so this loop repeats until
                    the triangle stands on the goal.</p>
                    <p>The same three branches, repeated, are the right-hand wall
                    follower. Run it and the maze is solved.</p>
                `,
                code: RIGHT_HAND_SOLVER,
                requiresRun: true,
                validate: result => !result.hadError && result.reached === true,
                failure: "The triangle did not finish on the goal. Restore the example and check the indentation inside the loop.",
            },
            {
                target: "#mazeControls",
                title: "Solved — now break it",
                body: `
                    <p>Wall following works here because Easy and Medium mazes have no
                    loops. Hard and Expert do.</p>
                    <p>Use the <strong>Maze</strong> menu or <strong>Generate new
                    maze</strong> to find a layout that defeats it, then work out what
                    a solver would have to remember. The <strong>Beginner Guide</strong>
                    tab covers exactly where it breaks.</p>
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
                    <p>Move the blue triangle from the top-left start to the green
                    goal square. It starts facing right, and every run resets its
                    position.</p>
                `,
            },
            {
                target: "#code",
                title: "Write code here",
                body: `
                    <p>Write or paste your Python here. The line numbers help you
                    match an error to a line.</p>
                    <ul>
                        <li>Act: <code>move()</code>, <code>turn_left()</code>,
                        <code>turn_right()</code></li>
                        <li>Inspect: <code>path_ahead()</code>,
                        <code>path_behind()</code>, <code>path_left()</code>,
                        <code>path_right()</code></li>
                        <li>Finish condition: <code>at_goal()</code></li>
                    </ul>
                    <p><strong>Load sample</strong>, below the editor, replaces the
                    contents with a complete solver.</p>
                `,
            },
            {
                target: "#buttons",
                title: "Run, reset and adjust speed",
                body: `
                    <p><strong>Run program</strong> resets the triangle to the start,
                    then runs the whole code box. <strong>Reset position</strong> stops
                    the current animation.</p>
                    <p>The <strong>Speed</strong> slider controls only the animation
                    rate.</p>
                `,
            },
            {
                target: "#output",
                title: "Check output and errors",
                body: `
                    <p>The Output box is read-only. It shows <code>print()</code>
                    text, whether the goal was reached, and any Python error.</p>
                    <p>If a run fails, read the final line here before changing the
                    code.</p>
                `,
            },
            {
                target: "#referenceTabs",
                title: "Use the help tabs",
                body: `
                    <p><strong>Maze API &amp; Help</strong> is the concise function and
                    error reference. <strong>Beginner Guide</strong> builds a solver
                    step by step.</p>
                    <p>The panel scrolls, so both stay available while you work.</p>
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
let closeConfirmPending = false;

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
    const target = highlightedElement.getBoundingClientRect();
    const card = coachmark.getBoundingClientRect();
    const centredX = target.left + (target.width - card.width) / 2;
    const centredY = target.top + (target.height - card.height) / 2;

    /* Below, above, right, left: where the card would go and the room there. */
    const placements = [
        {
            top: target.bottom + margin,
            left: centredX,
            room: window.innerHeight - target.bottom,
            needed: card.height + margin,
        },
        {
            top: target.top - card.height - margin,
            left: centredX,
            room: target.top,
            needed: card.height + margin,
        },
        {
            top: centredY,
            left: target.right + margin,
            room: window.innerWidth - target.right,
            needed: card.width + margin,
        },
        {
            top: centredY,
            left: target.left - card.width - margin,
            room: target.left,
            needed: card.width + margin,
        },
    ];

    // Prefer the first side the card fits on; otherwise take whichever side
    // is least cramped, so the card is never dropped straight on top of the
    // control it is pointing at.
    const choice =
        placements.find(placement => placement.room >= placement.needed) ||
        placements.reduce((best, placement) =>
            placement.room - placement.needed > best.room - best.needed
                ? placement
                : best,
        );

    const clamp = (value, limit) => Math.max(margin, Math.min(value, limit));
    coachmark.style.top =
        `${clamp(choice.top, window.innerHeight - card.height - margin)}px`;
    coachmark.style.left =
        `${clamp(choice.left, window.innerWidth - card.width - margin)}px`;
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
    /*
      Position immediately, then again once scrolling and layout have settled:
      scrollIntoView() above may still be moving the page, and the card's
      height depends on this step's content. Measuring only once leaves the
      card on stale geometry, which is how it ends up sitting on top of the
      control it is pointing at.

      Deliberately not driven by requestAnimationFrame alone: a browser does
      not run animation frames for a page in a background tab, so a learner
      who switches tabs mid-tutorial would come back to a card that never
      moved again.
    */
    positionCoachmark();
    coachmark.focus({preventScroll: true});
    setTimeout(positionCoachmark, 0);
    setTimeout(positionCoachmark, 160);
}

function renderStep() {
    const tutorial = currentTutorial();
    const step = currentStep();
    if (!tutorial || !step) return;

    hideCoachmark();
    resetCloseConfirmation();

    stepCount.textContent = `${tutorial.label} · ${currentStepIndex + 1} of ${tutorial.steps.length}`;
    stepTitle.textContent = step.title;
    stepBody.innerHTML = step.body;
    setFeedback(step.requiresRun ? "Run the program to complete this step." : "");

    insertCodeButton.hidden = !step.code;
    insertCodeButton.textContent = "Replace editor with example";

    // Some steps put their example into the editor for the learner, so that the
    // very first thing they do is run a working program rather than type one.
    if (step.code && step.autoInsert) {
        const editor = document.getElementById("code");
        editor.value = step.code;
        editor.dispatchEvent(new Event("input"));
    }

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

/*
  Closing asks for a second click rather than opening a browser confirm()
  dialog: the dialog is easy to dismiss by accident, it looks nothing like the
  rest of the activity, and some browser setups suppress it altogether, which
  would make the button appear broken.
*/
function resetCloseConfirmation() {
    if (!closeConfirmPending) return;
    closeConfirmPending = false;
    closeTutorialButton.textContent = "Close tutorial";
}

closeTutorialButton.addEventListener("click", () => {
    if (!closeConfirmPending) {
        closeConfirmPending = true;
        closeTutorialButton.textContent = "Yes, close it";
        setFeedback(
            "Close the guidance? You can restart it from the toolbar below.",
        );
        return;
    }

    resetCloseConfirmation();
    finishTutorial();
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
