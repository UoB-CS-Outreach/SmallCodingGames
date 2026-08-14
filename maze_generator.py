"""Generate and validate text mazes for the browser maze game.

The default ``braided`` generator starts with a depth-first-search maze and
then opens some dead ends to add loops.  ``perfect`` leaves the carved maze as
a tree, while ``blocks`` deliberately creates a less structured random-block
test case around a protected start-to-goal route.

The module has no browser or third-party dependencies, so it can also be used
from tests or other tooling::

    maze = generate_maze(21, 31, seed=42, style="braided")
    print(maze_to_text(maze), end="")
"""

from __future__ import annotations

import argparse
import random
from collections import deque
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple


Coordinate = Tuple[int, int]
Grid = List[List[str]]
Maze = List[str]

WALL = "#"
PASSAGE = "."
START = "S"
GOAL = "G"

_DIRECTIONS: Tuple[Coordinate, ...] = ((-1, 0), (0, 1), (1, 0), (0, -1))
_CARVED_STYLES = {"perfect", "braided"}
_STYLES = _CARVED_STYLES | {"blocks"}


def generate_maze(
    rows: int = 21,
    columns: int = 21,
    *,
    seed: Optional[int] = None,
    style: str = "braided",
    braid: float = 0.15,
    block_density: float = 0.32,
) -> Maze:
    """Return a new solvable maze as a list of equal-length strings.

    Args:
        rows: Total number of rows, including the solid outer border.
        columns: Total number of columns, including the outer border.
        seed: Optional seed for reproducible output.
        style: ``perfect``, ``braided``, or ``blocks``.
        braid: For ``braided``, the probability of opening each dead end into
            another corridor. Higher values create more loops and wall islands.
        block_density: For ``blocks``, the probability that an unprotected
            interior cell is a wall.

    Carved mazes require odd dimensions so that one-cell passages can alternate
    with one-cell walls. Random-block mazes accept odd or even dimensions.
    Every style guarantees at least one route from ``S`` to ``G``.
    """
    _validate_options(rows, columns, style, braid, block_density)
    rng = random.Random(seed)

    if style == "blocks":
        grid = _generate_blocks(rows, columns, rng, block_density)
        start, goal = (1, 1), (rows - 2, columns - 2)
    else:
        grid = _carve_depth_first(rows, columns, rng)
        if style == "braided":
            _braid_dead_ends(grid, rng, braid)
        start, goal = _distant_endpoints(grid)

    grid[start[0]][start[1]] = START
    grid[goal[0]][goal[1]] = GOAL
    maze = ["".join(row) for row in grid]

    # This is intentionally kept as a final invariant check. If a future
    # generation strategy breaks solvability, it should fail here rather than
    # emit a bad map.
    validate_maze(maze)
    return maze


def find_solution(maze: Sequence[str]) -> Optional[List[Coordinate]]:
    """Return a shortest ``S``-to-``G`` path, or ``None`` if no route exists."""
    rows, columns = _maze_shape(maze)
    start = _find_unique_marker(maze, START)
    goal = _find_unique_marker(maze, GOAL)
    queue = deque([start])
    previous = {start: None}

    while queue:
        current = queue.popleft()
        if current == goal:
            path: List[Coordinate] = []
            cursor: Optional[Coordinate] = current
            while cursor is not None:
                path.append(cursor)
                cursor = previous[cursor]
            path.reverse()
            return path

        for neighbour in _neighbours(current, rows, columns):
            row, column = neighbour
            if maze[row][column] != WALL and neighbour not in previous:
                previous[neighbour] = current
                queue.append(neighbour)

    return None


def validate_maze(
    maze: Sequence[str], *, require_all_passages_connected: bool = False
) -> None:
    """Raise ``ValueError`` if a maze cannot safely be loaded by the game.

    By default disconnected traversable islands are allowed, matching the game
    format. Set ``require_all_passages_connected`` for carved-maze checks.
    """
    rows, columns = _maze_shape(maze)
    start = _find_unique_marker(maze, START)
    _find_unique_marker(maze, GOAL)

    allowed = {WALL, PASSAGE, START, GOAL, " "}
    unexpected = sorted({character for line in maze for character in line} - allowed)
    if unexpected:
        raise ValueError(f"Unsupported maze character(s): {unexpected!r}")

    if find_solution(maze) is None:
        raise ValueError("Maze has no route from S to G")

    if require_all_passages_connected:
        reachable = _reachable_cells(maze, start, rows, columns)
        passages = {
            (row, column)
            for row, line in enumerate(maze)
            for column, character in enumerate(line)
            if character != WALL
        }
        if reachable != passages:
            raise ValueError("Maze contains disconnected traversable cells")


