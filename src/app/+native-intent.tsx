/**
 * iOS share extension reopens the app with `wearlog://dataUrl=…`; that is not a screen, so send it
 * home and let ShareIntentRouter (root layout) read the shared payload.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.includes('dataUrl=') ? '/' : path;
}
