/*
 * Challenge mode for the maze activity.
 *
 * A wall follower usually works the first time it is run, which is not the
 * same as being correct. Challenge mode runs the program that is currently in
 * the editor against forty freshly generated mazes — ten per difficulty — and
 * stops at the first maze it fails. On Hard and Expert that failure is the
 * point of the exercise, so the failing maze can be loaded into the main view
 * and watched.
 *
 * The maze, Python and drawing all stay in maze.js; everything here goes
 * through the globalThis.mazeGame bridge it publishes. The markup is built in
 * this file so index.html only has to load challenge.css and this script.
 *
 * Wrapped in a function because this is a classic script sharing the global
 * lexical scope with tutorial.js, and two top-level consts of the same name in
 * two classic scripts is a page-breaking error.
 */

(function () {
    "use strict";

    /*
      Ten mazes per difficulty, always seeds 1 to 10, so everyone in the room
      runs exactly the same set and a demonstrator can reproduce a failure by
      asking for that difficulty and seed again.
    */
    /*
      maxSteps is per maze, and is measured rather than guessed. A solver that
      remembers where it has been — the strategy these difficulties are meant
      to reward — solves all 25 mazes of every tier, and its worst run costs:

          Easy 5,227 · Medium 14,236 · Hard 26,979
          Expert 44,084 · Plaza 58,371 · Marathon 88,905 executed lines

      Exploring open ground and large mazes costs lines, so one budget for all
      six would fail correct programs on the bigger difficulties and teach
      exactly the wrong lesson. Each is set to roughly twice its measured
      worst case, leaving room for a less tidy but still correct program. A
      program going round in circles never finishes anyway, so a generous
      budget costs it nothing but a few milliseconds.
    */
    const TIERS = [
        {key: "easy", label: "Easy", maxSteps: 15000},
        {key: "medium", label: "Medium", maxSteps: 30000},
        {key: "hard", label: "Hard", maxSteps: 60000},
        {key: "expert", label: "Expert", maxSteps: 90000},
        {key: "plaza", label: "Plaza", maxSteps: 120000},
        {key: "marathon", label: "Marathon", maxSteps: 180000},
    ];
    /*
      Twenty-five mazes per difficulty, always seeds 1 to 25, so everyone in
      the room runs exactly the same set and a demonstrator can reproduce a
      failure by asking for that difficulty and seed again.

      Twenty-five rather than ten because ten is not enough to make the point:
      the taught right-hand solver happens to solve Hard seeds 1 to 10, so it
      only came unstuck on Expert. Over twenty-five it fails four Hard mazes,
      the first being seed 15, and twelve Expert ones. A strategy with no
      memory should not be able to pass this.
    */
    const SEEDS = Array.from({length: 25}, (unused, index) => index + 1);
    const TOTAL_MAZES = TIERS.length * SEEDS.length;

    /*
      Every per-maze budget above is measured rather than guessed. The taught
      right-hand solver needs at most 2,046 executed lines on Easy, 5,484 on
      Medium and 7,562 on the Hard and Expert mazes it can solve; a solver
      that remembers where it has been needs about 25,000 on a Plaza and
      100,000 on a Marathon. Anything tighter fails programs that are correct,
      which would teach the wrong lesson, while a program going in circles
      still hits the limit in milliseconds.

      The seconds limit is a second safety net for a program that loops
      without calling anything: Python itself is fast here, spending only
      ~60ms on a Marathon maze it solves.
    */
    const CHALLENGE_MAX_SECONDS = 3;

    const IDLE_STATUS =
        "Not run yet. Put your solver in the code editor, then start the " +
        "challenge.";

    const state = {
        running: false,
        stopRequested: false,
        failure: null,
        results: new Map(),
    };

    /* Filled in by buildPanel(). */
    const elements = {};

    /* Small helper so the markup below reads as a shape rather than as calls. */
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function buildTierRow(tier) {
        const row = createElement("li", "challenge-tier");
        row.dataset.tier = tier.key;

        row.appendChild(createElement("span", "challenge-tier-name", tier.label));

        /*
          The squares repeat what the row's result text already says. Forty
          separate announcements would drown the live region, so the squares
          are decorative and the text carries the meaning.
        */
        const cells = createElement("span", "challenge-tier-cells");
        cells.setAttribute("aria-hidden", "true");

        const cellElements = new Map();
        SEEDS.forEach(seed => {
            const cell = createElement("span", "challenge-cell", String(seed));
            cell.dataset.state = "pending";
            cell.title = `${tier.label} maze ${seed}: not run yet`;
            cells.appendChild(cell);
            cellElements.set(seed, cell);
        });
        row.appendChild(cells);

        const result = createElement("span", "challenge-tier-result", "Not run");
        row.appendChild(result);

        elements.tiers.set(tier.key, {row, cells: cellElements, result});
        return row;
    }

    function buildPanel() {
        const panel = createElement("section", "challenge-panel");
        panel.setAttribute("aria-labelledby", "challenge-title");

        const heading = createElement("h2", "challenge-heading", "Challenge mode");
        heading.id = "challenge-title";
        panel.appendChild(heading);

        panel.appendChild(createElement(
            "p",
            "challenge-intro",
            `Run the program in the editor against ${TOTAL_MAZES} new mazes: ` +
            `${SEEDS.length} each of ${TIERS.map(tier => tier.label).join(", ")}. ` +
            "It stops at the first maze your program cannot solve. Easy and " +
            "Medium are guaranteed for a right-hand wall follower; nothing " +
            "after them is. Par compares your moves with the shortest route.",
        ));

        const actions = createElement("div", "challenge-actions");
        elements.startButton = createElement(
            "button", "challenge-start", `Run challenge (${TOTAL_MAZES} mazes)`,
        );
        elements.startButton.type = "button";
        elements.startButton.disabled = true;
        elements.startButton.addEventListener("click", runChallenge);
        actions.appendChild(elements.startButton);

        elements.stopButton = createElement("button", "challenge-stop", "Stop");
        elements.stopButton.type = "button";
        elements.stopButton.hidden = true;
        elements.stopButton.addEventListener("click", () => {
            state.stopRequested = true;
        });
        actions.appendChild(elements.stopButton);

        elements.summary = createElement("p", "challenge-summary");
        elements.summary.hidden = true;
        actions.appendChild(elements.summary);
        panel.appendChild(actions);

        const progress = createElement("div", "challenge-progress");
        progress.setAttribute("role", "status");
        progress.setAttribute("aria-live", "polite");

        elements.status = createElement("p", "challenge-status", "Starting up…");
        progress.appendChild(elements.status);

        elements.tiers = new Map();
        const list = createElement("ol", "challenge-tier-list");
        TIERS.forEach(tier => list.appendChild(buildTierRow(tier)));
        progress.appendChild(list);
        panel.appendChild(progress);

        /*
          The failure card is the whole point of the feature: seeing the
          triangle circle a wall island forever teaches more than any number
          of passes, so it is deliberately loud.
        */
        elements.failure = createElement("div", "challenge-failure");
        elements.failure.hidden = true;
        elements.failureTitle = createElement("p", "challenge-failure-title");
        elements.failureText = createElement("p", "challenge-failure-text");
        elements.loadButton = createElement(
            "button", "challenge-load", "Load this maze and watch",
        );
        elements.loadButton.type = "button";
        elements.loadButton.addEventListener("click", loadFailingMaze);
        elements.failure.appendChild(elements.failureTitle);
        elements.failure.appendChild(elements.failureText);
        elements.failure.appendChild(elements.loadButton);
        panel.appendChild(elements.failure);

        panel.appendChild(createElement(
            "p",
            "challenge-note",
            "Challenge runs are not animated and print() output is hidden, so " +
            `that ${TOTAL_MAZES} mazes take seconds rather than minutes.`,
        ));

        return panel;
    }

    /*
      Mount into an existing #challenge-mode element if index.html provides
      one, so the panel can be placed wherever the page layout wants it.
      Otherwise fall back to the end of #app, which does not depend on the
      rest of the page's structure. Clearing the mount point first means
      re-loading this file during development replaces the panel instead of
      stacking a second one.
    */
    function mountPanel() {
        let mount = document.getElementById("challenge-mode");
        if (!mount) {
            mount = document.createElement("div");
            mount.id = "challenge-mode";
            (document.getElementById("app") || document.body).appendChild(mount);
        }

        mount.textContent = "";
        mount.appendChild(buildPanel());
    }

    function setStatus(message, isError) {
        elements.status.textContent = message;
        elements.status.classList.toggle("challenge-status-error", Boolean(isError));
    }

    function markCell(tier, seed, cellState, title) {
        const cell = elements.tiers.get(tier.key).cells.get(seed);
        cell.dataset.state = cellState;
        cell.title = title;
        if (cellState === "pass") cell.textContent = "✓";
        if (cellState === "fail") cell.textContent = "✗";
        if (cellState === "skipped") cell.textContent = "·";
        if (cellState === "pending") cell.textContent = String(seed);
    }

    function average(values) {
        const total = values.reduce((sum, value) => sum + value, 0);
        return Math.round(total / values.length);
    }

    /*
      Par is the moves used divided by the shortest route, so 1.0 is a perfect
      line to the goal and 3.0 means walking three times further than needed.
      Reaching the goal is the pass mark; par is the score, and it gives a
      learner whose solver already works something to improve.
    */
    function parFor(results) {
        const ratios = results
            .filter(result => result.reached && result.shortest > 0)
            .map(result => result.moves / result.shortest);
        if (ratios.length === 0) return null;
        return ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
    }

    /* One line per difficulty: how many were solved and how efficiently. */
    function describeTier(tier, results) {
        if (results.length === 0) return "Not run";

        const solved = results.filter(result => result.reached);
        let text = `${solved.length}/${SEEDS.length} solved`;

        if (solved.length > 0) {
            const moves = average(solved.map(result => result.moves));
            text += ` · ${moves} moves on average · ${parFor(results).toFixed(1)}× par`;
        }
        if (solved.length < results.length) {
            text += ` · failed on maze ${results[results.length - 1].seed}`;
        }
        return text;
    }

    function updateTier(tier) {
        const results = state.results.get(tier.key) || [];
        elements.tiers.get(tier.key).result.textContent = describeTier(tier, results);
    }

    /* The headline: "Easy 25/25 · Medium 25/25 · Hard 14/25 · Expert —". */
    function updateSummary() {
        elements.summary.hidden = false;
        const solvedTotal = TIERS.reduce((total, tier) => {
            const results = state.results.get(tier.key) || [];
            return total + results.filter(result => result.reached).length;
        }, 0);
        const allResults = [...state.results.values()].flat();
        const par = parFor(allResults);

        const tiers = TIERS.map(tier => {
            const results = state.results.get(tier.key) || [];
            if (results.length === 0) return `${tier.label} —`;
            const solved = results.filter(result => result.reached).length;
            return `${tier.label} ${solved}/${SEEDS.length}`;
        }).join(" · ");

        elements.summary.textContent = par === null
            ? tiers
            : `${tiers} · overall ${solvedTotal} solved at ${par.toFixed(1)}× par`;
    }

    function resetProgress() {
        state.failure = null;
        state.results = new Map();
        elements.failure.hidden = true;
        elements.summary.hidden = true;

        TIERS.forEach(tier => {
            SEEDS.forEach(seed => {
                const label = `${tier.label} maze ${seed}: not run yet`;
                markCell(tier, seed, "pending", label);
            });
            elements.tiers.get(tier.key).result.textContent = "Not run";
        });
    }

    /* Explain a failure in the terms the activity uses, not in Python terms. */
    function describeFailure(result) {
        if (result.reason === "stuck") {
            const tier = TIERS.find(entry => entry.key === result.level);
            return (
                "Your program was still running after " +
                `${tier.maxSteps.toLocaleString()} steps. It had made ` +
                `${result.moves} moves on a maze whose shortest route is ` +
                `${result.shortest} moves, so it is going round and round rather ` +
                "than making progress."
            );
        }
        if (result.reason === "error") {
            return `Your program stopped with an error: ${result.error}`;
        }
        return (
            `Your program finished after ${result.moves} moves without reaching ` +
            `the goal. The shortest route is ${result.shortest} moves.`
        );
    }

    function showFailure(tier, result) {
        state.failure = result;
        elements.failureTitle.textContent =
            `${tier.label} maze ${result.seed} was not solved`;
        elements.failureText.textContent = describeFailure(result);
        elements.failure.hidden = false;
        elements.failure.scrollIntoView({block: "nearest"});
    }

    /* Scrolling the page for the user is motion, so it is opt-out. */
    function scrollBehavior() {
        const reduced = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
        return reduced.matches ? "auto" : "smooth";
    }

    async function loadFailingMaze() {
        const result = state.failure;
        if (!result || state.running) return;

        const tier = TIERS.find(entry => entry.key === result.level);
        elements.loadButton.disabled = true;
        try {
            await globalThis.mazeGame.loadMazeText(
                result.maze,
                result.level,
                `Challenge maze loaded: ${tier.label} maze ${result.seed}. ` +
                "Select Run program to watch what your solver does on it.",
            );
            const canvas = document.getElementById("mazeCanvas");
            if (canvas) {
                canvas.scrollIntoView({behavior: scrollBehavior(), block: "center"});
            }
            const runButton = document.getElementById("runBtn");
            if (runButton) runButton.focus();
        } catch (error) {
            setStatus(`Could not load that maze: ${error}`, true);
        } finally {
            elements.loadButton.disabled = false;
        }
    }

    /*
      A task that the browser runs promptly even in a background tab, unlike
      setTimeout, which it clamps to roughly one second there.
    */
    function yieldToEventLoop(callback) {
        const channel = new MessageChannel();
        channel.port1.onmessage = callback;
        channel.port2.postMessage(null);
    }

    /*
      Hand control back to the browser between mazes. Without this the forty
      Pyodide calls would run back to back in one task and the progress grid
      would only appear once the whole run had finished.

      While the page is visible, waiting for an animation frame is the reliable
      signal that the grid really has been drawn, and it paces the run at about
      one maze per frame so the squares can be seen filling in. A hidden page
      never runs animation frames at all, so it yields through a message
      channel instead: there is nothing to draw, and a pupil who switches tabs
      must not come back to a run that has stalled.
    */
    function nextPaint() {
        return new Promise(resolve => {
            let resolved = false;

            function finish() {
                if (resolved) return;
                resolved = true;
                document.removeEventListener("visibilitychange", onVisibilityChange);
                resolve();
            }

            function onVisibilityChange() {
                if (document.hidden) yieldToEventLoop(finish);
            }

            requestAnimationFrame(finish);

            if (document.hidden) {
                yieldToEventLoop(finish);
            } else {
                document.addEventListener("visibilitychange", onVisibilityChange);
            }
        });
    }

    /* One maze per Pyodide call, so each call is short. */
    async function runOneMaze(tier, seed) {
        const game = globalThis.mazeGame;
        await game.setGlobal("PMG_CHALLENGE_LEVEL", tier.key);
        await game.setGlobal("PMG_CHALLENGE_SEED", seed);
        await game.setGlobal("PMG_CHALLENGE_MAX_STEPS", tier.maxSteps);

        const json = await game.runPython(
            "run_challenge_maze(PMG_CHALLENGE_SRC, PMG_CHALLENGE_LEVEL, " +
            "PMG_CHALLENGE_SEED, PMG_CHALLENGE_MAX_STEPS, " +
            "PMG_CHALLENGE_MAX_SECONDS)",
        );
        return JSON.parse(String(json));
    }

    async function runChallenge() {
        if (state.running) return;

        const game = globalThis.mazeGame;
        if (!game) return;

        state.running = true;
        state.stopRequested = false;
        resetProgress();
        elements.startButton.disabled = true;
        elements.stopButton.hidden = false;
        game.setBusy(true);
        game.setStatus("Challenge mode is running. The maze below is untouched.");

        let failed = null;

        try {
            await game.ready();
            await game.setGlobal("PMG_CHALLENGE_SRC", game.getCode());
            await game.setGlobal("PMG_CHALLENGE_MAX_SECONDS", CHALLENGE_MAX_SECONDS);

            for (const tier of TIERS) {
                const results = [];
                state.results.set(tier.key, results);

                for (const seed of SEEDS) {
                    if (state.stopRequested) break;

                    setStatus(
                        `Running ${tier.label} maze ${seed} of ${SEEDS.length}…`,
                    );
                    const label = `${tier.label} maze ${seed}`;
                    markCell(tier, seed, "running", `${label}: running`);

                    /*
                      One yield per maze, taken before the Python call: it
                      paints this maze's "running" marker and the previous
                      maze's result together, so the grid fills in visibly
                      without costing two pauses per maze.
                    */
                    await nextPaint();

                    const result = await runOneMaze(tier, seed);
                    results.push(result);

                    markCell(
                        tier,
                        seed,
                        result.reached ? "pass" : "fail",
                        result.reached
                            ? `${label}: solved in ${result.moves} moves`
                            : `${label}: not solved`,
                    );
                    updateTier(tier);
                    updateSummary();

                    if (!result.reached) {
                        failed = {tier, result};
                        break;
                    }
                }

                /* Stop the whole run at the first failure, as designed. */
                if (failed || state.stopRequested) break;
            }

            if (failed) {
                setStatus(
                    `Stopped at ${failed.tier.label} maze ${failed.result.seed}.`,
                );
                showFailure(failed.tier, failed.result);
            } else if (state.stopRequested) {
                setStatus("Challenge stopped.");
            } else {
                setStatus(
                    `All ${TOTAL_MAZES} mazes solved. Your program is not ` +
                    "just lucky.",
                );
            }
        } catch (error) {
            setStatus(`The challenge could not finish: ${error}`, true);
        } finally {
            state.running = false;
            elements.startButton.disabled = false;
            elements.stopButton.hidden = true;
            game.setBusy(false);
            game.setStatus(
                failed
                    ? "Challenge finished. Load the failing maze to watch it."
                    : "Challenge finished. The maze here is unchanged.",
            );
        }
    }

    /*
      maze.js awaits its first maze file before publishing the bridge, so this
      script can load before globalThis.mazeGame exists however it is included.
    */
    function waitForBridge() {
        return new Promise((resolve, reject) => {
            const giveUpAt = Date.now() + 60000;

            function check() {
                if (globalThis.mazeGame) {
                    resolve(globalThis.mazeGame);
                } else if (Date.now() > giveUpAt) {
                    reject(new Error("maze.js did not finish loading"));
                } else {
                    setTimeout(check, 50);
                }
            }

            check();
        });
    }

    function init() {
        mountPanel();

        waitForBridge()
            .then(game => game.ready())
            .then(() => {
                elements.startButton.disabled = false;
                setStatus(IDLE_STATUS);
            })
            .catch(error => {
                setStatus(`Challenge mode is unavailable: ${error.message}`, true);
            });

        /* A small hook for the console and for automated checks. */
        globalThis.challengeMode = {
            run: runChallenge,
            stop: () => {
                state.stopRequested = true;
            },
            isRunning: () => state.running,
            results: () => Object.fromEntries(state.results),
            failure: () => state.failure,
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
