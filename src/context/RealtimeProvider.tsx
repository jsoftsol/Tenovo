"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

import { useAppContext } from "@/context/AppContext";
import type RealtimeNotification from "@/types/realtime-notification";

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership: { organization } } = useAppContext();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
    });

    socket.emit("organization:join", organization.id);

    socket.on("notification:new", (notification: RealtimeNotification) => {
      toast[notification.type](notification.title, {
        description: notification.message,
      });
    });

    return () => {
      socket.emit("organization:leave", organization.id);
      socket.disconnect();
    };
  }, [organization.id]);

  return children;
}