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

export const BUNDLE_CATEGORIES = Object.freeze(['appJs', 'vendorJs', 'css', 'image', 'audio', 'font', 'data', 'other']);

// Classify one emitted file. Vendor chunks are produced by the Vite manualChunks rule (see vite.config.ts).
export function classifyBundleFile(fileName) {
  const name = String(fileName).split(/[\\/]/).at(-1) ?? '';
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  if (extension === 'js' || extension === 'mjs') return name.startsWith('vendor') ? 'vendorJs' : 'appJs';
  if (extension === 'css') return 'css';
  if (['png', 'webp', 'avif', 'jpg', 'jpeg', 'gif', 'svg', 'ktx2', 'basis'].includes(extension)) return 'image';
  if (['ogg', 'opus', 'mp3', 'm4a', 'wav', 'webm', 'flac'].includes(extension)) return 'audio';
  if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) return 'font';
  if (['json', 'atlas', 'bin'].includes(extension)) return 'data';
  return 'other';
}

function ratioBudget(bytes, baselineBytes, warningRatio, failRatio, hardLimitBytes) {
  const warningBytes = Math.floor(baselineBytes * (1 + warningRatio));
  const failBytes = Math.floor(baselineBytes * (1 + failRatio));
  const limit = Math.min(failBytes, hardLimitBytes ?? Number.POSITIVE_INFINITY);
  const growthRatio = bytes / baselineBytes - 1;
  const passed = bytes <= limit;
  return {
    bytes,
    kib: Math.round((bytes / 1024) * 100) / 100,
    baselineBytes,
    growthRatio,
    warningBytes,
    failBytes: limit,
    status: !passed ? 'failed' : bytes > warningBytes ? 'warning' : 'passed',
    passed,
  };
}

function absoluteBudget(bytes, warningBytes, hardLimitBytes) {
  const passed = bytes <= hardLimitBytes;
  return {
    bytes,
    kib: Math.round((bytes / 1024) * 100) / 100,
    warningBytes,
    failBytes: hardLimitBytes,
    status: !passed ? 'failed' : bytes > warningBytes ? 'warning' : 'passed',
    passed,
  };
}

// Three-way budget (TEC-05): app JS grows against a recorded remaster baseline, vendor JS against its own
// baseline plus an absolute ceiling, and shipped assets against absolute install/initial-load limits.
export function evaluateBudgetPolicy(measured, baseline, policy) {
  const required = ['appJsGzip', 'vendorJsGzip', 'cssGzip', 'initialAssetBytes', 'installAssetBytes'];
  for (const key of required) {
    if (!Number.isFinite(measured?.[key]) || measured[key] < 0) throw new RangeError(`measured.${key} must be a non-negative finite number`);
  }
  if (!Number.isFinite(baseline?.appJsGzip) || baseline.appJsGzip <= 0) throw new RangeError('baseline.appJsGzip must be positive');
  if (!Number.isFinite(baseline?.vendorJsGzip) || baseline.vendorJsGzip <= 0) throw new RangeError('baseline.vendorJsGzip must be positive');
  const budgets = {
    appJs: ratioBudget(measured.appJsGzip, baseline.appJsGzip, policy.appJs.warningGrowth, policy.appJs.failGrowth),
    vendorJs: ratioBudget(measured.vendorJsGzip, baseline.vendorJsGzip, policy.vendorJs.warningGrowth, policy.vendorJs.failGrowth, policy.vendorJs.hardLimitBytes),
    css: absoluteBudget(measured.cssGzip, policy.css.warningBytes, policy.css.hardLimitBytes),
    initialAssets: absoluteBudget(measured.initialAssetBytes, policy.assets.initialWarningBytes, policy.assets.initialLimitBytes),
    installAssets: absoluteBudget(measured.installAssetBytes, policy.assets.installWarningBytes, policy.assets.installLimitBytes),
  };
  const entries = Object.values(budgets);
  return {
    budgets,
    status: entries.some((entry) => entry.status === 'failed') ? 'failed' : entries.some((entry) => entry.status === 'warning') ? 'warning' : 'passed',
    passed: entries.every((entry) => entry.passed),
  };
}

export const DEFAULT_BUDGET_POLICY = Object.freeze({
  appJs: Object.freeze({ warningGrowth: 0.15, failGrowth: 0.25 }),
  vendorJs: Object.freeze({ warningGrowth: 0.15, failGrowth: 0.6, hardLimitBytes: 96 * 1024 }),
  css: Object.freeze({ warningBytes: 32 * 1024, hardLimitBytes: 48 * 1024 }),
  assets: Object.freeze({
    initialWarningBytes: 3 * 1024 * 1024,
    initialLimitBytes: 4 * 1024 * 1024,
    installWarningBytes: 200 * 1024 * 1024,
    installLimitBytes: 250 * 1024 * 1024,
  }),
});
