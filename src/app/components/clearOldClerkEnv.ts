// // utils/clearOldClerkEnv.ts
// export function clearOldClerkEnvironment() {
//   try {
//     const key = '__clerk_environment';
//     const saved = localStorage.getItem(key);
//     if (!saved) return;

//     // Try to parse saved Clerk environment
//     const data = JSON.parse(saved);

//     // Example: check if saved config is for another domain or missing auth_config
//     const wrongDomain =
//       typeof window !== 'undefined' &&
//       data?.display_config?.home_url &&
//       !data.display_config.home_url.includes(window.location.hostname);

//     const missingKey = !data?.auth_config?.id;

//     if (wrongDomain || missingKey) {
//       console.warn('Clearing outdated Clerk environment...');
//       localStorage.removeItem(key);
//       localStorage.removeItem('rk_environment'); // custom renamed key
//       localStorage.removeItem('clerk_telemetry_throttler');
//     }
//   } catch (err) {
//     // If parsing fails, just clear it
//     console.warn('Invalid Clerk environment detected. Clearing...');
//     localStorage.removeItem('__clerk_environment');
//     localStorage.removeItem('rk_environment');
//     localStorage.removeItem('clerk_telemetry_throttler');
//   }
// }

















// src/app/components/clearOldClerkEnv.ts
export function clearOldClerkEnvironment() {
  try {
    const key = "__clerk_environment";
    const env = localStorage.getItem(key);
    if (env) {
      const currentHost = window.location.hostname;
      const envObj = JSON.parse(env)?.value?.display_config?.home_url || "";
      const envHost = envObj ? new URL(envObj).hostname : "";

      // If the saved environment is for a different hostname, clear it
      if (envHost && envHost !== currentHost) {
        console.warn(`[Clerk] Clearing stale environment for ${envHost}, current host is ${currentHost}`);
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.error("Error checking Clerk environment:", err);
  }
}
