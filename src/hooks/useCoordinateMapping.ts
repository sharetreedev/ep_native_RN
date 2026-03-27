import { useMemo } from 'react';
import { XanoStateCoordinate } from '../api';

interface DensityPoint {
  row: number;
  col: number;
  intensity: number;
  count: number;
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
      .forEach(c => map.set(c.id, { col: c.xAxis! + 4, row: c.yAxis! + 4 }));
    return map;
  }, [coordinates]);

  const densityData: DensityPoint[] = useMemo(() => {
    if (rawData.length === 0 || coordinates.length === 0) return [];
    const maxCount = Math.max(...rawData.map((m: any) => m.count ?? 0), 1);
    return rawData
      .filter((m: any) => {
        const cid = m.coordinate_id ?? m.id;
        return cid && coordMap.has(cid) && (m.count ?? 0) > 0;
      })
      .map((m: any) => {
        const cid = m.coordinate_id ?? m.id;
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
