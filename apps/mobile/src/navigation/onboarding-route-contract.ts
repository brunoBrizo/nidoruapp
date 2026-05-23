export function allowsIncompleteOnboardingForRoute(
  pathname: string,
  firstLaunchParam: string | string[] | undefined,
): boolean {
  if (pathname.startsWith("/rescue-me")) {
    return true;
  }

  return pathname.startsWith("/breathe/") && parseFirstLaunch(firstLaunchParam);
}

function parseFirstLaunch(value: string | string[] | undefined): boolean {
  const firstLaunch = Array.isArray(value) ? value[0] : value;

  return firstLaunch === "1" || firstLaunch === "true";
}
