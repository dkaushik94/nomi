/**
 * Runtime feature flags — toggled via localStorage so no redeploy is needed.
 *
 * Enable beta features in the browser console:
 *   localStorage.setItem('nomi_beta', 'true')  // enable
 *   localStorage.removeItem('nomi_beta')         // disable
 */
export const BETA = localStorage.getItem('nomi_beta') === 'true'
