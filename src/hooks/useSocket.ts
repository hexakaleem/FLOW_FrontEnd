"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/authSlice";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

export function useSocket() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const handlersRef = useRef<Map<string, (data: unknown) => void>>(new Map());

  const subscribeToLoad = useCallback(
    (loadId: string) => {
      socketRef.current?.emit("subscribe:load", loadId);
    },
    [],
  );

  const unsubscribeFromLoad = useCallback(
    (loadId: string) => {
      socketRef.current?.emit("unsubscribe:load", loadId);
    },
    [],
  );

  const onLoadStatus = useCallback((cb: (data: { loadId: string; status: string }) => void) => {
    handlersRef.current.set("load:status", cb as (data: unknown) => void);
  }, []);

  const onLoadNearby = useCallback((cb: (data: unknown) => void) => {
    handlersRef.current.set("load:nearby", cb);
  }, []);

  const onNotification = useCallback((cb: (data: unknown) => void) => {
    handlersRef.current.set("notification", cb);
  }, []);

  const onBookingRequested = useCallback((cb: (data: unknown) => void) => {
    handlersRef.current.set("booking:requested", cb);
  }, []);

  const onCounterOfferSubmitted = useCallback((cb: (data: unknown) => void) => {
    handlersRef.current.set("counteroffer:submitted", cb);
  }, []);

  const onCounterOfferAccepted = useCallback((cb: (data: unknown) => void) => {
    handlersRef.current.set("counteroffer:accepted", cb);
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleNotification = (data: unknown) => {
      const cb = handlersRef.current.get("notification");
      if (cb) cb(data);
    };
    const handleLoadNearby = (data: unknown) => {
      const cb = handlersRef.current.get("load:nearby");
      if (cb) cb(data);
    };

    socket.on("notification", handleNotification);
    socket.on("load:nearby", handleLoadNearby);
    socket.on("booking:requested", (data) => {
      const cb = handlersRef.current.get("booking:requested");
      if (cb) cb(data);
    });
    socket.on("counteroffer:submitted", (data) => {
      const cb = handlersRef.current.get("counteroffer:submitted");
      if (cb) cb(data);
    });
    socket.on("counteroffer:accepted", (data) => {
      const cb = handlersRef.current.get("counteroffer:accepted");
      if (cb) cb(data);
    });

    return () => {
      socket.off("notification", handleNotification);
      socket.off("load:nearby", handleLoadNearby);
      socket.off("booking:requested");
      socket.off("counteroffer:submitted");
      socket.off("counteroffer:accepted");
    };
  }, []);

  useEffect(() => {
    if (!accessToken || !user) {
      disconnectSocket();
      socketRef.current = null;
      return;
    }

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    // --- load:nearby (driver sees nearby loads) ---
    socket.on(
      "load:nearby",
      (data: {
        loadId: string;
        origin: { city: string; state: string; lat: number; lng: number };
        truckType: string;
        rate: number;
        pickupDate: string;
        weight: number;
      }) => {
        toast.info(`New load near you: ${data.origin.city}, ${data.origin.state}`, {
          description: `${data.truckType} — $${data.rate.toLocaleString()}`,
          duration: 8000,
        });
      },
    );

    // --- load:status (status changes via inapp:load-updated) ---
    socket.on(
      "load:status",
      (data: { loadId: string; orgId: string; status: string; changedBy: string }) => {
        toast.info(`Load ${data.loadId.slice(-6).toUpperCase()} updated`, {
          description: `Status changed to ${data.status.replace(/_/g, " ")}`,
          duration: 5000,
        });
      },
    );

    // --- load:new (new load posted to org) ---
    socket.on(
      "load:new",
      (data: { loadId: string; origin: { city: string; state: string }; truckType: string; rate: number; rateType: string; pickupDate: string; weight: number }) => {
        toast.info(`New load posted: ${data.origin.city}, ${data.origin.state}`, {
          description: `${data.truckType} · $${data.rate.toLocaleString()} · ${data.weight.toLocaleString()} lbs`,
          duration: 8000,
        });
      },
    );

    // --- notification (personal in-app alerts) ---
    socket.on(
      "notification",
      (data: unknown) => {
        const d = data as { type?: string; loadId?: string };
        const typeLabels: Record<string, string> = {
          'booking:requested': 'New Booking Request',
          'booking:confirmed': 'Booking Confirmed',
          'booking:denied': 'Booking Denied',
          'counteroffer:submitted': 'New Counter-Offer',
          'counteroffer:accepted': 'Counter-Offer Accepted',
        };
        const label = typeLabels[d.type || ''] || 'Notification';
        toast.info(label, {
          description: d.loadId ? `Load ${d.loadId.slice(-6).toUpperCase()}` : undefined,
          duration: 6000,
        });
      },
    );

    // --- booking:requested (broker gets notified) ---
    socket.on(
      "booking:requested",
      (data: {
        bookingRequestId: string;
        loadId: string;
        brokerUserId: string;
        brokerOrgId: string;
        carrierUserId: string;
        carrierOrgId: string;
        proposedRate: number | null;
      }) => {
        toast.success("New booking request!", {
          description: `Carrier requested booking for load ${data.loadId.slice(-6).toUpperCase()} — $${data.proposedRate?.toLocaleString() ?? "listed rate"}`,
          duration: 10000,
        });
      },
    );

    // --- booking:confirmed (carrier gets notified) ---
    socket.on(
      "booking:confirmed",
      (data: {
        loadId: string;
        bookingRequestId: string;
        brokerUserId: string;
        carrierUserId: string;
        carrierOrgId: string;
      }) => {
        toast.success("Booking confirmed!", {
          description: `Load ${data.loadId.slice(-6).toUpperCase()} has been booked`,
          duration: 8000,
        });
      },
    );

    // --- booking:denied ---
    socket.on(
      "booking:denied",
      (data: { loadId: string; bookingRequestId: string; brokerUserId: string; carrierUserId: string }) => {
        toast.error("Booking request denied", {
          description: `Your booking for load ${data.loadId.slice(-6).toUpperCase()} was not accepted`,
          duration: 8000,
        });
      },
    );

    // --- counteroffer:submitted ---
    socket.on(
      "counteroffer:submitted",
      (data: { counterOfferId: string; loadId: string; offeredBy: string; offeredTo: string; proposedRate: number | null }) => {
        toast.info("New counter-offer", {
          description: `Counter-offer of $${data.proposedRate?.toLocaleString() ?? "N/A"} on load ${data.loadId.slice(-6).toUpperCase()}`,
          duration: 10000,
        });
      },
    );

    // --- counteroffer:accepted ---
    socket.on(
      "counteroffer:accepted",
      (data: { counterOfferId: string; loadId: string; acceptedBy: string; acceptedByRole: string }) => {
        toast.success("Counter-offer accepted!", {
          description: `Load ${data.loadId.slice(-6).toUpperCase()} booked via counter-offer`,
          duration: 8000,
        });
      },
    );

    return () => {
      socket.off("load:nearby");
      socket.off("load:status");
      socket.off("load:new");
      socket.off("notification");
      socket.off("booking:requested");
      socket.off("booking:confirmed");
      socket.off("booking:denied");
      socket.off("counteroffer:submitted");
      socket.off("counteroffer:accepted");
    };
  }, [accessToken, user, dispatch]);

  return { subscribeToLoad, unsubscribeFromLoad, onLoadStatus, onLoadNearby, onNotification, onBookingRequested, onCounterOfferSubmitted, onCounterOfferAccepted };
}
