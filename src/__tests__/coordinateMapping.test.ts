import { coordinateToCell } from '../hooks/useCoordinateMapping';

/**
 * EP-1193 — Global Pulse dropped every check-in on the x=4 / y=4 bands because
 * it placed points with a naive `axis + 4` offset instead of this shared rule.
 * These tests pin the invariant that broke.
 */

// The live `state_coordinates` catalogue: 8 values per axis, with no zero.
const AXIS_VALUES = [-4, -3, -2, -1, 1, 2, 3, 4];

describe('coordinateToCell', () => {
  it('maps every axis pair onto the 8x8 grid', () => {
    for (const x of AXIS_VALUES) {
      for (const y of AXIS_VALUES) {
        const { row, col } = coordinateToCell(x, y);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThanOrEqual(7);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThanOrEqual(7);
      }
    }
  });

  it('covers all 64 cells exactly once — no collisions, no dead cells', () => {
    const cells = new Set<string>();
    for (const x of AXIS_VALUES) {
      for (const y of AXIS_VALUES) {
        const { row, col } = coordinateToCell(x, y);
        cells.add(`${row},${col}`);
      }
    }
    expect(cells.size).toBe(64);
  });

  it('keeps the extreme bands on-grid (the EP-1193 regression)', () => {
    // `axis + 4` put these at row/col 8, off the grid, so their check-ins
    // never rendered and silently inflated the percentage denominator.
    expect(coordinateToCell(4, 1)).toEqual({ row: 3, col: 7 });
    expect(coordinateToCell(4, -1)).toEqual({ row: 4, col: 7 });
    expect(coordinateToCell(-1, 4)).toEqual({ row: 0, col: 3 });
  });

  it('inverts Y so high energy sits at the top of the grid', () => {
    expect(coordinateToCell(1, 4).row).toBe(0); // highest energy → top row
    expect(coordinateToCell(1, -4).row).toBe(7); // lowest energy → bottom row
  });

  it('runs X left-to-right from unpleasant to pleasant with no gap at zero', () => {
    expect(coordinateToCell(-4, 1).col).toBe(0);
    expect(coordinateToCell(-1, 1).col).toBe(3);
    expect(coordinateToCell(1, 1).col).toBe(4); // no dead column between -1 and 1
    expect(coordinateToCell(4, 1).col).toBe(7);
  });
});