def maze_to_text(maze: Sequence[str]) -> str:
    """Validate a maze and serialize it with a final newline."""
    validate_maze(maze)
    return "\n".join(maze) + "\n"


def write_maze(maze: Sequence[str], output: Path) -> None:
    """Validate and write a maze to ``output`` using UTF-8 text."""
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(maze_to_text(maze), encoding="utf-8")


def _validate_options(
    rows: int, columns: int, style: str, braid: float, block_density: float
) -> None:
    if rows < 5 or columns < 5:
        raise ValueError("Maze dimensions must both be at least 5")
    if style not in _STYLES:
        choices = ", ".join(sorted(_STYLES))
        raise ValueError(f"Unknown style {style!r}; choose from {choices}")
    if style in _CARVED_STYLES and (rows % 2 == 0 or columns % 2 == 0):
        raise ValueError("Perfect and braided mazes require odd dimensions")
    if not 0.0 <= braid <= 1.0:
        raise ValueError("braid must be between 0 and 1")
    if not 0.0 <= block_density <= 1.0:
        raise ValueError("block_density must be between 0 and 1")


def _carve_depth_first(rows: int, columns: int, rng: random.Random) -> Grid:
    grid = [[WALL for _ in range(columns)] for _ in range(rows)]
    origin = (1, 1)
    grid[origin[0]][origin[1]] = PASSAGE
    stack = [origin]

    while stack:
        row, column = stack[-1]
        candidates = []
        for row_delta, column_delta in _DIRECTIONS:
            next_row = row + 2 * row_delta
            next_column = column + 2 * column_delta
            if (
                0 < next_row < rows - 1
                and 0 < next_column < columns - 1
                and grid[next_row][next_column] == WALL
            ):
                candidates.append((next_row, next_column, row_delta, column_delta))

        if not candidates:
            stack.pop()
            continue

        next_row, next_column, row_delta, column_delta = rng.choice(candidates)
        grid[row + row_delta][column + column_delta] = PASSAGE
        grid[next_row][next_column] = PASSAGE
        stack.append((next_row, next_column))

    return grid


def _braid_dead_ends(grid: Grid, rng: random.Random, probability: float) -> None:
    if probability == 0:
        return

    rows, columns = len(grid), len(grid[0])
    cells = [
        (row, column)
        for row in range(1, rows - 1, 2)
        for column in range(1, columns - 1, 2)
    ]
    rng.shuffle(cells)

    for row, column in cells:
        if rng.random() > probability:
            continue
        if _open_neighbour_count(grid, row, column) != 1:
            continue

        removable_walls = []
        for row_delta, column_delta in _DIRECTIONS:
            wall_row, wall_column = row + row_delta, column + column_delta
            far_row, far_column = row + 2 * row_delta, column + 2 * column_delta
            if (
                0 < far_row < rows - 1
                and 0 < far_column < columns - 1
                and grid[wall_row][wall_column] == WALL
                and grid[far_row][far_column] != WALL
            ):
                removable_walls.append((wall_row, wall_column))

        if removable_walls:
            wall_row, wall_column = rng.choice(removable_walls)
            grid[wall_row][wall_column] = PASSAGE


def _generate_blocks(
    rows: int, columns: int, rng: random.Random, density: float
) -> Grid:
    grid = [[WALL for _ in range(columns)] for _ in range(rows)]
    route = _random_manhattan_route(rows, columns, rng)

    for row in range(1, rows - 1):
        for column in range(1, columns - 1):
            if (row, column) in route or rng.random() >= density:
                grid[row][column] = PASSAGE

    return grid


