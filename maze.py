"""
This file runs inside Pyodide (Python in the browser) and contains
functions that the user can call to navigate a maze.

The actual maze and drawing are handled by JavaScript in maze.js.
"""

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
    Raises TimeoutError if the limits are exceeded.
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


def reset_state():
    """
    Reset the maze state.
    """
    global row, col, direction
    row = start_row
    col = start_col
    direction = 1


# Helper functions


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
