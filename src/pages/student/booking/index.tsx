import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Typography,
  Select,
  Modal,
  Input,
  Spin,
  Empty,
  Tabs,
  Pagination,
  message,
  Alert,
  Tag,
  Space,
  Card,
  Checkbox,
  Table,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import {
  getNextSemester,
  getAvailableRoomTypes,
  getDormsForBooking,
  getFloorsForBooking,
  getBlocksForBooking,
  getRoomsForBooking,
  getBedsForBooking,
  submitBooking,
  checkPaymentStatus,
  createPayosLink,
  getMyBookings,
  cancelBookingRequest,
  getBookingWindowStatus,
  keepBed,
  softLockBed,
  softUnlockBed,
  getSoftLockedBeds,
} from '@/lib/actions';
import type { BookingWindowStatusResponse } from '@/lib/actions';
import type {
  NextSemesterInfo,
  BookingRoomType,
  BookingDorm,
  BookingFloor,
  BookingBlock,
  BookingRoom,
  BookingBed,
  BookingRequestItem,
  BookingInvoice,
  SubmitBookingResponse,
} from '@/lib/actions';
import { useWindowSize } from '@/hooks/useWindowSize';
import { connectSocket } from '@/lib/socket';
import { brandPalette } from '@/themes/brandPalette';

const { Title, Text } = Typography;
const { TextArea } = Input;

