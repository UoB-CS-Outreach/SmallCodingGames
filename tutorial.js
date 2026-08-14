/*
 * Contextual tutorials for the maze activity.
 *
 * This file deliberately contains only the teaching layer. The maze and Python
 * execution continue to be managed by maze.js.
 */

const tutorialDefinitions = {
    programming: {
        label: "Introduction to programming",
        steps: [
            {
                target: "#mazeCanvas",
                title: "Maze objective",
                body: `
                    <p>Move the blue triangle from the top-left starting square to
                    the green square near the bottom right.</p>
                    <p>You will write instructions in the Python editor. The
                    triangle starts by facing right.</p>
                `,
            },
            {
                target: "#code",
                title: "Run a command",
                body: `
                    <p><code>move()</code> tells the triangle to move forward by one
                    square.</p>
                    <p>Enter it in the editor, or use the button below to insert the
                    example.</p>
                `,
                code: "move()",
            },
            {
                target: "#runBtn",
                title: "Run the program",
                body: `
                    <p>Select <strong>Run program</strong>. Python reads the commands
                    from top to bottom and the triangle should move one square.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The triangle did not move. Check that the editor contains move() and try again.",
            },
            {
                target: "#code",
                title: "Turn and move",
                body: `
                    <p>Each command is placed on its own line. This program turns
                    right, then moves forward twice.</p>
                    <p>Each run starts the triangle from its original position.</p>
                `,
                code: "turn_right()\nmove()\nmove()",
            },
            {
                target: "#runBtn",
                title: "Run the sequence",
                body: `
                    <p>Run the program and check that the commands happen in the
                    order in which they are written.</p>
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
                target: "#code",
                title: "Check before moving",
                body: `
                    <p>An <code>if</code> statement chooses an instruction based on a
                    condition. <code>path_ahead()</code> is true when the square in
                    front is open.</p>
                    <p>The indented lines belong to the <code>if</code> and
                    <code>else</code> sections.</p>
                `,
                code: "if path_ahead():\n    move()\nelse:\n    turn_right()",
            },
            {
                target: "#runBtn",
                title: "Run the condition",
                body: `
                    <p>Run the program. The path starts open, so Python should use
                    the indented <code>move()</code> instruction.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 1,
                failure: "The condition did not complete successfully. Check the colons and indentation, then try again.",
            },
            {
                target: "#code",
                title: "Repeat an instruction",
                body: `
                    <p>A <code>while</code> loop repeats its indented instructions
                    while a condition is true.</p>
                    <p>This example moves forward until the triangle reaches a wall.</p>
                `,
                code: "while path_ahead():\n    move()",
            },
            {
                target: "#runBtn",
                title: "Run the loop",
                body: `
                    <p>Run the program. The triangle should move several squares and
                    stop before the wall.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 3,
                failure: "The loop did not move to the first wall. Check the indentation and try again.",
            },
            {
                target: "#referenceTabs",
                title: "Continue independently",
                body: `
                    <p>To solve the complete maze, combine a
                    <code>while not at_goal():</code> loop with the path checks,
                    movement commands and turns.</p>
                    <p>The tutorial will now close and a new maze will be generated.
                    Continue in the editor without tutorial prompts and use the
                    reference information below when needed.</p>
                `,
                final: true,
            },
        ],
    },
    python: {
        label: "Introduction to Python",
        steps: [
            {
                target: "#mazeCanvas",
                title: "Maze objective",
                body: `
                    <p>Write a Python program that moves the blue triangle from the
                    top-left starting square to the green goal square.</p>
                    <p>The triangle starts facing right, and each run resets its
                    position.</p>
                `,
            },
            {
                target: "#code",
                title: "Python block syntax",
                body: `
                    <p>Python ends conditions with a colon and uses indentation
                    instead of braces to define a block.</p>
                    <p>This loop moves forward until the path is blocked.</p>
                `,
                code: "while path_ahead():\n    move()\n\nprint(\"Stopped before the wall\")",
            },
            {
                target: "#runBtn",
                title: "Run the example",
                body: `
                    <p>Run the program. Movement is shown on the maze, and
                    <code>print()</code> output appears in the Output panel.</p>
                `,
                requiresRun: true,
                validate: result => !result.hadError && countActions(result, "move") >= 3,
                failure: "The example did not complete successfully. Check the colon and indentation, then try again.",
            },
            {
                target: "#referenceTabs",
                title: "Continue independently",
                body: `
                    <p>Use <code>move()</code>, <code>turn_left()</code> and
                    <code>turn_right()</code> to act. Use the four
                    <code>path_...()</code> functions to inspect adjacent squares and
                    <code>at_goal()</code> to stop.</p>
                    <p>The tutorial will now close and a new maze will be generated.
                    The full API and examples remain available in the reference
                    information below.</p>
                `,
                final: true,
            },
        ],
    },
    instructions: {
        label: "Instructions only",
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
                title: "Available functions",
                body: `
                    <ul>
                        <li>Act: <code>move()</code>, <code>turn_left()</code>,
                        <code>turn_right()</code></li>
                        <li>Inspect: <code>path_ahead()</code>,
                        <code>path_behind()</code>, <code>path_left()</code>,
                        <code>path_right()</code></li>
                        <li>Finish condition: <code>at_goal()</code></li>
                    </ul>
                    <p>Errors and printed text appear in the Output panel. Finishing
                    these instructions generates a new maze for independent use.
                    The full reference remains available below.</p>
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
const stepCount = document.getElementById("tutorialStepCount");
const stepTitle = document.getElementById("tutorialStepTitle");
const stepBody = document.getElementById("tutorialStepBody");
const feedback = document.getElementById("tutorialFeedback");
const insertCodeButton = document.getElementById("tutorialInsertCodeBtn");
const closeTutorialButton = document.getElementById("tutorialCloseBtn");
const backButton = document.getElementById("tutorialBackBtn");
const nextButton = document.getElementById("tutorialNextBtn");
const restartButton = document.getElementById("restartTutorialBtn");
const changeButton = document.getElementById("changeTutorialBtn");

let currentMode = null;
let currentStepIndex = 0;
let tutorialIsOpen = false;
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

function hideCoachmark() {
    clearHighlight();
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

    let top;
    if (availableBelow >= cardRect.height + margin) {
        top = targetRect.bottom + margin;
    } else {
        top = Math.max(margin, targetRect.top - cardRect.height - margin);
    }

    const idealLeft = targetRect.left + (targetRect.width - cardRect.width) / 2;
    const left = Math.max(
        margin,
        Math.min(idealLeft, window.innerWidth - cardRect.width - margin),
    );

    coachmark.style.top = `${top}px`;
    coachmark.style.left = `${left}px`;
}

function renderStep() {
    const tutorial = currentTutorial();
    const step = currentStep();
    if (!tutorial || !step) return;

    hideCoachmark();

    highlightedElement = document.querySelector(step.target);
    if (!highlightedElement) {
        finishTutorial();
        return;
    }

    highlightedElement.scrollIntoView({block: "center", inline: "nearest"});
    highlightedElement.classList.add("tutorial-highlight");

    stepCount.textContent = `${tutorial.label} · ${currentStepIndex + 1} of ${tutorial.steps.length}`;
    stepTitle.textContent = step.title;
    stepBody.innerHTML = step.body;
    setFeedback(step.requiresRun ? "Run the program to complete this step." : "");

    insertCodeButton.hidden = !step.code;
    insertCodeButton.textContent = "Replace editor with example";
    backButton.disabled = currentStepIndex === 0;
    nextButton.disabled = Boolean(step.requiresRun);
    nextButton.textContent = step.final ? "Finish tutorial" : "Continue";

    backdrop.hidden = false;
    coachmark.hidden = false;
    tutorialIsOpen = true;
    updateStatus();

    window.addEventListener("resize", positionCoachmark);
    window.addEventListener("scroll", positionCoachmark, true);
    requestAnimationFrame(() => {
        positionCoachmark();
        coachmark.focus({preventScroll: true});
    });
}

function startTutorial(mode) {
    if (!tutorialDefinitions[mode]) return;

    currentMode = mode;
    currentStepIndex = 0;
    tutorialIsOpen = true;
    toolbar.hidden = false;
    document.dispatchEvent(new CustomEvent("tutorial:start", {detail: {mode}}));
    renderStep();
}

function finishTutorial(completed = false) {
    tutorialIsOpen = false;
    hideCoachmark();
    updateStatus(true);

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
    resumeAfterSelector = tutorialIsOpen;
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
        "Close the tutorial guidance? You can restart it from the top of the page.",
    );
    if (shouldClose) finishTutorial();
});

restartButton.addEventListener("click", () => {
    if (currentMode) startTutorial(currentMode);
});

changeButton.addEventListener("click", openSelector);

document.addEventListener("maze:run-start", () => {
    const step = currentStep();
    if (!tutorialIsOpen || !step?.requiresRun) return;
    nextButton.disabled = true;
    setFeedback("Program running…");
});

document.addEventListener("maze:run-complete", event => {
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

openSelector();
