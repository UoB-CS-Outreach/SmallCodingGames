"""Tests for maze.py, the Python API the learner's program calls.

maze.py normally runs inside Pyodide and talks to the page through the ``js``
module, so these tests install a stand-in for ``js`` before importing it. That
stand-in also records the actions that would have been animated, which is what
lets the challenge-mode tests below prove that nothing is drawn and that the
maze on screen is left exactly as it was found.
"""

import importlib
import json
import sys
import types
import unittest

import maze_generator


# S faces right. The goal is four moves away: right, right, down, down.
TEST_MAZE = [
    "#####",
    "#S..#",
    "#.#.#",
    "#..G#",
    "#####",
]

RIGHT_HAND_SOLVER = """
while not at_goal():
    if path_right():
        turn_right()
        move()
    elif path_ahead():
        move()
    else:
        turn_left()
"""

SPINS_FOREVER = """
while not at_goal():
    turn_left()
"""


def install_fake_js(lines):
    """Put a stand-in for Pyodide's ``js`` module on sys.modules."""
    fake = types.ModuleType("js")
    fake.actions = []
    fake.js_enqueue_action = fake.actions.append
    fake.JS_MAZE = list(lines)
    fake.JS_MAZE_NUM_ROWS = len(lines)
    fake.JS_MAZE_NUM_COLS = len(lines[0])
    for marker, row_name, column_name in (
        ("S", "JS_MAZE_START_ROW", "JS_MAZE_START_COL"),
        ("G", "JS_MAZE_GOAL_ROW", "JS_MAZE_GOAL_COL"),
    ):
        row = next(index for index, line in enumerate(lines) if marker in line)
        setattr(fake, row_name, row)
        setattr(fake, column_name, lines[row].index(marker))

    sys.modules["js"] = fake
    return fake


class MazeApiTestCase(unittest.TestCase):
    def setUp(self):
        self.js = install_fake_js(TEST_MAZE)
        # A fresh import per test, because maze.py keeps the player position in
        # module-level state.
        sys.modules.pop("maze", None)
        self.maze = importlib.import_module("maze")
        self.maze.PMG_MAZE_GENERATOR = maze_generator

    def tearDown(self):
        sys.modules.pop("maze", None)
        sys.modules.pop("js", None)


class PlayerMovementTests(MazeApiTestCase):
    def test_player_starts_on_the_start_square_facing_right(self):
        self.assertEqual((self.maze.row, self.maze.col), (1, 1))
        self.assertEqual(self.maze.direction, 1)

    def test_move_advances_and_reports_the_action_for_animation(self):
        self.maze.move()

        self.assertEqual((self.maze.row, self.maze.col), (1, 2))
        self.assertEqual(self.js.actions, ["move"])

    def test_turning_changes_facing_without_moving(self):
        self.maze.turn_right()
        self.maze.turn_right()

        self.assertEqual((self.maze.row, self.maze.col), (1, 1))
        self.assertEqual(self.maze.direction, 3)
        self.assertEqual(self.js.actions, ["turnRight", "turnRight"])

    def test_walking_into_a_wall_explains_which_way_it_failed(self):
        self.maze.turn_left()  # face up, into the border

        with self.assertRaises(RuntimeError) as raised:
            self.maze.move()

        self.assertIn("up", str(raised.exception))
        self.assertIn("path_ahead()", str(raised.exception))

    def test_path_questions_are_relative_to_the_way_it_faces(self):
        self.assertTrue(self.maze.path_ahead())
        self.assertTrue(self.maze.path_right())
        self.assertFalse(self.maze.path_left())

        self.maze.turn_right()  # now facing down

        self.assertTrue(self.maze.path_ahead())
        self.assertTrue(self.maze.path_left())

    def test_at_goal_is_only_true_on_the_goal_square(self):
        self.assertFalse(self.maze.at_goal())

        self.maze.move()
        self.maze.move()
        self.maze.turn_right()
        self.maze.move()
        self.maze.move()

        self.assertTrue(self.maze.at_goal())


class ChallengeRunTests(MazeApiTestCase):
    def run_challenge(self, source, level="easy", seed=1, max_steps=15000):
        return json.loads(
            self.maze.run_challenge_maze(source, level, seed, max_steps, 2.0)
        )

    def test_a_correct_solver_reaches_the_goal(self):
        result = self.run_challenge(RIGHT_HAND_SOLVER)

        self.assertTrue(result["reached"])
        self.assertEqual(result["reason"], "reached")
        self.assertGreaterEqual(result["moves"], result["shortest"])
        self.assertEqual(result["level"], "easy")
        self.assertEqual(result["seed"], 1)

    def test_the_lines_a_program_used_are_reported(self):
        # Challenge mode sets each difficulty's budget from this figure, so a
        # solved maze has to report what it actually cost.
        result = self.run_challenge(RIGHT_HAND_SOLVER)

        self.assertGreater(result["steps"], result["moves"])
        self.assertLess(result["steps"], 15000)

    def test_the_same_seed_always_gives_the_same_maze(self):
        first = self.run_challenge(RIGHT_HAND_SOLVER)
        second = self.run_challenge(RIGHT_HAND_SOLVER)

        self.assertEqual(first["maze"], second["maze"])

    def test_a_program_that_never_finishes_is_reported_as_stuck(self):
        result = self.run_challenge(SPINS_FOREVER, max_steps=2000)

        self.assertFalse(result["reached"])
        self.assertEqual(result["reason"], "stuck")

    def test_a_broken_program_is_reported_as_an_error(self):
        result = self.run_challenge("move(")

        self.assertFalse(result["reached"])
        self.assertEqual(result["reason"], "error")
        self.assertIn("SyntaxError", result["error"])

    def test_nothing_is_animated_during_a_challenge_run(self):
        self.run_challenge(RIGHT_HAND_SOLVER)

        self.assertEqual(self.js.actions, [])

    def test_the_displayed_maze_and_player_are_left_untouched(self):
        self.maze.move()  # the learner has already moved on the shown maze
        before = (
            list(self.maze.maze),
            self.maze.num_rows,
            self.maze.num_cols,
            self.maze.start_row,
            self.maze.start_col,
            self.maze.goal_row,
            self.maze.goal_col,
            self.maze.row,
            self.maze.col,
            self.maze.direction,
        )

        self.run_challenge(RIGHT_HAND_SOLVER)

        after = (
            list(self.maze.maze),
            self.maze.num_rows,
            self.maze.num_cols,
            self.maze.start_row,
            self.maze.start_col,
            self.maze.goal_row,
            self.maze.goal_col,
            self.maze.row,
            self.maze.col,
            self.maze.direction,
        )
        self.assertEqual(before, after)
        self.assertIs(self.maze.js_enqueue_action, self.js.js_enqueue_action)

    def test_state_is_restored_even_when_the_program_raises(self):
        before = (list(self.maze.maze), self.maze.row, self.maze.col)

        self.run_challenge("raise ValueError('boom')")

        self.assertEqual((list(self.maze.maze), self.maze.row, self.maze.col), before)
        self.assertIs(self.maze.js_enqueue_action, self.js.js_enqueue_action)


if __name__ == "__main__":
    unittest.main()