def _random_manhattan_route(
    rows: int, columns: int, rng: random.Random
) -> set[Coordinate]:
    row, column = 1, 1
    goal = (rows - 2, columns - 2)
    route = {(row, column)}

    while (row, column) != goal:
        moves = []
        if row < goal[0]:
            moves.append((1, 0))
        if column < goal[1]:
            moves.append((0, 1))
        row_delta, column_delta = rng.choice(moves)
        row += row_delta
        column += column_delta
        route.add((row, column))

    return route


def _distant_endpoints(grid: Grid) -> Tuple[Coordinate, Coordinate]:
    first, _ = _farthest_cell(grid, (1, 1))
    second, _ = _farthest_cell(grid, first)
    return first, second


def _farthest_cell(grid: Grid, origin: Coordinate) -> Tuple[Coordinate, int]:
    rows, columns = len(grid), len(grid[0])
    queue = deque([(origin, 0)])
    seen = {origin}
    farthest = origin
    farthest_distance = 0

    while queue:
        current, distance = queue.popleft()
        if distance > farthest_distance:
            farthest, farthest_distance = current, distance
        for neighbour in _neighbours(current, rows, columns):
            row, column = neighbour
            if grid[row][column] != WALL and neighbour not in seen:
                seen.add(neighbour)
                queue.append((neighbour, distance + 1))

    return farthest, farthest_distance


def _open_neighbour_count(grid: Grid, row: int, column: int) -> int:
    return sum(
        grid[row + row_delta][column + column_delta] != WALL
        for row_delta, column_delta in _DIRECTIONS
    )


def _maze_shape(maze: Sequence[str]) -> Tuple[int, int]:
    if not maze:
        raise ValueError("Maze is empty")
    columns = len(maze[0])
    if columns == 0:
        raise ValueError("Maze rows cannot be empty")
    if any(len(line) != columns for line in maze):
        raise ValueError("Maze rows must all have the same length")
    return len(maze), columns


def _find_unique_marker(maze: Sequence[str], marker: str) -> Coordinate:
    matches = [
        (row, column)
        for row, line in enumerate(maze)
        for column, character in enumerate(line)
        if character == marker
    ]
    if len(matches) != 1:
        message = f"Maze must contain exactly one {marker}; found {len(matches)}"
        raise ValueError(message)
    return matches[0]


def _reachable_cells(
    maze: Sequence[str], origin: Coordinate, rows: int, columns: int
) -> set[Coordinate]:
    queue = deque([origin])
    seen = {origin}
    while queue:
        current = queue.popleft()
        for neighbour in _neighbours(current, rows, columns):
            row, column = neighbour
            if maze[row][column] != WALL and neighbour not in seen:
                seen.add(neighbour)
                queue.append(neighbour)
    return seen


def _neighbours(
    coordinate: Coordinate, rows: int, columns: int
) -> Iterable[Coordinate]:
    row, column = coordinate
    for row_delta, column_delta in _DIRECTIONS:
        next_row, next_column = row + row_delta, column + column_delta
        if 0 <= next_row < rows and 0 <= next_column < columns:
            yield next_row, next_column


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=21, help="maze rows (default: 21)")
    parser.add_argument(
        "--columns", type=int, default=21, help="maze columns (default: 21)"
    )
    parser.add_argument("--seed", type=int, help="seed for reproducible generation")
    parser.add_argument(
        "--style", choices=sorted(_STYLES), default="braided", help="maze style"
    )
    parser.add_argument(
        "--braid",
        type=float,
        default=0.15,
        help="chance of opening a dead end in braided mazes (default: 0.15)",
    )
    parser.add_argument(
        "--block-density",
        type=float,
        default=0.32,
        help="wall probability in blocks mazes (default: 0.32)",
    )
    parser.add_argument("--output", type=Path, help="write to a file instead of stdout")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the command-line maze generator."""
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        maze = generate_maze(
            args.rows,
            args.columns,
            seed=args.seed,
            style=args.style,
            braid=args.braid,
            block_density=args.block_density,
        )
    except ValueError as error:
        parser.error(str(error))

    if args.output:
        write_maze(maze, args.output)
    else:
        print(maze_to_text(maze), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
