"""Tests for generated mazes and the checked-in maze collection."""

import unittest
from pathlib import Path

from maze_generator import find_solution, generate_maze, validate_maze


PROJECT_ROOT = Path(__file__).resolve().parents[1]


class MazeGeneratorTests(unittest.TestCase):
    def test_generation_is_reproducible_for_a_seed(self):
        first = generate_maze(15, 21, seed=2026)
        second = generate_maze(15, 21, seed=2026)
        different = generate_maze(15, 21, seed=2027)

        self.assertEqual(first, second)
        self.assertNotEqual(first, different)

    def test_perfect_maze_is_solvable_and_fully_connected(self):
        maze = generate_maze(21, 31, seed=42, style="perfect")

        validate_maze(maze, require_all_passages_connected=True)
        self.assertIsNotNone(find_solution(maze))

    def test_braided_maze_adds_loops_and_stays_connected(self):
        perfect = generate_maze(21, 31, seed=42, style="perfect")
        braided = generate_maze(21, 31, seed=42, style="braided", braid=1.0)

        validate_maze(braided, require_all_passages_connected=True)
        self.assertLess(
            sum(line.count("#") for line in braided),
            sum(line.count("#") for line in perfect),
        )

    def test_random_blocks_style_always_has_a_route(self):
        for seed in range(25):
            with self.subTest(seed=seed):
                maze = generate_maze(
                    18, 24, seed=seed, style="blocks", block_density=0.72
                )
                self.assertIsNotNone(find_solution(maze))

    def test_invalid_carved_dimensions_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "odd dimensions"):
            generate_maze(10, 11, style="perfect")

    def test_checked_in_maps_are_valid(self):
        for path in sorted((PROJECT_ROOT / "mazes").glob("*.txt")):
            with self.subTest(map=path.name):
                maze = path.read_text(encoding="utf-8").splitlines()
                validate_maze(maze)


if __name__ == "__main__":
    unittest.main()
