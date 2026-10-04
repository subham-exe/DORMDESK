export function isExpectedPermissionBoundary(res: Response | number): boolean {
  const status = typeof res === 'number' ? res : res.status;
  return status === 401 || status === 403 || status === 405;
}
