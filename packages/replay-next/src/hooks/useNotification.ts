import { useCallback, useState, useSyncExternalStore } from "react";

export type Permission = NotificationPermission | PermissionState;
export type RequestPermission = () => Promise<boolean>;

export function useNotification(): {
  permission: Permission;
  requested: boolean;
  requestPermission: RequestPermission;
  supported: boolean;
} {
  const permission = useSyncExternalStore(
    function subscribe(change: () => void) {
      let permissionStatus: PermissionStatus;

      (async () => {
        permissionStatus = await navigator.permissions.query({ name: "notifications" });
        permissionStatus.addEventListener("change", change);
      })();

      return () => {
        if (permissionStatus) {
          permissionStatus.removeEventListener("change", change);
        }
      };
    },
    () => Notification.permission,
    () => Notification.permission
  );

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
