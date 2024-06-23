import { useCallback, useEffect, useState } from "react";

export type Permission = NotificationPermission | PermissionState;
export type RequestPermission = () => Promise<boolean>;

export function useNotification(): {
  permission: Permission;
  requested: boolean;
  requestPermission: RequestPermission;
  supported: boolean;
} {
  const [permission, setPermission] = useState<Permission>(Notification.permission);

  useEffect(() => {
    let permissionStatus: PermissionStatus;

    const onChange = () => {
      if (permissionStatus) {
        setPermission(permissionStatus.state);
      }
    };

    (async () => {
      permissionStatus = await navigator.permissions.query({ name: "notifications" });
      permissionStatus.addEventListener("change", onChange);
    })();

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener("change", onChange);
      }
    };
  }, []);

  const [requested, setRequested] = useState(false);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      return false;
    }

    setRequested(true);

    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    return permission === "granted";
  }, []);

  return {
    permission,
    requestPermission,
    requested,
    supported,
  };
}

const supported = typeof window !== "undefined" && "Notification" in window;
