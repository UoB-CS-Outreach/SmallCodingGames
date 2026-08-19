"""
This file runs inside Pyodide (Python in the browser) and contains
functions that the user can call to navigate a maze.

The actual maze and drawing are handled by JavaScript in maze.js.
"""

import contextlib
import io
import json
import sys
import time

import js
from js import js_enqueue_action

# Direction encoding:
# 0 = up, 1 = right, 2 = down, 3 = left
DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
DIR_NAMES = ["up", "right", "down", "left"]

# Maze and position state. JavaScript calls _sync_maze_from_js() whenever a
# different fixed or generated maze is selected.
maze = []
num_rows = 0
num_cols = 0
start_row = 0
start_col = 0
goal_row = 0
goal_col = 0
row = 0
col = 0
direction = 1


def _sync_maze_from_js():
    """Copy the current JavaScript maze into Python and reset the player."""
    global maze, num_rows, num_cols
    global start_row, start_col, goal_row, goal_col
    global row, col, direction

    maze = [str(line) for line in js.JS_MAZE]
    num_rows = int(js.JS_MAZE_NUM_ROWS)
    num_cols = int(js.JS_MAZE_NUM_COLS)
    start_row = int(js.JS_MAZE_START_ROW)
    start_col = int(js.JS_MAZE_START_COL)
    goal_row = int(js.JS_MAZE_GOAL_ROW)
    goal_col = int(js.JS_MAZE_GOAL_COL)
    row = start_row
    col = start_col
    direction = 1


_sync_maze_from_js()


# JS functions


def run_user_code(src, max_seconds, max_steps):
    """
    Execute user code with a time + executed-lines limit.

    Raises StepLimitError if either limit is exceeded, and otherwise returns
    the number of lines executed. Challenge mode uses that count to set each
    difficulty's budget from what a correct program really costs.
    """
    start = time.time()
    steps = 0

    class StepLimitError(Exception):
        """Raised when user code exceeds the allowed step/time budget."""

    def trace(frame, event, arg):
        nonlocal steps

        if frame.f_code.co_filename != "<exec>":
            return None

        if event == "line":
            steps += 1
            if steps > max_steps:
                raise StepLimitError(
                    f"Program stopped: too many steps (>{max_steps}). "
                    "Check for an infinite loop."
                )
            if (time.time() - start) > max_seconds:
                raise StepLimitError(
                    f"Program stopped: took too long (>{max_seconds:.1f}s). "
                    "Check for an infinite loop."
                )
        return trace

    sys.settrace(trace)
    try:
        code_obj = compile(src, "<exec>", "exec")
        exec(code_obj, globals(), globals())
    finally:
        sys.settrace(None)

    return steps


def reset_state():
    """
    Reset the maze state.
    """
    global row, col, direction
    row = start_row
    col = start_col
    direction = 1


# Challenge mode
#
# "It worked once" is not the same as "it is correct", so challenge mode runs
# the same program against many freshly generated mazes. JavaScript drives the
# loop one maze at a time so the page can keep painting, and calls this once
# per maze.


def run_challenge_maze(src, level, seed, max_steps=15000, max_seconds=2.0):
    """
    Run user code against one generated maze and report what happened.

    The maze is built from ``level`` and ``seed``, so the same seed always
    produces the same maze and a demonstrator can reproduce a failure.

    Nothing is animated: js_enqueue_action is replaced by a counter for the
    duration of the run, which also gives us the number of moves used. The
    module-level maze and player state are saved and put back afterwards, so
    the maze on screen is exactly as the user left it. The result is returned
    as a JSON string because that is the least fiddly thing for JavaScript to
    read back out of Pyodide.
    """
    global maze, num_rows, num_cols
    global start_row, start_col, goal_row, goal_col
    global row, col, direction
    global js_enqueue_action

    generator = globals().get("PMG_MAZE_GENERATOR")
    if generator is None:
        raise RuntimeError("The maze generator has not been loaded yet")

    src = str(src)
    level = str(level)
    seed = int(seed)
    max_steps = int(max_steps)
    max_seconds = float(max_seconds)

    challenge_maze = [
        str(line) for line in generator.generate_difficulty(level, seed=seed)
    ]
    route = generator.find_solution(challenge_maze)
    shortest = len(route) - 1 if route else None

    # Everything _sync_maze_from_js() would otherwise own, plus the player.
    saved_state = (
        maze,
        num_rows,
        num_cols,
        start_row,
        start_col,
        goal_row,
        goal_col,
        row,
        col,
        direction,
    )
    saved_enqueue = js_enqueue_action

    moves = 0

    def count_action(action_type):
        """Stand in for js_enqueue_action: count moves, animate nothing."""
        nonlocal moves
        if action_type == "move":
            moves += 1

    try:
        maze = challenge_maze
        num_rows = len(maze)
        num_cols = len(maze[0])
        start_row, start_col = _find_cell(maze, "S")
        goal_row, goal_col = _find_cell(maze, "G")
        row, col = start_row, start_col
        direction = 1
        js_enqueue_action = count_action

        error = ""
        steps = max_steps
        # A challenge run executes the program dozens of times, so any print()
        # inside it would flood the Output panel with one copy per maze.
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                steps = run_user_code(src, max_seconds, max_steps)
        except Exception as exc:  # noqa: BLE001 - report whatever user code did
            error = f"{type(exc).__name__}: {exc}"

        # Checked directly rather than through at_goal() so that a user program
        # which happens to redefine at_goal() cannot mark its own homework.
        reached = (row == goal_row) and (col == goal_col)

        if reached:
            reason = "reached"
        elif "too many steps" in error or "took too long" in error:
            reason = "stuck"
        elif error:
            reason = "error"
        else:
            reason = "stopped"

        result = {
            "level": level,
            "seed": seed,
            "reached": reached,
            "moves": moves,
            "steps": steps,
            "shortest": shortest,
            "reason": reason,
            "error": error,
            "maze": "\n".join(maze) + "\n",
        }
    finally:
        (
            maze,
            num_rows,
            num_cols,
            start_row,
            start_col,
            goal_row,
            goal_col,
            row,
            col,
            direction,
        ) = saved_state
        js_enqueue_action = saved_enqueue

    return json.dumps(result)


