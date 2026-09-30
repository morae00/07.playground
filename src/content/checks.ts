// Content invariants (TEC-05, TEC-14): the content modules check their static data when they load in the dev
// server, tests, and tools. Builds skip the load-time checks, which the content contract tests run in CI anyway;
// that saves load time and about 2 KiB of app JS, and a content mistake can no longer stop the shipped app at load.
export const CHECK_CONTENT_AT_LOAD = typeof __CONTENT_CHECKS__ === 'boolean' ? __CONTENT_CHECKS__ : true;
