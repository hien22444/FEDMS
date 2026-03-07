import React, { useState, useEffect, useRef } from 'react';
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
  Popconfirm,
  message,
  Alert,
  Tag,
  Space,
  Card,
} from 'antd';
import {
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CreditCardOutlined,
  ArrowLeftOutlined,
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
  getMyBookings,
  cancelBookingRequest,
} from '@/lib/actions';
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

const { Title, Text } = Typography;
const { TextArea } = Input;

type ViewState = 'form' | 'payment';

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
  const [modalApi, modalContextHolder] = Modal.useModal();

  // ─── Tab state ───
  const [activeTab, setActiveTab] = useState('new');

  // ─── New Booking state ───
  const [view, setView] = useState<ViewState>('form');
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

  // ─── Payment state ───
  const [paymentBooking, setPaymentBooking] = useState<BookingRequestItem | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<BookingInvoice | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── My Requests state ───
  const [myBookings, setMyBookings] = useState<BookingRequestItem[]>([]);
  const [myBookingsPage, setMyBookingsPage] = useState(1);
  const [myBookingsTotal, setMyBookingsTotal] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    loadSemester();
    loadRoomTypes();
  }, []);

  useEffect(() => {
    if (activeTab === 'my') loadMyBookings();
  }, [activeTab, myBookingsPage]);

  useEffect(() => {
    if (view === 'payment' && paymentBooking?.expires_at) {
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
  }, [view, paymentBooking]);

  // ─── API calls ───

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
      setAllBeds(bedArrays.flat());
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

  const handleBedClick = (bed: BedCard) => {
    setSelectedBed(bed);
    setConfirmModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!selectedBed) return;
    setLoading(p => ({ ...p, submit: true }));
    try {
      const result: SubmitBookingResponse = await submitBooking({ bed_id: selectedBed.id, note: note || undefined });
      message.success('Booking submitted! Please complete payment.');
      setConfirmModal(false);
      setPaymentBooking(result.booking);
      setPaymentInvoice(result.invoice);
      setView('payment');
    } catch (err: unknown) {
      const errMsg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || 'Failed to submit booking';
      if (errMsg.toLowerCase().includes('already have an active booking')) {
        setConfirmModal(false);
        modalApi.warning({
          title: 'Bạn đã có booking trong kỳ này',
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                Bạn đã có một booking đang hoạt động cho kỳ học này.
              </p>
              <p style={{ marginBottom: 0, color: '#555' }}>
                Vui lòng kiểm tra tab <strong>My Requests</strong> để xem hoặc hoàn tất thanh toán cho booking hiện tại.
              </p>
            </div>
          ),
          okText: 'Xem My Requests',
          onOk: () => {
            setActiveTab('my');
            loadMyBookings();
          },
        });
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(p => ({ ...p, submit: false }));
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentBooking) return;
    setCheckingPayment(true);
    try {
      const result = await checkPaymentStatus(paymentBooking.id);
      message.success('Payment confirmed! Your booking is approved.');
      setPaymentBooking(result.booking);
      setPaymentInvoice(result.invoice);
      resetForm(); setView('form'); setActiveTab('my'); loadMyBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || 'Payment not confirmed yet';
      message.error(msg);
      if (msg.toLowerCase().includes('expired')) { resetForm(); setView('form'); loadRoomTypes(); }
    } finally { setCheckingPayment(false); }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBookingRequest(bookingId);
      message.success('Booking cancelled');
      loadMyBookings();
    } catch (err: unknown) {
      const cancelMsg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to cancel';
      message.error(cancelMsg);
    }
  };

  const handleResumePayment = (booking: BookingRequestItem) => {
    setPaymentBooking(booking);
    setPaymentInvoice(booking.invoice || null);
    setView('payment'); setActiveTab('new');
  };

  const resetForm = () => {
    setSelectedRoomType(null); setSelectedDorm(null); setSelectedFloor(null);
    setSelectedBlock(null); setSelectedBed(null); setNote('');
    setDorms([]); setFloors([]); setBlocks([]); setAllBeds([]);
    setPaymentBooking(null); setPaymentInvoice(null);
  };

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Derived ───
  const selectedRoomTypeInfo = roomTypes.find(r => r.room_type === selectedRoomType);
  const selectedDormInfo = dorms.find(d => d.dorm_id === selectedDorm);
  const selectedFloorInfo = floors.find(f => f.floor === selectedFloor);
  const selectedBlockInfo = blocks.find(b => b.block_id === selectedBlock);
  const selectedDormName = selectedDormInfo?.dorm_name;

  // ─── Render: Payment ───
  const renderPaymentPage = () => {
    if (!paymentBooking || !paymentInvoice) return null;
    const isExpired = countdown <= 0;
    return (
      <div>
        <Button
          type="text" icon={<ArrowLeftOutlined />}
          onClick={() => { resetForm(); setView('form'); loadRoomTypes(); }}
          style={{ marginBottom: 16 }}
        >Back to Booking</Button>

        <Card style={{ marginBottom: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>Total Payment</Text>
          <Title level={2} style={{ color: '#ff4d4f', margin: '8px 0' }}>
            {formatCurrency(paymentInvoice.total_amount)}
          </Title>
          {!isExpired ? (
            <Alert type="warning" showIcon icon={<ClockCircleOutlined />}
              message={<span>Slots are only held for 10 minutes, please pay before this time.{' '}
                <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>{formatCountdown(countdown)}</Text>
              </span>}
              style={{ marginTop: 16 }}
            />
          ) : (
            <Alert type="error" showIcon message="Booking expired. The bed has been released."
              description="Please go back and create a new booking." style={{ marginTop: 16 }} />
          )}
        </Card>

        <Card title="Payment Information" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Scan QR code to pay</Text>
              <div style={{ width: 200, height: 200, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d9d9d9', margin: '0 auto 16px' }}>
                <Text type="secondary">VietQR Code</Text>
              </div>
              <Text strong style={{ display: 'block' }}>BIDV</Text>
              <Text copyable style={{ fontSize: 16 }}>4271000xxxxxx</Text>
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>Truong Dai Hoc FPT</Text>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Title level={5}>Payment Guide</Title>
              <Space direction="vertical" size="middle">
                {[
                  ['Step 1:', 'Open your banking app (BIDV, Vietcombank, Momo, etc.)'],
                  ['Step 2:', 'Scan the QR code or transfer manually'],
                  ['Step 3:', `Enter the exact amount: ${formatCurrency(paymentInvoice.total_amount)}`],
                  ['Step 4:', `Use transfer note: ${paymentInvoice.invoice_code}`],
                  ['Step 5:', 'Confirm and enter OTP to complete payment'],
                ].map(([label, desc]) => (
                  <div key={label}><Text strong>{label}</Text> <Text>{desc}</Text></div>
                ))}
              </Space>
            </div>
          </div>
        </Card>

        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" icon={<CreditCardOutlined />}
            loading={checkingPayment} disabled={isExpired} onClick={handleCheckPayment}>
            Check Payment Status
          </Button>
        </div>
      </div>
    );
  };

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
          style={{ maxWidth: 300, borderRadius: 6 }}
        />
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
        {/* Room Type */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <Text style={{ display: 'block', marginBottom: 6, color: '#555' }}>Room Type</Text>
          <Select
            placeholder="Select room type"
            value={selectedRoomType}
            onChange={handleRoomTypeChange}
            loading={loading.roomTypes}
            style={{ width: '100%' }}
            options={roomTypes.map(rt => {
              const beds = parseInt(rt.room_type.split('_')[0], 10);
              const typeLabel = rt.student_type === 'international' ? 'Quốc tế' : 'SVVN';
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
        <div style={{ flex: '1 1 160px', minWidth: 140 }}>
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
        <div style={{ flex: '1 1 140px', minWidth: 120 }}>
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
        <div style={{ flex: '1 1 140px', minWidth: 120 }}>
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
        <div style={{ paddingTop: 28 }}>
          <Button
            style={{ background: '#1a6ef5', borderColor: '#1a6ef5', color: '#fff', borderRadius: 6, fontWeight: 500 }}
            icon={<ReloadOutlined />}
            onClick={handleReload}
            disabled={!selectedBlock}
          >
            Reload
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e8e8e8', marginBottom: 24 }} />

      {/* Bed Cards */}
      {loading.beds ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : selectedBlock && allBeds.length === 0 && !loading.beds ? (
        <Empty description="No available beds" />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {allBeds.map(bed => {
            const isSelected = selectedBed?.id === bed.id;
            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                style={{
                  position: 'relative',
                  width: 140,
                  border: `2px solid ${isSelected ? '#1a6ef5' : '#e8e8e8'}`,
                  borderRadius: 8,
                  padding: '16px 12px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Orange badge */}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: '#fa8c16', color: '#fff',
                  width: 26, height: 26, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {bed.bed_number}
                </div>

                {/* Bed emoji */}
                <div style={{ fontSize: 44, lineHeight: 1, margin: '4px 0 10px' }}>🛏️</div>

                {/* Room label */}
                <Text style={{ fontSize: 12, color: '#555' }}>Room : {bed.room_number}</Text>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      <Modal
        open={confirmModal}
        onCancel={() => { setConfirmModal(false); setNote(''); }}
        title={<Text strong style={{ fontSize: 16 }}>Confirm Booking</Text>}
        footer={[
          <Button key="cancel" onClick={() => { setConfirmModal(false); setNote(''); }}>Cancel</Button>,
          <Button key="confirm" type="primary" loading={loading.submit} onClick={handleSubmitBooking}>Confirm</Button>,
        ]}
        width={560}
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
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
            <div>
              <Text style={{ color: '#555', fontSize: 13 }}>Room Price in VND:</Text>
              <div>
                <Text strong style={{ color: '#1a6ef5', fontSize: 22 }}>
                  {formatCurrency(selectedBed.price_per_semester)}
                </Text>
              </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
                    {booking.status === 'approved' && booking.bed && (
                      <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                        <CheckCircleOutlined /> Bed {booking.bed.bed_number} · Contract active
                      </Text>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 16 }}>
                    {booking.status === 'awaiting_payment' && (
                      <>
                        <Button type="primary" size="small" icon={<CreditCardOutlined />} onClick={() => handleResumePayment(booking)}>
                          Complete Payment
                        </Button>
                        <Popconfirm title="Cancel this booking?" description="The bed will be released." onConfirm={() => handleCancel(booking.id)}>
                          <Button size="small" danger>Cancel</Button>
                        </Popconfirm>
                      </>
                    )}
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Requested: {new Date(booking.requested_at).toLocaleString('vi-VN')}
                </Text>
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

  // ─── Main ───
  return (
    <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
      {modalContextHolder}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {view === 'payment' ? renderPaymentPage() : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'new', label: 'New Booking', children: renderBookingForm() },
              { key: 'my', label: 'My Requests', children: renderMyRequests() },
            ]}
            tabBarStyle={{ display: activeTab === 'new' && view === 'form' ? undefined : undefined }}
          />
        )}
      </div>
    </div>
  );
};

export default Booking;
