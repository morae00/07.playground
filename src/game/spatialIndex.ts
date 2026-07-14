export type SpatialItem = {
  x: number;
  y: number;
  radius?: number;
};

export type SpatialBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type SpatialBoundsResolver<T> = (item: T) => SpatialBounds;

type IndexedEntry<T> = {
  item: T;
  order: number;
  bounds: SpatialBounds;
  cellKeys: string[];
};

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite; received ${value}`);
}

function validateBounds(bounds: SpatialBounds) {
  assertFinite(bounds.minX, 'bounds.minX');
  assertFinite(bounds.minY, 'bounds.minY');
  assertFinite(bounds.maxX, 'bounds.maxX');
  assertFinite(bounds.maxY, 'bounds.maxY');
  if (bounds.maxX < bounds.minX || bounds.maxY < bounds.minY) {
    throw new RangeError('Spatial bounds max values must be greater than or equal to min values');
  }
  return bounds;
}

function defaultBounds<T extends SpatialItem>(item: T): SpatialBounds {
  const radius = item.radius ?? 0;
  assertFinite(item.x, 'item.x');
  assertFinite(item.y, 'item.y');
  assertFinite(radius, 'item.radius');
  if (radius < 0) throw new RangeError(`item.radius must be non-negative; received ${radius}`);
  return {
    minX: item.x - radius,
    minY: item.y - radius,
    maxX: item.x + radius,
    maxY: item.y + radius,
  };
}

function boundsIntersectRect(bounds: SpatialBounds, query: SpatialBounds) {
  return bounds.maxX >= query.minX
    && bounds.minX <= query.maxX
    && bounds.maxY >= query.minY
    && bounds.minY <= query.maxY;
}

function boundsIntersectCircle(bounds: SpatialBounds, x: number, y: number, radius: number) {
  const closestX = Math.max(bounds.minX, Math.min(x, bounds.maxX));
  const closestY = Math.max(bounds.minY, Math.min(y, bounds.maxY));
  const dx = closestX - x;
  const dy = closestY - y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Fixed-cell broad-phase index. Results are de-duplicated and returned in
 * stable first-insertion order, independent of the cells a query traverses.
 */
export class SpatialIndex<T extends SpatialItem> {
  readonly cellSize: number;

  private readonly resolveBounds: SpatialBoundsResolver<T>;
  private readonly cells = new Map<string, IndexedEntry<T>[]>();
  private readonly entries = new Map<T, IndexedEntry<T>>();
  private nextOrder = 0;

  constructor(cellSize = 96, resolveBounds: SpatialBoundsResolver<T> = defaultBounds) {
    assertFinite(cellSize, 'cellSize');
    if (cellSize <= 0) throw new RangeError(`cellSize must be greater than zero; received ${cellSize}`);
    this.cellSize = cellSize;
    this.resolveBounds = resolveBounds;
  }

  insert(item: T) {
    const bounds = validateBounds(this.resolveBounds(item));
    const previous = this.entries.get(item);
    if (previous) this.removeFromCells(previous);

    const entry: IndexedEntry<T> = {
      item,
      bounds: { ...bounds },
      order: previous?.order ?? this.nextOrder++,
      cellKeys: this.cellKeysFor(bounds),
    };
    this.entries.set(item, entry);

    for (const key of entry.cellKeys) {
      const cell = this.cells.get(key);
      if (cell) cell.push(entry);
      else this.cells.set(key, [entry]);
    }
  }

  queryCircle(x: number, y: number, radius: number) {
    assertFinite(x, 'queryCircle.x');
    assertFinite(y, 'queryCircle.y');
    assertFinite(radius, 'queryCircle.radius');
    if (radius < 0) throw new RangeError(`queryCircle.radius must be non-negative; received ${radius}`);

    const queryBounds = {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    };
    return this.queryCandidates(queryBounds, (bounds) => boundsIntersectCircle(bounds, x, y, radius));
  }

  queryRect(x: number, y: number, width: number, height: number) {
    assertFinite(x, 'queryRect.x');
    assertFinite(y, 'queryRect.y');
    assertFinite(width, 'queryRect.width');
    assertFinite(height, 'queryRect.height');
    if (width < 0 || height < 0) {
      throw new RangeError(`queryRect dimensions must be non-negative; received ${width}x${height}`);
    }

    const queryBounds = {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    };
    return this.queryCandidates(queryBounds, (bounds) => boundsIntersectRect(bounds, queryBounds));
  }

  clear() {
    this.cells.clear();
    this.entries.clear();
    this.nextOrder = 0;
  }

  private queryCandidates(queryBounds: SpatialBounds, intersects: (bounds: SpatialBounds) => boolean) {
    const seenOrders = new Set<number>();
    const matches: IndexedEntry<T>[] = [];

    for (const key of this.cellKeysFor(queryBounds)) {
      for (const entry of this.cells.get(key) ?? []) {
        if (seenOrders.has(entry.order)) continue;
        seenOrders.add(entry.order);
        if (intersects(entry.bounds)) matches.push(entry);
      }
    }

    matches.sort((left, right) => left.order - right.order);
    return matches.map((entry) => entry.item);
  }

  private cellKeysFor(bounds: SpatialBounds) {
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);
    const keys: string[] = [];

    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        keys.push(`${cellX},${cellY}`);
      }
    }
    return keys;
  }

  private removeFromCells(entry: IndexedEntry<T>) {
    for (const key of entry.cellKeys) {
      const cell = this.cells.get(key);
      if (!cell) continue;
      const index = cell.indexOf(entry);
      if (index >= 0) cell.splice(index, 1);
      if (cell.length === 0) this.cells.delete(key);
    }
  }
}
