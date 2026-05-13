"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPinLine,
  ChatText,
  FileText,
  Star,
  Truck,
  ArrowClockwise,
  CurrencyDollar,
  CheckCircle,
  XCircle,
  Warning,
  CircleNotch,
  BookmarkSimple,
  CalendarBlank,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingEntry {
  _id: string;
  loadId: string;
  loadDetails?: {
    _id: string;
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    truckType: string;
    status: string;
    pickupDate: string;
    deliveryDate: string;
  };
  status: string;
  proposedRate: number | null;
  originalRate?: number;
  counterAmount?: number;
  respondedAt: string | null;
  createdAt: string;
  assignedDriver?: string;
  assignedTruck?: string;
  carrierOrgName?: string;
}

const TABS = ["Active", "Pending Bids", "Completed", "Cancelled"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  switch (status) {
    case "accepted":
    case "won":
    case "booked":
      return "badge-pill badge-pill-green";
    case "in_transit":
      return "badge-pill badge-pill-amber";
    case "pending":
    case "sent":
      return "badge-pill badge-pill-indigo";
    case "countered":
      return "badge-pill badge-pill-amber";
    case "denied":
    case "declined":
      return "badge-pill badge-pill-red";
    case "delivered":
      return "badge-pill badge-pill-green";
    case "cancelled":
    case "expired":
      return "badge-pill badge-pill-red";
    default:
      return "badge-pill badge-pill-gray";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Won";
    case "pending":
      return "Sent";
    case "in_transit":
      return "In Transit";
    case "countered":
      return "Countered";
    case "denied":
      return "Denied";
    case "cancelled":
      return "Cancelled";
    case "delivered":
      return "Delivered";
    case "booked":
      return "Booked";
    case "expired":
      return "Expired";
    default:
      return status.replace(/_/g, " ");
  }
}

