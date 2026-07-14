export function evaluateBundleBudget(bytes, {
  warningBytes = 105 * 1024,
  hardLimitBytes = 120 * 1024,
  baselineBytes = null,
  growthLimitRatio = 0.1,
} = {}) {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError('Bundle bytes must be a non-negative finite number');
  if (!Number.isFinite(warningBytes) || !Number.isFinite(hardLimitBytes) || warningBytes <= 0 || hardLimitBytes < warningBytes) {
    throw new RangeError('Bundle budgets must be positive and the hard limit must not be below the warning');
  }
  if (baselineBytes !== null && (!Number.isFinite(baselineBytes) || baselineBytes <= 0)) {
    throw new RangeError('Bundle baseline must be null or a positive finite number');
  }
  if (!Number.isFinite(growthLimitRatio) || growthLimitRatio < 0) {
    throw new RangeError('Bundle growth limit must be a non-negative finite ratio');
  }
  const growthRatio = baselineBytes === null ? null : bytes / baselineBytes - 1;
  const growthPassed = growthRatio === null || growthRatio <= growthLimitRatio;
  const hardLimitPassed = bytes <= hardLimitBytes;
  return {
    bytes,
    kib: Math.round((bytes / 1024) * 100) / 100,
    warningBytes,
    hardLimitBytes,
    baselineBytes,
    growthRatio,
    growthLimitRatio,
    growthPassed,
    status: !hardLimitPassed || !growthPassed ? 'failed' : bytes > warningBytes ? 'warning' : 'passed',
    passed: hardLimitPassed && growthPassed,
  };
}
