import {
  buildReferenceVerticalSlice,
  type ReferenceDocumentStore,
  type ReferenceVerticalSliceBuildOptions,
} from './reference-vertical-slice.ts';

/**
 * Restart-safe reference bootstrap.
 *
 * The application builder itself now reuses an already-successful Canvas
 * AdapterResult for the unchanged preserved representation and rehydrates the
 * historical result of the deterministic Manager correction when the same
 * review command is replayed. This wrapper intentionally does not rebuild the
 * reference slice in a separate empty repository: doing so would create a new
 * AdapterAttempt identity and incorrectly try to substitute it into historical
 * review context.
 */
export function buildRestartSafeReferenceVerticalSlice(
  durableRepo: ReferenceDocumentStore,
  options: ReferenceVerticalSliceBuildOptions = {},
) {
  return buildReferenceVerticalSlice(durableRepo, options);
}