type BedCard = BookingBed & {
  room_number: string;
  price_per_semester: number;
  room_type: string;
  floor: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  awaiting_payment: { color: 'warning', icon: <ClockCircleOutlined />, label: 'Awaiting Payment' },
  approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Approved' },
  cancelled: { color: 'default', icon: <CloseCircleOutlined />, label: 'Cancelled' },
  expired: { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Expired' },
};

const Booking: React.FC = () => {
  const [, modalContextHolder] = Modal.useModal();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  // ─── Booking window state ───
  const [windowStatus, setWindowStatus] = useState<BookingWindowStatusResponse | null>(null);
  const [windowLoading, setWindowLoading] = useState(true);
  const [windowRefreshing, setWindowRefreshing] = useState(false);
  const [checkingHoldStatus, setCheckingHoldStatus] = useState(false);

  // ─── Tab state ───
  const [activeTab, setActiveTab] = useState('new');

  // ─── New Booking state ───
  const [, setView] = useState<'form' | 'payment'>('form');
  const [semester, setSemester] = useState<NextSemesterInfo | null>(null);
  const [roomTypes, setRoomTypes] = useState<BookingRoomType[]>([]);
  const [dorms, setDorms] = useState<BookingDorm[]>([]);
  const [floors, setFloors] = useState<BookingFloor[]>([]);
  const [blocks, setBlocks] = useState<BookingBlock[]>([]);
  const [allBeds, setAllBeds] = useState<BedCard[]>([]);

  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedCard | null>(null);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState({
    semester: false,
    roomTypes: false,
    dorms: false,
    floors: false,
    blocks: false,
    beds: false,
    submit: false,
  });

  const [confirmModal, setConfirmModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmKeepModal, setConfirmKeepModal] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);

  // ─── Payment state ───
  const [paymentBooking, setPaymentBooking] = useState<BookingRequestItem | null>(null);
  const [, setPaymentInvoice] = useState<BookingInvoice | null>(null);
  const [payos, setPayos] = useState<SubmitBookingResponse['payos'] | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const payosWindowRef = useRef<Window | null>(null);
  const payosClosedCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useLocation();

  // ─── My Requests state ───
  const [myBookings, setMyBookings] = useState<BookingRequestItem[]>([]);
  const [myBookingsPage, setMyBookingsPage] = useState(1);
  const [myBookingsTotal, setMyBookingsTotal] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ─── Hold bed state ───
  const [activeBooking, setActiveBooking] = useState<BookingRequestItem | null>(null);
  const [loadingKeep, setLoadingKeep] = useState(false);

  // ─── Soft lock state ───
  const softLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Beds removed from the grid due to a soft lock — restored on unlock
  const removedByLockRef = useRef<Map<string, BedCard>>(new Map());
  // Beds removed via bed_reserved — restored if booking is later cancelled
  const reservedBedsRef = useRef<Map<string, BedCard>>(new Map());
  // Timer for the 5-min hold-bed soft lock TTL (matches backend LOCK_TTL_MS)
  const holdLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref so socket handlers always read the latest windowStatus.bed_id without stale closure
  const windowBedIdRef = useRef<string | null>(null);
  // True while A has the Confirm Bed Hold modal open — prevents A's own soft-lock from showing "Cannot Hold Bed"
  const isHoldingOwnBedRef = useRef(false);
  // True only when another student locked A's hold-bed (so we know to reload when their lock expires)
  const bedTakenByOtherRef = useRef(false);
  const loadNewBookingStateRef = useRef<(() => Promise<void>) | null>(null);
  const loadMyBookingsRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    checkWindow();
  }, []);

  // Keep windowBedIdRef in sync so socket handlers always read the latest value
  useEffect(() => {
    windowBedIdRef.current = windowStatus?.bed_id ?? null;
  }, [windowStatus]);

  // Listen directly on the socket so the page updates in real-time when
  // the manager saves a new date config, without relying on a DOM-event chain.
  useEffect(() => {
    const socket = connectSocket();
    const handleConfigUpdated = () => refreshWindow();
    const handleBedLocked = ({ bedId }: { bedId: string }) => {
      // B selected A's hold-bed → show Cannot Hold Bed on A's side immediately
      // Skip if A locked it themselves (modal is open)
      if (windowBedIdRef.current === bedId) {
        if (!isHoldingOwnBedRef.current) {
          bedTakenByOtherRef.current = true;
          setWindowStatus(prev =>
            prev ? { ...prev, bed_taken: true, bed_taken_reason: 'Another student is currently selecting your bed.' } : prev
          );
        }
        return;
      }
      setAllBeds(prev => {
        const bed = prev.find(b => b.id === bedId);
        if (bed) removedByLockRef.current.set(bedId, bed);
        return prev.filter(b => b.id !== bedId);
      });
    };
    const handleBedUnlocked = ({ bedId }: { bedId: string }) => {
      // B's soft lock on A's hold-bed released/expired → restore "Hold Bed" button without reloading
      if (windowBedIdRef.current === bedId) {
        if (bedTakenByOtherRef.current) {
          bedTakenByOtherRef.current = false;
          setWindowStatus(prev =>
            prev ? { ...prev, bed_taken: false, bed_taken_reason: undefined } : prev
          );
        }
        return;
      }
      // Check both maps: soft-locked beds and beds that were reserved but booking was cancelled
      const bed = removedByLockRef.current.get(bedId) ?? reservedBedsRef.current.get(bedId);
      if (bed) {
        removedByLockRef.current.delete(bedId);
        reservedBedsRef.current.delete(bedId);
        setAllBeds(prev => {
          if (prev.some(b => b.id === bedId)) return prev;
          return [...prev, bed].sort((a, b) => Number(a.bed_number) - Number(b.bed_number));
        });
      }
    };
    const handleBedReserved = ({ bedId }: { bedId: string }) => {
      // Move bed from removedByLockRef to reservedBedsRef so it can be restored if booking is cancelled
      const bed = removedByLockRef.current.get(bedId);
      if (bed) {
        reservedBedsRef.current.set(bedId, bed);
        removedByLockRef.current.delete(bedId);
      }
      setAllBeds(prev => {
        // If bed wasn't in removedByLockRef (missed bed_soft_locked event), capture it from current list
        if (!reservedBedsRef.current.has(bedId)) {
          const bedInList = prev.find(b => b.id === bedId);
          if (bedInList) reservedBedsRef.current.set(bedId, bedInList);
        }
        return prev.filter(b => b.id !== bedId);
      });
    };
    socket.on('booking_config_updated', handleConfigUpdated);
    socket.on('bed_soft_locked', handleBedLocked);
    socket.on('bed_soft_unlocked', handleBedUnlocked);
    socket.on('bed_reserved', handleBedReserved);
    socket.on('booking_window_status_changed', handleConfigUpdated);
    return () => {
      socket.off('booking_config_updated', handleConfigUpdated);
      socket.off('bed_soft_locked', handleBedLocked);
      socket.off('bed_soft_unlocked', handleBedUnlocked);
      socket.off('bed_reserved', handleBedReserved);
      socket.off('booking_window_status_changed', handleConfigUpdated);
    };
  }, []);

  useEffect(() => {
    if (windowStatus?.allowed) {
      loadSemester();
      if (windowStatus.window_type === 'hold') {
        loadActiveBooking();
      } else {
        setCheckingHoldStatus(true);
        loadActiveBooking().then(alreadyHeld => {
          setCheckingHoldStatus(false);
          if (!alreadyHeld) void loadNewBookingStateRef.current?.();
        });
      }
    }
  }, [windowStatus]);

  useEffect(() => {
    if (activeTab === 'my') void loadMyBookingsRef.current?.();
  }, [activeTab, myBookingsPage]);

  useEffect(() => {
    if (windowStatus?.dorm_booking_suspended) {
      void loadMyBookingsRef.current?.();
    }
  }, [windowStatus?.dorm_booking_suspended]);

  // Release soft lock when navigating away
  useEffect(() => {
    return () => {
      if (selectedBed) softUnlockBed(selectedBed.id).catch(() => { });
      if (softLockTimerRef.current) clearTimeout(softLockTimerRef.current);
    };
  }, [selectedBed]);

  // Countdown chỉ bắt đầu khi người dùng click "Click to pay"
  // The countdown starts only after the user clicks "Click to pay"
  useEffect(() => {
    if (paymentStarted && paymentBooking?.expires_at) {
      const expiresAt = new Date(paymentBooking.expires_at).getTime();
      const tick = () => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current);
      };
      tick();
      countdownRef.current = setInterval(tick, 1000);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [paymentStarted, paymentBooking]);

  // Automatically return to the form when time runs out (3s after showing the expired message)
  useEffect(() => {
    if (!paymentStarted || !paymentBooking?.expires_at || countdown !== 0) return;
    const expiresAt = new Date(paymentBooking.expires_at).getTime();
    if (Date.now() < expiresAt) return; // countdown=0 before the first tick does not mean it is truly expired yet
    const t = setTimeout(() => {
      message.warning('Booking expired. The bed has been released.');
      resetForm();
      setView('form');
      loadRoomTypes();
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, paymentStarted]);

  // When the user returns to the tab after using PayOS (cancel or complete), automatically re-check status
  useEffect(() => {
    if (!paymentStarted || !paymentBooking) return;
    const bookingId = paymentBooking.id;
    const handleFocus = async () => {
      try {
        const result = await checkPaymentStatus(bookingId);
        if (result.status === 'cancelled' || result.status === 'expired') {
          message.info('Booking was cancelled. The bed has been released.');
          resetForm();
          setView('form');
          if (windowStatus?.window_type === 'hold') loadActiveBooking();
          else loadRoomTypes();
        } else if (result.paid || result.status === 'approved') {
          if (windowStatus?.window_type === 'hold') {
            setHoldSuccess(true);
            resetForm();
            setView('form');
          } else {
            message.success('Payment confirmed! Your booking is approved.');
            resetForm(); setView('form'); setActiveTab('my'); loadMyBookings();
          }
        }
      } catch (err: unknown) {
        // Booking deleted (cancelled via webhook) → reset to Keep Bed
        if ((err as { statusCode?: number })?.statusCode === 404) {
          resetForm();
          setView('form');
          if (windowStatus?.window_type === 'hold') loadActiveBooking();
          else loadRoomTypes();
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStarted, paymentBooking]);

  // Real-time: listen for socket-pushed payment result events dispatched by StudentLayout
  useEffect(() => {
    if (!paymentStarted || !paymentBooking) return;

    const handleApproved = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (windowStatus?.window_type === 'hold') {
        setHoldSuccess(true);
        resetForm();
        setView('form');
      } else {
        resetForm(); setView('form'); setActiveTab('my'); loadMyBookings();
      }
    };

    const handleCancelled = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      resetForm(); setView('form');
      if (windowStatus?.window_type === 'hold') loadActiveBooking();
      else loadRoomTypes();
    };

    window.addEventListener('student:booking:approved', handleApproved);
    window.addEventListener('student:booking:cancelled', handleCancelled);
    return () => {
      window.removeEventListener('student:booking:approved', handleApproved);
      window.removeEventListener('student:booking:cancelled', handleCancelled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStarted, paymentBooking]);

  // Fallback poll every 5 s in case the webhook is delayed or socket is unavailable
  useEffect(() => {
    if (!paymentStarted || !paymentBooking) return;
    const bookingId = paymentBooking.id;
    pollRef.current = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(bookingId);
        if (result.status === 'cancelled' || result.status === 'expired') {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          resetForm(); setView('form');
          if (windowStatus?.window_type !== 'hold') loadRoomTypes();
        } else if (result.paid || result.status === 'approved') {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          if (windowStatus?.window_type === 'hold') {
            setHoldSuccess(true); resetForm(); setView('form');
          } else {
            resetForm(); setView('form'); setActiveTab('my'); loadMyBookings();
          }
        }
      } catch (err: unknown) {
        // Booking was deleted (cancelled via webhook) → reset to Keep Bed
        if ((err as { statusCode?: number })?.statusCode === 404) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          resetForm(); setView('form');
          if (windowStatus?.window_type === 'hold') loadActiveBooking();
          else loadRoomTypes();
        }
      }
    }, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStarted, paymentBooking]);

  // Resume payment if the user navigates here from the payment page
  useEffect(() => {
    const state = location.state as { resumeBookingId?: string } | null;
    if (state?.resumeBookingId) {
      getMyBookings({ page: 1, limit: 50 }).then(data => {
        const booking = data.items.find(b => b.id === state.resumeBookingId);
        if (booking && booking.status === 'awaiting_payment') {
          handleResumePayment(booking);
        }
      }).catch(() => { });
      // Clear the navigation state so refresh does not trigger resume again
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── API calls ───

  const loadActiveBooking = async (): Promise<boolean> => {
    try {
      const [data, targetSemInfo] = await Promise.all([
        getMyBookings({ page: 1, limit: 50 }),
        getNextSemester(),
      ]);
      const targetSem = targetSemInfo?.semester;
      const now = new Date();
      const active = data.items.find(
        (b) => b.status === 'approved' && new Date(b.end_date) > now && (!targetSem || b.semester !== targetSem)
      ) ?? null;
      setActiveBooking(active);
      // Only flag as already kept if there's an approved, non-checked-out booking for the exact target semester
      const alreadyKept = active != null && !!targetSem && data.items.some(
        (b) => b.status === 'approved' && b.semester === targetSem && !b.checkout_date
      );
      if (alreadyKept) {
        setHoldSuccess(true);
        return true;
      }
      // Restore "Awaiting Payment" state if there's already a pending keepBed booking for the target semester
      const pendingKeep = active != null && !!targetSem
        ? data.items.find(
          (b) => b.status === 'awaiting_payment' && b.semester === targetSem && !b.checkout_date
        ) ?? null
        : null;
      if (pendingKeep) {
        // Immediately verify PayOS status — avoids waiting for webhook/polling
        try {
          const statusResult = await checkPaymentStatus(pendingKeep.id);
          if (statusResult.status === 'cancelled' || statusResult.status === 'expired') {
            await cancelBookingRequest(pendingKeep.id).catch(() => { });
            return false; // stay on hold-bed view; activeBooking is already set above
          }
          if (statusResult.paid || statusResult.status === 'approved') {
            setHoldSuccess(true);
            return true;
          }
        } catch { /* booking already deleted or network error — fall through to restore view */ }

        // Still genuinely awaiting payment: restore payment view
        setPaymentBooking(pendingKeep);
        setPaymentInvoice(pendingKeep.invoice || null);
        setPayos(
          pendingKeep.payos
            ? {
              orderCode: pendingKeep.payos.orderCode ? Number(pendingKeep.payos.orderCode) : 0,
              paymentLinkId: pendingKeep.payos.paymentLinkId || null,
              checkoutUrl: pendingKeep.payos.checkoutUrl || null,
              qrCode: pendingKeep.payos.qrCode || null,
            }
            : null
        );
        setPaymentStarted(true);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  // For new-booking window: detect a pending booking when returning from PayOS cancel/success
  const loadNewBookingState = async () => {
    try {
      const data = await getMyBookings({ page: 1, limit: 50 });
      const pending = data.items.find(b => b.status === 'awaiting_payment');
      if (pending) {
        // Immediately verify PayOS status — avoids waiting for webhook/polling
        try {
          const statusResult = await checkPaymentStatus(pending.id);
          if (statusResult.status === 'cancelled' || statusResult.status === 'expired') {
            await cancelBookingRequest(pending.id).catch(() => { });
            loadRoomTypes();
            return;
          }
          if (statusResult.paid || statusResult.status === 'approved') {
            resetForm(); setView('form'); setActiveTab('my'); loadMyBookings();
            return;
          }
        } catch { /* booking already deleted or network error — fall through to restore view */ }

        // Still genuinely awaiting payment: restore payment view
        setPaymentBooking(pending);
        setPaymentInvoice(pending.invoice || null);
        setPayos(
          pending.payos
            ? {
              orderCode: pending.payos.orderCode ? Number(pending.payos.orderCode) : 0,
              paymentLinkId: pending.payos.paymentLinkId || null,
              checkoutUrl: pending.payos.checkoutUrl || null,
              qrCode: pending.payos.qrCode || null,
            }
            : null
        );
        setPaymentStarted(true);
        setView('payment');
        return;
      }
    } catch { /* ignore */ }
    loadRoomTypes();
  };

  const handleKeepBed = async () => {
    setLoadingKeep(true);
    try {
      const result = await keepBed();
      setPaymentBooking(result.booking);
      setPaymentInvoice(result.invoice);
      setPayos(result.payos ?? null);
      setPaymentStarted(true);
      if (result.payos?.checkoutUrl) {
        window.location.href = result.payos.checkoutUrl;
      }
      message.success('Bed reserved! Please complete payment.');
    } catch (err: unknown) {
      message.error((err as { message?: string })?.message || 'Failed to hold bed');
    } finally {
      setLoadingKeep(false);
    }
  };

  const checkWindow = async () => {
    setWindowLoading(true);
    try {
      const status = await getBookingWindowStatus();
      setWindowStatus(status);
    } catch {
      setWindowStatus({ allowed: false, window_type: null });
    } finally {
      setWindowLoading(false);
    }
  };

  // Silent refresh triggered by real-time socket events — no full-page spinner.
  const refreshWindow = async () => {
    setWindowRefreshing(true);
    try {
      const status = await getBookingWindowStatus();
      setWindowStatus(status);
    } catch { /* ignore — keep current status */ }
    finally {
      setWindowRefreshing(false);
    }
  };

  const loadSemester = async () => {
    setLoading(p => ({ ...p, semester: true }));
    try { setSemester(await getNextSemester()); }
    catch { message.error('Failed to load semester info'); }
    finally { setLoading(p => ({ ...p, semester: false })); }
  };

  const loadRoomTypes = async () => {
    setLoading(p => ({ ...p, roomTypes: true }));
    try { setRoomTypes(await getAvailableRoomTypes()); }
    catch { message.error('Failed to load room types'); }
    finally { setLoading(p => ({ ...p, roomTypes: false })); }
  };

  const loadDorms = async (roomType: string) => {
    setLoading(p => ({ ...p, dorms: true }));
    try { setDorms(await getDormsForBooking(roomType)); }
    catch { message.error('Failed to load dorms'); }
    finally { setLoading(p => ({ ...p, dorms: false })); }
  };

  const loadFloors = async (dormId: string, roomType: string) => {
    setLoading(p => ({ ...p, floors: true }));
    try { setFloors(await getFloorsForBooking(dormId, roomType)); }
    catch { message.error('Failed to load floors'); }
    finally { setLoading(p => ({ ...p, floors: false })); }
  };

  const loadBlocks = async (dormId: string, floor: number, roomType: string) => {
    setLoading(p => ({ ...p, blocks: true }));
    try { setBlocks(await getBlocksForBooking(dormId, floor, roomType)); }
    catch { message.error('Failed to load blocks'); }
    finally { setLoading(p => ({ ...p, blocks: false })); }
  };

  const loadAllBeds = async (blockId: string, roomType: string) => {
    setLoading(p => ({ ...p, beds: true }));
    setAllBeds([]);
    try {
      const rooms: BookingRoom[] = await getRoomsForBooking(blockId, roomType);
      const bedArrays = await Promise.all(
        rooms.map(async (room) => {
          const beds: BookingBed[] = await getBedsForBooking(room.id);
          return beds.map(bed => ({
            ...bed,
            room_number: room.room_number,
            price_per_semester: room.price_per_semester,
            room_type: room.room_type,
            floor: room.floor,
          }));
        })
      );
      const allFlatBeds = bedArrays.flat();
      // Filter out already-locked beds on initial load; store them so they can be restored on unlock
      getSoftLockedBeds().then(data => {
        const lockedSet = new Set(data.locked_bed_ids);
        allFlatBeds.forEach(b => { if (lockedSet.has(b.id)) removedByLockRef.current.set(b.id, b); });
        setAllBeds(allFlatBeds.filter(b => !lockedSet.has(b.id)));
      }).catch(() => { setAllBeds(allFlatBeds); });
    } catch {
      message.error('Failed to load beds');
    } finally {
      setLoading(p => ({ ...p, beds: false }));
    }
  };

  const loadMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await getMyBookings({ page: myBookingsPage, limit: 10 });
      setMyBookings(data.items);
      setMyBookingsTotal(data.pagination.total);
    } catch { message.error('Failed to load bookings'); }
    finally { setLoadingBookings(false); }
  };

  loadNewBookingStateRef.current = loadNewBookingState;
  loadMyBookingsRef.current = loadMyBookings;

  // ─── Cascade handlers ───

  const handleRoomTypeChange = (value: string) => {
    setSelectedRoomType(value);
    setSelectedDorm(null); setSelectedFloor(null); setSelectedBlock(null); setSelectedBed(null);
    setDorms([]); setFloors([]); setBlocks([]); setAllBeds([]);
    loadDorms(value);
  };

  const handleDormChange = (value: string) => {
    setSelectedDorm(value);
    setSelectedFloor(null); setSelectedBlock(null); setSelectedBed(null);
    setFloors([]); setBlocks([]); setAllBeds([]);
    loadFloors(value, selectedRoomType!);
  };

  const handleFloorChange = (value: number) => {
    setSelectedFloor(value);
    setSelectedBlock(null); setSelectedBed(null);
    setBlocks([]); setAllBeds([]);
    loadBlocks(selectedDorm!, value, selectedRoomType!);
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value);
    setSelectedBed(null);
    setAllBeds([]);
    loadAllBeds(value, selectedRoomType!);
  };

  const handleReload = () => {
    if (selectedBlock && selectedRoomType) {
      setSelectedBed(null);
      loadAllBeds(selectedBlock, selectedRoomType);
    }
  };

  // ─── Submit ───

  const handleBedClick = async (bed: BedCard) => {
    try {
      await softLockBed(bed.id);
      setSelectedBed(bed);
      setConfirmModal(true);
      // Auto-release after 5 min: reload beds + clear selection
      if (softLockTimerRef.current) clearTimeout(softLockTimerRef.current);
      softLockTimerRef.current = setTimeout(() => {
        setConfirmModal(false);
        setSelectedBed(null);
        setNote('');
        setAgreedToTerms(false);
        softLockTimerRef.current = null;
        if (selectedBlock && selectedRoomType) loadAllBeds(selectedBlock, selectedRoomType);
      }, 5 * 60 * 1000);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Bed is no longer available';
      message.error(msg);
    }
  };

  // Helper: lấy PayOS checkout URL của booking (tạo mới nếu chưa có)
  const getOrCreateCheckoutUrl = async (bookingId: string, existingUrl?: string | null): Promise<string | null> => {
    if (existingUrl) return existingUrl;
    try {
      const res = await createPayosLink(bookingId);
      return res.checkoutUrl ?? null;
    } catch {
      return null;
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedBed) return;
    setLoading(p => ({ ...p, submit: true }));
    try {
      const result: SubmitBookingResponse = await submitBooking({ bed_id: selectedBed.id, note: note || undefined });
      setConfirmModal(false);
      setAgreedToTerms(false);
      if (softLockTimerRef.current) { clearTimeout(softLockTimerRef.current); softLockTimerRef.current = null; }

      const checkoutUrl = await getOrCreateCheckoutUrl(result.booking.id, result.payos?.checkoutUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        message.warning('Booking confirmed! Please go to Payment page to complete payment.');
        setActiveTab('my');
        loadMyBookings();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || 'Failed to submit booking';

      if (errMsg.toLowerCase().includes('already have an active booking')) {
        // Học sinh đã có booking awaiting_payment → lấy URL và redirect thẳng sang PayOS
        setConfirmModal(false);
        setAgreedToTerms(false);
        try {
          const data = await getMyBookings({ limit: 10 });
          const existing = data.items.find(b => b.status === 'awaiting_payment');
          if (existing) {
            const checkoutUrl = await getOrCreateCheckoutUrl(existing.id, existing.payos?.checkoutUrl);
            if (checkoutUrl) {
              window.location.href = checkoutUrl;
              return;
            }
          }
        } catch { /* fallback below */ }
        // Không lấy được link → về My Requests
        setActiveTab('my');
        loadMyBookings();
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(p => ({ ...p, submit: false }));
    }
  };

  const handleResumePayment = (booking: BookingRequestItem) => {
    setPaymentBooking(booking);
    setPaymentInvoice(booking.invoice || null);
    setPayos(
      booking.payos
        ? {
          orderCode: booking.payos.orderCode ? Number(booking.payos.orderCode) : 0,
          paymentLinkId: booking.payos.paymentLinkId || null,
          checkoutUrl: booking.payos.checkoutUrl || null,
          qrCode: booking.payos.qrCode || null,
        }
        : null
    );
    // When resumed from the payment page, treat payment as started and show the countdown
    setPaymentStarted(true);
    setView('payment'); setActiveTab('new');
  };

  const resetForm = () => {
    setSelectedRoomType(null); setSelectedDorm(null); setSelectedFloor(null);
    setSelectedBlock(null); setSelectedBed(null); setNote('');
    setDorms([]); setFloors([]); setBlocks([]); setAllBeds([]);
    setPaymentBooking(null); setPaymentInvoice(null);
    setPayos(null);
    setPaymentStarted(false);
    setCountdown(0);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (payosClosedCheckRef.current) { clearInterval(payosClosedCheckRef.current); payosClosedCheckRef.current = null; }
    payosWindowRef.current = null;
  };

  // ─── Derived ───
  const selectedRoomTypeInfo = roomTypes.find(r => r.room_type === selectedRoomType);
  const selectedDormInfo = dorms.find(d => d.dorm_id === selectedDorm);
  const selectedFloorInfo = floors.find(f => f.floor === selectedFloor);
  const selectedBlockInfo = blocks.find(b => b.block_id === selectedBlock);
  const selectedDormName = selectedDormInfo?.dorm_name;

  // ─── Render: New Booking Form ───
  const renderBookingForm = () => (
    <div>
      {/* Title */}
      <Title level={1} style={{ color: '#1a3c6e', fontWeight: 700, marginBottom: 24 }}>
        New Booking
      </Title>

      {/* Semester */}
      <div style={{ marginBottom: 24 }}>
        <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Semester</Text>
        <Input
          value={semester ? semester.semester.replace('-', ' - ') : ''}
          readOnly
          style={{ width: '100%', maxWidth: isTablet ? 300 : '100%', borderRadius: 6 }}
        />
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
        {/* Room Type */}
        <div style={{ flex: '1 1 220px', minWidth: isTablet ? 180 : '100%' }}>
          <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Room Type</Text>
          <Select
            placeholder="Select room type"
            value={selectedRoomType}
            onChange={handleRoomTypeChange}
            loading={loading.roomTypes}
            style={{ width: '100%' }}
            options={roomTypes.map(rt => {
              const beds = parseInt(rt.room_type.split('_')[0], 10);
              const typeLabel = rt.student_type === 'international' ? 'International' : 'Domestic';
              const price = rt.price_per_semester
                ? new Intl.NumberFormat('vi-VN').format(rt.price_per_semester)
                : '—';
              return {
                value: rt.room_type,
                label: `${typeLabel} - ${beds} beds - ${price}`,
              };
            })}
          />
          {selectedRoomTypeInfo && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {selectedRoomTypeInfo.available_slots} beds available (all dorms).
            </Text>
          )}
        </div>

        {/* Dorm */}
        <div style={{ flex: '1 1 180px', minWidth: isTablet ? 140 : '100%' }}>
          <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Dorm</Text>
          <Select
            placeholder="Select dorm"
            value={selectedDorm}
            onChange={handleDormChange}
            loading={loading.dorms}
            disabled={!selectedRoomType}
            style={{ width: '100%' }}
            options={dorms.map(d => ({ value: d.dorm_id, label: d.dorm_name }))}
          />
          {selectedDormInfo && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {selectedDormInfo.available_slots} beds available (all floors).
            </Text>
          )}
        </div>

        {/* Floor */}
        <div style={{ flex: '1 1 160px', minWidth: isTablet ? 120 : '100%' }}>
          <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Floor</Text>
          <Select
            placeholder="Select floor"
            value={selectedFloor}
            onChange={handleFloorChange}
            loading={loading.floors}
            disabled={!selectedDorm}
            style={{ width: '100%' }}
            options={floors.map(f => ({ value: f.floor, label: `Floor ${f.floor}` }))}
          />
          {selectedFloorInfo && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {selectedFloorInfo.available_slots} beds available on this floor.
            </Text>
          )}
        </div>

        {/* Block */}
        <div style={{ flex: '1 1 160px', minWidth: isTablet ? 120 : '100%' }}>
          <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Block</Text>
          <Select
            placeholder="Select block"
            value={selectedBlock}
            onChange={handleBlockChange}
            loading={loading.blocks}
            disabled={!selectedFloor}
            style={{ width: '100%' }}
            options={blocks.map(b => ({ value: b.block_id, label: b.block_code }))}
          />
          {selectedBlockInfo && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block', visibility: 'hidden' }}>
              &nbsp;
            </Text>
          )}
        </div>

        {/* Reload */}
        <div style={{ paddingTop: isTablet ? 28 : 0, width: isTablet ? 'auto' : '100%' }}>
          <Button
            style={{ background: '#1a6ef5', borderColor: '#1a6ef5', color: '#fff', borderRadius: 6, fontWeight: 500 }}
            icon={<ReloadOutlined />}
            onClick={handleReload}
            disabled={!selectedBlock}
            block={!isTablet}
          >
            Reload
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e8e8e8', marginBottom: 24 }} />

      {/* Bed Cards — grouped by room */}
      {loading.beds ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : selectedBlock && allBeds.length === 0 && !loading.beds ? (
        <Empty description="No bookable beds" />
      ) : (() => {
        // Group beds by room_number
        const grouped = allBeds.reduce<Record<string, BedCard[]>>((acc, bed) => {
          const key = bed.room_number ?? 'Unknown';
          if (!acc[key]) acc[key] = [];
          acc[key].push(bed);
          return acc;
        }, {});

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(grouped).map(([roomNumber, beds]) => {
              const first = beds[0];
              return (
                <div key={roomNumber}>
                  {/* Room header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    padding: '10px 14px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderLeft: '4px solid #fa8c16',
                    borderRadius: '0 8px 8px 0',
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                      🏠 Room {roomNumber}
                    </span>
                    <span style={{
                      fontSize: 12, color: '#888',
                      padding: '2px 8px', background: '#f0f0f0',
                      borderRadius: 20,
                    }}>
                      Floor {first.floor}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#fa8c16',
                      padding: '2px 8px', background: '#fff7e6',
                      border: '1px solid #ffd591', borderRadius: 20,
                    }}>
                      {formatCurrency(first.price_per_semester)} / semester
                    </span>
                    <Tag color="success" style={{ marginLeft: 'auto', fontSize: 11, borderRadius: 20 }}>
                      {beds.length} bed{beds.length > 1 ? 's' : ''} available
                    </Tag>
                  </div>

                  {/* Bed cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop
                      ? 'repeat(auto-fill, minmax(155px, 1fr))'
                      : 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 12,
                  }}>
                    {beds.map(bed => {
                      const isSelected = selectedBed?.id === bed.id;
                      return (
                        <div
                          key={bed.id}
                          onClick={() => handleBedClick(bed)}
                          style={{
                            position: 'relative',
                            border: `2px solid ${isSelected ? '#fa8c16' : '#e8e8e8'}`,
                            borderRadius: 10,
                            padding: '20px 12px 12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: isSelected ? '#fff7e6' : '#fff',
                            boxShadow: isSelected
                              ? '0 4px 12px rgba(250,140,22,0.18)'
                              : '0 1px 4px rgba(0,0,0,0.06)',
                            transition: 'all 0.18s ease',
                            transform: isSelected ? 'translateY(-2px)' : 'none',
                          }}
                        >
                          {/* Bed number ribbon */}
                          <div style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            background: isSelected ? '#fa8c16' : '#434343',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '8px 0 8px 0',
                            letterSpacing: '0.3px',
                          }}>
                            Bed #{bed.bed_number}
                          </div>

                          {/* Bed emoji */}
                          <div style={{ fontSize: 38, lineHeight: 1, margin: '6px 0 10px' }}>🛏️</div>

                          {/* Status chip */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isSelected ? '#fff7e6' : '#f6ffed',
                            color: isSelected ? '#fa8c16' : '#52c41a',
                            border: `1px solid ${isSelected ? '#ffd591' : '#b7eb8f'}`,
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: isSelected ? '#fa8c16' : '#52c41a',
                              flexShrink: 0,
                            }} />
                            {isSelected ? 'Selected' : 'Available'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Confirm Modal */}
      <Modal
        open={confirmModal}
        onCancel={() => {
          if (selectedBed) softUnlockBed(selectedBed.id).catch(() => { });
          if (softLockTimerRef.current) { clearTimeout(softLockTimerRef.current); softLockTimerRef.current = null; }
          setConfirmModal(false);
          setSelectedBed(null);
          setNote('');
          setAgreedToTerms(false);
        }}
        title={<Text strong style={{ fontSize: 16 }}>Confirm Booking</Text>}
        footer={[
          <Button key="cancel" onClick={() => {
            if (selectedBed) softUnlockBed(selectedBed.id).catch(() => { });
            if (softLockTimerRef.current) { clearTimeout(softLockTimerRef.current); softLockTimerRef.current = null; }
            setConfirmModal(false);
            setSelectedBed(null);
            setNote('');
            setAgreedToTerms(false);
          }}>Cancel</Button>,
          <Button key="confirm" type="primary" loading={loading.submit} disabled={!agreedToTerms} onClick={handleSubmitBooking}>Confirm</Button>,
        ]}
        width={isTablet ? 560 : 'calc(100vw - 24px)'}
        destroyOnClose
      >
        {selectedBed && semester && (
          <div style={{ paddingTop: 8 }}>
            {/* 2-col grid */}
            {[
              [['Dorm', selectedDormName || '—'], ['Floor', `Floor ${selectedBed.floor}`]],
              [['Room', selectedBed.room_number], ['Bed Number', String(selectedBed.bed_number)]],
              [['Room Type', selectedBed.room_type], ['Semester', semester.semester.replace('-', ' - ')]],
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                {row.map(([label, value]) => (
                  <div key={label}>
                    <Text strong style={{ color: '#1a6ef5', display: 'block', marginBottom: 4, fontSize: 13 }}>{label}</Text>
                    <Input
                      value={value}
                      readOnly
                      style={{ background: '#f0f5ff', borderColor: '#d6e4ff', color: '#333' }}
                    />
                  </div>
                ))}
              </div>
            ))}

            {/* Note */}
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ color: '#1a6ef5', display: 'block', marginBottom: 4, fontSize: 13 }}>Note</Text>
              <TextArea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any special requests..."
                rows={3}
                maxLength={500}
                style={{ borderColor: '#d6e4ff' }}
              />
            </div>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <Text style={{ color: '#555', fontSize: 13 }}>Room Price in VND:</Text>
              <div>
                <Text strong style={{ color: '#1a6ef5', fontSize: 22 }}>
                  {formatCurrency(selectedBed.price_per_semester)}
                </Text>
              </div>
            </div>

            {/* Agreement */}
            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 16 }}>
              <Checkbox
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
              >
                <Text style={{ fontSize: 13 }}>
                  Agree to Dormitory Regulations.{' '}
                  <Text style={{ fontSize: 13, color: '#fa8c16' }}>(I agree to the dormitory regulations.)</Text>
                </Text>
              </Checkbox>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );

  // ─── Render: My Requests ───
  const renderMyRequests = () => (
    <div>
      {loadingBookings ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : myBookings.length === 0 ? (
        <Empty description="No booking requests yet" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {myBookings.map(booking => {
            const cfg = statusConfig[booking.status] || statusConfig.cancelled;
            return (
              <Card key={booking.id} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                      <Text type="secondary">{booking.semester?.replace('-', ' - ')}</Text>
                    </div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>
                      <HomeOutlined style={{ marginRight: 4 }} />
                      Room {booking.room?.room_number}
                      {booking.bed && ` · Bed ${booking.bed.bed_number}`}
                    </Text>
                    <Text type="secondary" style={{ display: 'block' }}>
                      {booking.room?.room_type}
                      {booking.room?.block && ` · ${booking.room.block.block_code}`}
                      {booking.room?.block?.dorm && ` · ${booking.room.block.dorm.dorm_name}`}
                    </Text>
                    {booking.invoice && (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        Invoice: {booking.invoice.invoice_code} · {formatCurrency(booking.invoice.total_amount)}
                        {' · '}
                        <Tag color={booking.invoice.payment_status === 'paid' ? 'success' : 'warning'} style={{ margin: 0 }}>
                          {booking.invoice.payment_status}
                        </Tag>
                      </Text>
                    )}
                    {booking.status === 'approved' && booking.bed && !booking.checkout_date && (
                      new Date(booking.start_date) > new Date() ? (
                        <Text style={{ display: 'block', marginTop: 8, color: '#1677ff' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          Bed {booking.bed.bed_number} · Upcoming — starts {new Date(booking.start_date).toLocaleDateString('vi-VN')}
                        </Text>
                      ) : (
                        <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                          <CheckCircleOutlined style={{ marginRight: 4 }} /> Bed {booking.bed.bed_number} · Contract active
                        </Text>
                      )
                    )}
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Requested: {new Date(booking.requested_at).toLocaleString('vi-VN')}
                </Text>
                {booking.checkout_date && (
                  <Text style={{ fontSize: 12, display: 'block', marginTop: 4, color: '#cf1322' }}>
                    Check-out Date: {new Date(booking.checkout_date).toLocaleString('vi-VN')}
                  </Text>
                )}
              </Card>
            );
          })}
          {myBookingsTotal > 10 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination current={myBookingsPage} total={myBookingsTotal} pageSize={10}
                onChange={page => setMyBookingsPage(page)} showSizeChanger={false} />
            </div>
          )}
        </Space>
      )}
    </div>
  );

  // ─── Render: Hold Bed ───
  const renderHoldBed = () => {
    // Use the manager-configured target semester (from date config), not the student's current semester
    const { semester: semNum, year } = semester
      ? (() => {
        const [name, y] = (semester.semester ?? '').split('-');
        return { semester: name || '—', year: parseInt(y, 10) || '—' };
      })()
      : { semester: '—', year: '—' };

    // Hide Keep Bed button if target semester is the same semester+year as student's current contract
    const semesterRank = (s: string) => {
      const [name, y] = String(s || '').split('-');
      const order: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };
      return (parseInt(y, 10) || 0) * 10 + (order[name] ?? 0);
    };
    const targetRank = semester ? semesterRank(semester.semester) : 0;
    const currentRank = activeBooking ? semesterRank(activeBooking.semester ?? '') : 0;
    const canKeepBed = targetRank > currentRank;

    const columns = [
      {
        title: 'Dorm',
        key: 'dorm',
        render: () => <Text>{activeBooking?.room?.block?.dorm?.dorm_name ?? '—'}</Text>,
      },
      {
        title: 'Floor',
        key: 'floor',
        render: () => <Text>{activeBooking?.room?.floor ?? '—'}</Text>,
      },
      {
        title: 'Bed',
        key: 'bed',
        render: () => {
          const blockCode = activeBooking?.room?.block?.block_code ?? '';
          const roomNum = activeBooking?.room?.room_number ?? '';
          const bedNum = activeBooking?.bed?.bed_number;
          return (
            <Text>
              <Text strong>{blockCode}-{roomNum}</Text>
              {bedNum != null && (
                <Text style={{ marginLeft: 8 }}>Bed {bedNum}</Text>
              )}
            </Text>
          );
        },
      },
      {
        title: 'Semester',
        key: 'semester',
        render: () => <Tag color="blue">{semNum || '—'}</Tag>,
      },
      {
        title: 'Year',
        key: 'year',
        render: () => <Text>{year || '—'}</Text>,
      },
      {
        title: 'Room Type',
        key: 'room_type',
        render: () => <Tag>{activeBooking?.room?.room_type ?? '—'}</Tag>,
      },
      {
        title: 'Action',
        key: 'action',
        render: () => {
          if (!canKeepBed) return null;
          if (holdSuccess) return (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '4px 10px' }}>
              Bed Held Successfully
            </Tag>
          );
          if (paymentStarted && paymentBooking) return (
            <Space size={8}>
              <Tag color="processing" icon={<ClockCircleOutlined />} style={{ fontSize: 13, padding: '4px 10px', margin: 0 }}>
                Awaiting Payment
              </Tag>
              {payos?.checkoutUrl && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => { window.location.href = payos!.checkoutUrl!; }}
                  style={{ background: brandPalette.primary, borderColor: brandPalette.primary }}
                >
                  Pay Now
                </Button>
              )}
            </Space>
          );
          if (windowStatus?.bed_taken) return (
            <Tooltip title={windowStatus.bed_taken_reason}>
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 13, padding: '4px 10px' }}>
                Cannot Hold Bed
              </Tag>
            </Tooltip>
          );
          return (
            <Button
              type="primary"
              loading={loadingKeep}
              onClick={() => {
                isHoldingOwnBedRef.current = true;
                if (windowStatus?.bed_id) softLockBed(windowStatus.bed_id).catch(() => { });
                setConfirmKeepModal(true);
                if (holdLockTimerRef.current) clearTimeout(holdLockTimerRef.current);
                holdLockTimerRef.current = setTimeout(() => {
                  holdLockTimerRef.current = null;
                  isHoldingOwnBedRef.current = false;
                  setConfirmKeepModal(false);
                  setAgreedToTerms(false);
                  message.warning('Bed hold expired. Please try again.');
                  window.location.reload();
                }, 5 * 60 * 1000);
              }}
              style={{ background: brandPalette.primary, borderColor: brandPalette.primary, borderRadius: 6 }}
            >
              Hold Bed
            </Button>
          );
        },
      },
    ];

    return (
      <div>
        <Title level={2} style={{ color: '#1a3c6e', fontWeight: 700, marginBottom: 8 }}>
          Bed Hold Period
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          You can keep your current bed for the next semester.
        </Text>
        <Table
          dataSource={activeBooking ? [activeBooking] : []}
          columns={columns}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: 820 }}
          locale={{ emptyText: 'No active bed found' }}
        />
      </div>
    );
  };

  // ─── Render: Already Held (holdSuccess but window changed to 'new') ───
  const renderAlreadyHeld = () => {
    const dormName = activeBooking?.room?.block?.dorm?.dorm_name ?? '—';
    const blockCode = activeBooking?.room?.block?.block_code ?? '';
    const roomNum = activeBooking?.room?.room_number ?? '—';
    const bedNum = activeBooking?.bed?.bed_number;
    const semLabel = semester?.semester?.replace('-', ' - ') ?? '—';
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
      }}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
        <Title level={3} style={{ color: '#1a3c6e', marginBottom: 8 }}>
          You successfully reserved your bed for the term {semLabel}
        </Title>
        <Text type="secondary" style={{ fontSize: 15, marginBottom: 16 }}>
          {dormName} · {blockCode}-{roomNum}{bedNum != null ? ` · Bed ${bedNum}` : ''}
        </Text>

      </div>
    );
  };

  // ─── Render: Booking Not Started ───
  const renderNotStarted = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <img
        src="/images/booking-not-started.png"
        alt="Booking not started"
        style={{ width: isTablet ? 220 : 180, maxWidth: '100%', marginBottom: 32, opacity: 0.92 }}
      />
      <Title level={3} style={{ color: '#1a3c6e', marginBottom: 8 }}>
        Dormitory booking has not started yet.
      </Title>
      <Text type="secondary" style={{ fontSize: 15 }}>
        Please wait for the booking period to be opened by the manager.
      </Text>
    </div>
  );

  const renderDormBookingSuspended = () => (
    <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
      {modalContextHolder}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          message="Dormitory booking is not available for your account"
          description="Because of a prior dormitory rules violation, new bookings and bed renewals are disabled. You can still sign in and use other features. Contact dormitory management if you need help."
        />
        <Tabs
          activeKey="my"
          items={[
            { key: 'my', label: 'My booking requests', children: renderMyRequests() },
          ]}
        />
      </div>
    </div>
  );

  // ─── Main ───
  if (windowLoading || checkingHoldStatus) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (windowStatus?.dorm_booking_suspended) {
    return renderDormBookingSuspended();
  }

  return (
    <div style={{ padding: isTablet ? '32px 40px' : '16px', background: '#fff', minHeight: '100vh' }}>
      {modalContextHolder}

      {/* Keep Bed Confirm Modal — lives at top level so it renders regardless of active tab */}
      <Modal
        open={confirmKeepModal}
        onCancel={() => {
          if (holdLockTimerRef.current) { clearTimeout(holdLockTimerRef.current); holdLockTimerRef.current = null; }
          isHoldingOwnBedRef.current = false;
          if (windowStatus?.bed_id) softUnlockBed(windowStatus.bed_id).catch(() => { });
          setConfirmKeepModal(false);
          setAgreedToTerms(false);
        }}
        title={<Text strong style={{ fontSize: 16 }}>Confirm Bed Hold</Text>}
        footer={[
          <Button key="cancel" onClick={() => {
            if (holdLockTimerRef.current) { clearTimeout(holdLockTimerRef.current); holdLockTimerRef.current = null; }
            isHoldingOwnBedRef.current = false;
            if (windowStatus?.bed_id) softUnlockBed(windowStatus.bed_id).catch(() => { });
            setConfirmKeepModal(false);
            setAgreedToTerms(false);
          }}>Cancel</Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loadingKeep}
            disabled={!agreedToTerms}
            onClick={() => {
              if (holdLockTimerRef.current) { clearTimeout(holdLockTimerRef.current); holdLockTimerRef.current = null; }
              isHoldingOwnBedRef.current = false;
              setConfirmKeepModal(false);
              setAgreedToTerms(false);
              handleKeepBed();
            }}
          >
            Confirm
          </Button>,
        ]}
        width={isTablet ? 560 : 'calc(100vw - 24px)'}
        destroyOnClose
      >
        {activeBooking && semester && (
          <div style={{ paddingTop: 8 }}>
            {[
              [['Dorm', activeBooking.room?.block?.dorm?.dorm_name ?? '—'], ['Floor', `Floor ${activeBooking.room?.floor ?? '—'}`]],
              [['Room', activeBooking.room?.room_number ?? '—'], ['Bed Number', String(activeBooking.bed?.bed_number ?? '—')]],
              [['Room Type', activeBooking.room?.room_type ?? '—'], ['Next Semester', semester.semester.replace('-', ' - ')]],
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
                {row.map(([label, value]) => (
                  <div key={label}>
                    <Text strong style={{ color: '#1a6ef5', display: 'block', marginBottom: 4, fontSize: 13 }}>{label}</Text>
                    <Input value={value} readOnly style={{ background: '#f0f5ff', borderColor: '#d6e4ff', color: '#333' }} />
                  </div>
                ))}
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <Text style={{ color: '#555', fontSize: 13 }}>Room Price in VND:</Text>
              <div>
                <Text strong style={{ color: '#1a6ef5', fontSize: 22 }}>
                  {formatCurrency(activeBooking.room?.price_per_semester ?? 0)}
                </Text>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 16 }}>
              <Checkbox checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}>
                <Text style={{ fontSize: 13 }}>
                  Agree to Dormitory Regulations.{' '}
                  <Text style={{ fontSize: 13, color: '#fa8c16' }}>(I agree to the dormitory regulations.)</Text>
                </Text>
              </Checkbox>
            </div>
          </div>
        )}
      </Modal>

      {windowRefreshing && (
        <div style={{ position: 'fixed', top: 64, right: 24, zIndex: 1000 }}>
          <Spin size="small" />
          <Text style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>Updating booking window…</Text>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!windowStatus?.allowed ? renderNotStarted() : (
          holdSuccess && windowStatus.window_type !== 'hold' ? renderAlreadyHeld() :
            windowStatus.window_type === 'hold' ? renderHoldBed() : (
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                centered={!isTablet}
                items={[
                  { key: 'new', label: 'New Booking', children: renderBookingForm() },
                  { key: 'my', label: 'My Requests', children: renderMyRequests() },
                ]}
              />
            )
        )}
      </div>
    </div>
  );
};

export default Booking;
