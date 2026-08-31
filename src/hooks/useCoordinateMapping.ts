import { useMemo } from 'react';
import { XanoStateCoordinate } from '../api';

interface DensityPoint {
  row: number;
  col: number;
  intensity: number;
  count: number;
}

/**
 * Translate a state-coordinate's axis pair to a cell on the 8x8 grid.
 *
 * Axis values are (-4,-3,-2,-1,1,2,3,4) — there is no zero — so a naive
 * `axis + 4` offset shifts every positive value by one and pushes the x=4 /
 * y=4 bands off the grid entirely. Y is also inverted, because the grid runs
 * top-to-bottom (high energy → low energy) while the axis runs bottom-to-top.
 * Exported so the invariant is testable and every pulse view shares one
 * placement rule (EP-1193).
 *
 * X: left-to-right (unpleasant → pleasant)
 */
export function coordinateToCell(x: number, y: number): { row: number; col: number } {
  return {
    col: x > 0 ? x + 3 : x + 4,
    row: y > 0 ? 4 - y : 3 - y,
  };
}

/**
 * Builds a coordinate lookup map and density overlay data from raw check-in counts.
 */
export function useCoordinateMapping(
  coordinates: XanoStateCoordinate[],
  rawData: any[] = [],
) {
  const coordMap = useMemo(() => {
    const map = new Map<number, { row: number; col: number }>();
    coordinates
      .filter(c => c.xAxis != null && c.yAxis != null)
      .forEach(c => {
        map.set(c.id, coordinateToCell(c.xAxis!, c.yAxis!));
      });
    return map;
  }, [coordinates]);

  const densityData: DensityPoint[] = useMemo(() => {
    if (rawData.length === 0 || coordinates.length === 0) return [];
    const maxCount = Math.max(...rawData.map((m: any) => m.count ?? 0), 1);
    return rawData
      .filter((m: any) => {
        const cid = m.coordinate_id ?? m.id ?? m.stateCoordinates;
        return cid && coordMap.has(cid) && (m.count ?? 0) > 0;
      })
      .map((m: any) => {
        const cid = m.coordinate_id ?? m.id ?? m.stateCoordinates;
        const pos = coordMap.get(cid)!;
        return {
          row: pos.row,
          col: pos.col,
          intensity: m.count / maxCount,
          count: m.count,
        };
      });
  }, [rawData, coordinates, coordMap]);

  return { coordMap, densityData };
}
