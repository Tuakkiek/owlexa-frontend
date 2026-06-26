export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';

export interface DeviceInfo {
  deviceName: string;
  deviceType: DeviceType;
}

export const detectDeviceInfo = (userAgent: string): DeviceInfo => {
  const ua = userAgent.toLowerCase();

  if (ua.includes('iphone')) {
    return { deviceName: 'iPhone', deviceType: 'MOBILE' };
  }

  if (ua.includes('ipad')) {
    return { deviceName: 'iPad', deviceType: 'TABLET' };
  }

  if (ua.includes('android')) {
    if (ua.includes('mobile')) {
      return { deviceName: 'Android Phone', deviceType: 'MOBILE' };
    }

    if (ua.includes('tablet')) {
      return { deviceName: 'Android Tablet', deviceType: 'TABLET' };
    }

    return { deviceName: 'Android Device', deviceType: 'MOBILE' };
  }

  if (ua.includes('macintosh') || ua.includes('mac os x')) {
    return { deviceName: 'Mac', deviceType: 'DESKTOP' };
  }

  if (ua.includes('windows')) {
    return { deviceName: 'Windows PC', deviceType: 'DESKTOP' };
  }

  if (ua.includes('linux')) {
    return { deviceName: 'Linux PC', deviceType: 'DESKTOP' };
  }

  return { deviceName: 'Unknown Device', deviceType: 'UNKNOWN' };
};