# Helper functions


def _find_cell(lines, marker):
    """
    Return the (row, col) of the first cell holding a marker character.
    """
    for r, line in enumerate(lines):
        c = line.find(marker)
        if c != -1:
            return r, c
    raise ValueError(f"Maze contains no {marker} cell")


def _step_forward(r, c, d):
    """
    Given a position (r, c) and a direction code d, return the
    next cell in that direction.
    """
    dr, dc = DIRS[d]
    return r + dr, c + dc


def _is_wall(r, c):
    """
    Return True if the cell (r, c) is a wall or out of bounds.
    """
    if not _in_bounds(r, c):
        return True
    return maze[r][c] == "#"


def _in_bounds(r, c):
    """
    Return True if the cell (r, c) is in bounds.
    """
    return 0 <= r < num_rows and 0 <= c < num_cols


# Maze game functions
# If changing state must also enqueue an action for JS to animate.


def move():
    """
    Move one cell forward if there is no wall.

    If the next cell is a wall, we raise an error so the user can see
    what went wrong in their program.

    We also enqueue a "move" action so JS can animate it.
    """
    global row, col
    nr, nc = _step_forward(row, col, direction)

    if not _in_bounds(nr, nc):
        raise RuntimeError(
            f"Can't move {DIR_NAMES[direction]} from (row={row}, col={col}) — "
            "that would leave the maze. Try checking path_ahead() first."
        )

    if maze[nr][nc] == "#":
        raise RuntimeError(
            f"Wall ahead: can't move {DIR_NAMES[direction]} from "
            f"(row={row}, col={col}) into (row={nr}, col={nc}). Try checking "
            f"path_ahead() before move()."
        )

    row, col = nr, nc
    js_enqueue_action("move")


def turn_left():
    """
    Turn 90 degrees left.
    """
    global direction
    direction = (direction - 1) % 4
    js_enqueue_action("turnLeft")


def turn_right():
    """
    Turn 90 degrees right.
    """
    global direction
    direction = (direction + 1) % 4
    js_enqueue_action("turnRight")


def path_ahead():
    """
    Check if there is free space directly ahead of the player.
    """
    nr, nc = _step_forward(row, col, direction)
    return not _is_wall(nr, nc)


def path_behind():
    """
    Check if there is free space directly behind of the player.
    """
    d = (direction - 2) % 4
    nr, nc = _step_forward(row, col, d)
    return not _is_wall(nr, nc)


def path_left():
    """
    Check if there is free space to the left of the player.
    """
    d = (direction - 1) % 4
    nr, nc = _step_forward(row, col, d)
    return not _is_wall(nr, nc)


def path_right():
    """
    Check if there is free space to the right of the player.
    """
    d = (direction + 1) % 4
    nr, nc = _step_forward(row, col, d)
    return not _is_wall(nr, nc)


def at_goal():
    """
    Return True if the player is currently on the goal cell.
    """
    return (row == goal_row) and (col == goal_col)


def position():
    """
    Return the player's square as a (row, column) pair.

    Rows count down from the top and columns across from the left, both
    starting at zero. This is the one function that tells a program something
    it could not work out by looking around it, which is what makes a
    visited-set solver possible.
    """
    return (row, col)
