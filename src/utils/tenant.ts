export const getTenantFromSubdomain = (): string | undefined => {
  const hostname = window.location.hostname;
  // e.g. center1.owlexa.com -> center1
  // If running locally, maybe something like center1.localhost
  const parts = hostname.split('.');
  if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
    return parts[0];
  }
  return undefined;
};