function equipmentBadge(truckType: string) {
  const t = truckType?.toLowerCase() || "";
  if (t === "flatbed") return "badge-pill badge-pill-blue";
  if (t === "reefer") return "badge-pill badge-pill-indigo";
  if (t === "dry_van" || t === "dry van") return "badge-pill badge-pill-green";
  if (t === "step_deck" || t === "step deck") return "badge-pill badge-pill-amber";
  return "badge-pill badge-pill-gray";
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MyBookingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Active");

  // Counter Dialog State
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Fetch my bookings
  // -----------------------------------------------------------------------
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/marketplace/bookings");
      setBookings(res.data?.data ?? []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to load bookings";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const didFetchRef = React.useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchBookings();
  }, [fetchBookings]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleAcceptCounter = async (loadId: string, offerId?: string) => {
    if (!offerId) return;
    setActionLoading(offerId);
    try {
      await api.post(`/loads/${loadId}/counteroffer/${offerId}/accept`);
      toast.success("Counter offer accepted!");
      fetchBookings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to accept counter";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const openCounterDialog = (loadId: string, bookingId?: string) => {
    if (!bookingId) return;
    setSelectedLoadId(loadId);
    setSelectedBookingId(bookingId);
    setCounterValue("");
    setShowCounterDialog(true);
  };

  const handleSendCounter = async () => {
    if (!selectedBookingId || !selectedLoadId) return;
    if (!counterValue || isNaN(Number(counterValue))) {
      toast.error("Please enter a valid rate");
      return;
    }
    setActionLoading(selectedBookingId);
    try {
      await api.post(`/loads/${selectedLoadId}/counteroffer`, {
        proposedRate: Number(counterValue),
      });
      toast.success("Counter offer sent!");
      setShowCounterDialog(false);
      fetchBookings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to send counter";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineCounter = async (loadId: string, bookingId?: string) => {
    if (!bookingId) return;
    setActionLoading(bookingId);
    try {
      await api.put(`/loads/${loadId}/bookings/${bookingId}/cancel`);
      toast.success("Bid declined");
      fetchBookings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to decline";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBid = async (loadId: string, bookingId?: string) => {
    if (!bookingId) return;
    setActionLoading(bookingId);
    try {
      await api.put(`/loads/${loadId}/bookings/${bookingId}/cancel`);
      toast.success("Booking request cancelled");
      fetchBookings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to cancel booking";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // -----------------------------------------------------------------------
  // Filtering
  // -----------------------------------------------------------------------

  const filteredBookings = bookings.filter((b) => {
    const s = b.status;
    const ls = b.loadDetails?.status;
    switch (activeTab) {
      case "Active":
        return s === "accepted" || ls === "booked" || ls === "in_transit";
      case "Pending Bids":
        return s === "pending" || s === "countered";
      case "Completed":
        return ls === "delivered" || (s === "accepted" && ls === "delivered");
      case "Cancelled":
        return (
          s === "denied" ||
          s === "cancelled" ||
          s === "expired" ||
          ls === "cancelled"
        );
      default:
        return true;
    }
  });

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink flex items-center gap-3">
            <BookmarkSimple size={28} weight="bold" className="text-ink" />
            My Bookings
          </h1>
          <p className="text-sm font-bold text-muted  mt-1">
            Track and manage your bids and active shipments
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="btn btn-secondary h-12 w-12 shadow-sm"
          title="Refresh"
        >
          <ArrowClockwise
            size={20}
            weight="bold"
            className={isLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap px-6 py-3 text-[11px] font-semibold  rounded-md border transition-all",
              activeTab === tab
                ? "bg-primary border-primary text-white shadow-sm"
                : "bg-card border-hairline text-muted hover:border-muted hover:text-ink",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-hairline bg-card animate-pulse"
            />
          ))
        ) : error && bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <Warning size={48} weight="thin" className="mb-4 opacity-20" />
            <p className="font-bold  text-xs">
              {error}
            </p>
            <button
              onClick={fetchBookings}
              className="btn btn-secondary mt-4  font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <BookmarkSimple
              size={48}
              weight="thin"
              className="mb-4 opacity-20"
            />
            <p className="font-bold  text-xs">
              No bookings found
            </p>
            <p className=" text-muted mt-1">
              {activeTab === "Active"
                ? "Start bidding on loads in the marketplace"
                : `No ${activeTab.toLowerCase()} bookings`}
            </p>
            {activeTab === "Active" || activeTab === "Pending Bids" ? (
              <button
                onClick={() => router.push("/marketplace")}
                className="btn btn-primary h-12 px-6 mt-6  font-semibold "
              >
                Browse Marketplace
              </button>
            ) : null}
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const ld = booking.loadDetails;
            if (!ld) return null;

            const isCountered = booking.status === "countered";
            const isActive = activeTab === "Active";
            const isPending = activeTab === "Pending Bids";
            const isCompleted = activeTab === "Completed";

            return (
              <div
                key={booking._id}
                className={cn(
                  "rounded-xl border p-5 transition-all hover:border-primary/20 cursor-pointer group shadow-sm",
                  isCountered
                    ? "border-warning/40 bg-warning-light/30"
                    : "border-hairline bg-card",
                )}
                onClick={() => router.push(`/loads/${ld._id}`)}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="badge badge-pill badge-pill-blue h-7 px-3">
                      FL-{ld._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-ink tracking-tight">
                        {ld.origin.city}, {ld.origin.state}
                      </span>
                      <ArrowRight
                        size={14}
                        weight="bold"
                        className="text-muted"
                      />
                      <span className="text-base font-semibold text-ink tracking-tight">
                        {ld.destination.city}, {ld.destination.state}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "badge  px-3 py-1 h-7",
                        statusBadge(booking.status),
                      )}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  {/* Rate */}
                  <div className="text-right shrink-0">
                    {isCountered && booking.originalRate ? (
                      <>
                        <div className=" font-bold text-muted line-through">
                          ${booking.originalRate.toLocaleString()}
                        </div>
                        <div className="text-xl font-semibold text-warning tracking-tight">
                          $
                          {(
                            booking.counterAmount || booking.proposedRate
                          )?.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-semibold text-success tracking-tight">
                        $
                        {(
                          booking.proposedRate ||
                          booking.originalRate ||
                          0
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub info */}
                <div className="flex items-center gap-4 text-xs font-bold text-muted mb-4 flex-wrap">
                  <span
                    className={cn(
                      "badge text-[9px]",
                      equipmentBadge(ld.truckType),
                    )}
                  >
                    {ld.truckType}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarBlank size={12} weight="bold" />
                    {formatDate(ld.pickupDate)} – {formatDate(ld.deliveryDate)}
                  </span>
                  {booking.assignedDriver && (
                    <span className="flex items-center gap-1">
                      <Truck size={12} weight="bold" />
                      {booking.assignedDriver}
                      {booking.assignedTruck
                        ? ` · ${booking.assignedTruck}`
                        : ""}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {isActive && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tracking/${ld._id}`);
                        }}
                        className="btn btn-primary btn-sm h-10 px-5  font-semibold"
                      >
                        <MapPinLine size={16} weight="bold" /> Track Shipment
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/messaging");
                        }}
                        className="btn btn-secondary btn-sm h-10 px-5  font-semibold"
                      >
                        <ChatText size={16} weight="bold" /> Open Chat
                      </button>
                    </>
                  )}

                  {isPending && isCountered && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptCounter(ld._id, booking._id);
                        }}
                        disabled={actionLoading === booking._id}
                        className="btn btn-sm h-10 px-5  font-semibold"
                        style={{
                          backgroundColor: "var(--success)",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {actionLoading === booking._id ? (
                          <CircleNotch
                            size={12}
                            weight="bold"
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <CheckCircle size={16} weight="bold" /> Accept
                            Counter
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCounterDialog(ld._id, booking._id);
                        }}
                        disabled={actionLoading === booking._id}
                        className="btn btn-secondary btn-sm h-10 px-5  font-semibold"
                      >
                        {actionLoading === booking._id ? (
                          <CircleNotch
                            size={12}
                            weight="bold"
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <CurrencyDollar size={16} weight="bold" /> Send
                            Counter
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeclineCounter(ld._id, booking._id);
                        }}
                        disabled={actionLoading === booking._id}
                        className="btn btn-sm h-10 px-5  font-semibold text-danger border border-danger/30 hover:bg-danger-light"
                      >
                        {actionLoading === booking._id ? (
                          <CircleNotch
                            size={12}
                            weight="bold"
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <XCircle size={16} weight="bold" /> Decline
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {isPending && !isCountered && (
                    <div className="flex gap-2 items-center">
                      <span className=" font-bold text-muted italic">
                        Awaiting broker response...
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBid(ld._id, booking._id);
                        }}
                        disabled={actionLoading === booking._id}
                        className="btn btn-sm h-9 px-4  font-semibold text-danger border border-danger/30 hover:bg-danger-light"
                      >
                        {actionLoading === booking._id ? (
                          <CircleNotch
                            size={12}
                            weight="bold"
                            className="animate-spin"
                          />
                        ) : (
                          <>
                            <XCircle size={14} weight="bold" /> Cancel
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/documents`);
                        }}
                        className="btn btn-secondary btn-sm h-10 px-5  font-semibold"
                      >
                        <FileText size={16} weight="bold" /> View Invoice
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reviews`);
                        }}
                        className="btn btn-sm h-10 px-5  font-semibold"
                        style={{
                          backgroundColor: "var(--warning)",
                          color: "white",
                          border: "none",
                        }}
                      >
                        <Star size={16} weight="fill" /> Rate Broker
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Counter Offer Dialog */}
      <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Send Counter Offer</DialogTitle>
            <DialogDescription>
              Enter the rate you would like to propose to the broker for this load.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rate">Proposed Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="0.00"
                value={counterValue}
                onChange={(e) => setCounterValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCounterDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendCounter}
              disabled={actionLoading !== null}
            >
              {actionLoading !== null ? "Sending..." : "Send Counter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
