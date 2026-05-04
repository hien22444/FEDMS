import { IcArrowRight, IcClose } from '@/constants';
import { useDebouncedCallback, useToggle } from '@/hooks';
import {
  answer,
  type AgentActionOption,
  type AgentAssistantState,
  type AgentBookingDraft,
  type AgentMeta,
} from '@/lib/actions';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

import {
  Alert,
  Button as AntButton,
  Card,
  Checkbox,
  Drawer,
  Input,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  Activity,
  BedDouble,
  BotIcon,
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../unix';
import { Message } from './Message';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  meta?: AgentMeta | null;
}

const { Text } = Typography;

const BOOKING_STEP_ORDER = [
  'room_type',
  'dorm',
  'floor',
  'block',
  'room',
  'bed',
] as const;

const BOOKING_STEP_LABELS: Record<
  (typeof BOOKING_STEP_ORDER)[number],
  string
> = {
  room_type: 'Room type',
  dorm: 'Dorm',
  floor: 'Floor',
  block: 'Block',
  room: 'Room',
  bed: 'Bed',
};

const BOOKING_STEP_HELPERS: Record<
  (typeof BOOKING_STEP_ORDER)[number],
  string
> = {
  room_type: 'Start with the room type and price.',
  dorm: 'Pick the building that matches your preference.',
  floor: 'Choose the floor before narrowing the block.',
  block: 'Select the block inside the dorm.',
  room: 'Choose the room that still has beds.',
  bed: 'Select the exact bed, then review and confirm.',
};

const QUICK_ACTIONS = [
  {
    label: 'Book a bed',
    description:
      'Walk through room type, dorm, floor, room, and bed selection.',
    prompt: 'I want to book a bed',
    icon: BedDouble,
  },
  {
    label: 'Dorm rules',
    description:
      'Ask about guest policy, curfew, cooking, and other regulations.',
    prompt: 'What are the dorm rules?',
    icon: ShieldCheck,
  },
  {
    label: 'Check utility readings',
    description:
      'See the latest electricity and water usage for your room.',
    prompt: 'Show my utility readings',
    icon: FileText,
  },
  {
    label: 'View conduct summary',
    description:
      'Show behavioral score and current-semester violations.',
    prompt: 'Show my conduct summary',
    icon: Activity,
  },
] as const;

const BOOKING_STATE_TERMS = [
  'book',
  'booking',
  'bed',
  'hold bed',
  'reservation',
];

const shouldAttachBookingState = (value: string) => {
  const normalized = value.toLowerCase();
  return BOOKING_STATE_TERMS.some(term => normalized.includes(term));
};

const formatBookingId = (
  booking?: Record<string, unknown> | null,
) => {
  if (!booking) return '—';
  return String(
    booking.id ||
      booking._id ||
      booking.booking_id ||
      booking.booking_code ||
      '—',
  );
};

const formatInvoiceCode = (
  invoice?: Record<string, unknown> | null,
) => {
  if (!invoice) return '—';
  return String(
    invoice.invoice_code || invoice.code || invoice.id || '—',
  );
};

const getBookingStepIndex = (step?: AgentMeta['step']) => {
  if (!step) return -1;
  return BOOKING_STEP_ORDER.indexOf(
    step as (typeof BOOKING_STEP_ORDER)[number],
  );
};

const buildDraftRows = (draft?: AgentBookingDraft | null) => {
  if (!draft) return [];

  return [
    ['Semester', draft.semester],
    ['Room type', draft.room_type_label || draft.room_type],
    ['Dorm', draft.dorm_name || draft.dorm_code],
    ['Floor', draft.floor != null ? String(draft.floor) : null],
    ['Block', draft.block_name || draft.block_code],
    ['Room', draft.room_number],
    ['Bed', draft.bed_number],
    ['Note', draft.note],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label: String(label), value: String(value) }));
};

const buildSummaryRows = (meta: AgentMeta) =>
  meta.summary?.length ? meta.summary : buildDraftRows(meta.draft);

const getPaymentCheckoutUrl = (meta: AgentMeta) =>
  meta.checkoutUrl || meta.payos?.checkoutUrl || null;

const formatVnd = (value?: number | null) =>
  `${Number(value || 0).toLocaleString('en-US')} VND`;

const formatRecordDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(
        new Date(value),
      )
    : '—';

const LoadingDots = () => (
  <div
    className='flex h-6 items-center gap-1.5 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm'
    aria-label='Assistant is loading'
  >
    <span className='ai-loading-dot' />
    <span className='ai-loading-dot ai-loading-dot-delay-1' />
    <span className='ai-loading-dot ai-loading-dot-delay-2' />
  </div>
);

export const Agent = memo(() => {
  const navigate = useNavigate();
  const [open, onToggle] = useToggle();
  const [messagesState, setMessages] = useState<IMessage[]>([]);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [pendingBooking, setPendingBooking] =
    useState<AgentBookingDraft | null>(null);
  const [bookingRulesAccepted, setBookingRulesAccepted] =
    useState<boolean>(false);

  const latestDivRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestVersionRef = useRef(0);

  const randomId = () => (Math.random() * 9999999).toString();

  const onScrollToBottom = useDebouncedCallback(() => {
    latestDivRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, 300);

  useEffect(() => {
    onScrollToBottom();
  }, [messagesState, currentContent, isStreaming, onScrollToBottom]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const pushAssistantMessage = (
    content: string,
    meta: AgentMeta | null,
  ) => {
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content, meta, id: randomId() },
    ]);
  };

  const handlePaymentHandoff = (meta: AgentMeta) => {
    const checkoutUrl = getPaymentCheckoutUrl(meta);
    const resumeBookingId = meta.resumeBookingId || null;

    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }

    if (resumeBookingId) {
      navigate(ROUTES.STUDENT_BOOKING, {
        state: { resumeBookingId },
      });
    }
  };

  const resetAssistant = () => {
    requestVersionRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setCurrentContent('');
    setQuestion('');
    setIsStreaming(false);
    setPendingBooking(null);
    setBookingRulesAccepted(false);
  };

  const handleAssistantMeta = (meta: AgentMeta) => {
    if (
      meta.type === 'booking_options' ||
      meta.type === 'booking_confirm'
    ) {
      setPendingBooking(meta.draft ?? null);
    }

    if (meta.type === 'booking_confirm') {
      setBookingRulesAccepted(Boolean(meta.draft?.rules_accepted));
    }

    if (
      meta.type === 'booking_closed' ||
      meta.type === 'booking_error'
    ) {
      setPendingBooking(null);
      setBookingRulesAccepted(false);
    }

    if (meta.type === 'payment_handoff') {
      handlePaymentHandoff(meta);
    }
  };

  const sendMessage = async (
    value: string,
    assistantState?: AgentAssistantState,
  ) => {
    if (!value.trim() || isStreaming) return;

    abortControllerRef.current?.abort();
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setQuestion('');
    setCurrentContent('');
    onScrollToBottom();

    setMessages(prev => [
      ...prev,
      { role: 'user', content: value, id: randomId() },
    ]);

    const outgoingAssistantState =
      assistantState ||
      (pendingBooking && shouldAttachBookingState(value)
        ? { booking: pendingBooking }
        : undefined);

    let receivedMeta: AgentMeta | null = null;

    try {
      const fullText = await answer(value, messagesState.slice(-20), {
        assistantState: outgoingAssistantState,
        signal: abortController.signal,
        onContent: chunk => {
          if (
            requestVersionRef.current !== requestVersion ||
            abortController.signal.aborted
          ) {
            return;
          }
          setCurrentContent(prev => `${prev}${chunk}`);
        },
        onMeta: meta => {
          if (
            requestVersionRef.current !== requestVersion ||
            abortController.signal.aborted
          ) {
            return;
          }
          receivedMeta = meta;
          handleAssistantMeta(meta);
        },
      });

      if (
        requestVersionRef.current === requestVersion &&
        !abortController.signal.aborted
      ) {
        pushAssistantMessage(fullText, receivedMeta);
      }
    } catch (err) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        return;
      }

      message.error(
        err instanceof Error
          ? err.message
          : 'Failed to get assistant answer',
      );
    } finally {
      if (requestVersionRef.current === requestVersion) {
        abortControllerRef.current = null;
        setCurrentContent('');
        setIsStreaming(false);
      }
    }
  };

  const handleQuickAction = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleBookingOptionSelect = async (
    meta: AgentMeta,
    option: AgentActionOption,
  ) => {
    const nextBookingState = {
      ...(meta.draft || pendingBooking || {}),
      ...(option.value || {}),
    };

    setPendingBooking(nextBookingState);
    setBookingRulesAccepted(false);
    await sendMessage(option.label, { booking: nextBookingState });
  };

  const handleBookingConfirm = async () => {
    if (!pendingBooking || isStreaming) return;

    await sendMessage(
      'Confirm booking and accept the dormitory rules',
      {
        booking: {
          ...pendingBooking,
          rules_accepted: true,
        },
      },
    );
  };

  const renderSelectionSummary = (
    title: string,
    rows: Array<{ label: string; value: string }>,
    icon: ReactNode,
  ) => {
    if (!rows.length) return null;

    return (
      <Card size='small' className='border-slate-200 bg-slate-50/80'>
        <Space
          direction='vertical'
          size='small'
          style={{ width: '100%' }}
        >
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-2'>
              {icon}
              <Text strong>{title}</Text>
            </div>
            <Tag color='blue'>{rows.length} details</Tag>
          </div>
          <div className='grid gap-2 sm:grid-cols-2'>
            {rows.map(item => (
              <div
                key={item.label}
                className='rounded-xl border border-slate-200 bg-white px-3 py-2'
              >
                <Text
                  type='secondary'
                  className='block text-xs uppercase tracking-wide'
                >
                  {item.label}
                </Text>
                <Text strong className='block break-words'>
                  {item.value}
                </Text>
              </div>
            ))}
          </div>
        </Space>
      </Card>
    );
  };

  const renderMetaCard = (
    meta: AgentMeta | null,
    messageId: string,
  ) => {
    if (!meta) return null;

    if (meta.type === 'booking_options') {
      const stepIndex = getBookingStepIndex(meta.step);
      const progressItems = BOOKING_STEP_ORDER.map(step => ({
        title: BOOKING_STEP_LABELS[step],
      }));
      const currentRows = buildDraftRows(
        meta.draft || pendingBooking,
      );

      return (
        <Card
          key={`${messageId}-booking-options`}
          size='small'
          className='mt-3 overflow-hidden border-orange-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <BedDouble className='size-4 text-orange-600' />
                  <Text strong className='text-base'>
                    {BOOKING_STEP_LABELS[meta.step || 'room_type']}
                  </Text>
                </div>
                <Text type='secondary'>
                  {BOOKING_STEP_HELPERS[meta.step || 'room_type']}
                </Text>
              </div>
              <Tag color='orange'>
                Step {stepIndex >= 0 ? stepIndex + 1 : 1} of{' '}
                {BOOKING_STEP_ORDER.length}
              </Tag>
            </div>
            <Steps
              className='mt-4'
              size='small'
              current={stepIndex >= 0 ? stepIndex : 0}
              items={progressItems}
            />
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            {currentRows.length > 0 &&
              renderSelectionSummary(
                'Current selection',
                currentRows,
                <CheckCircle2 className='size-4 text-emerald-600' />,
              )}

            <div className='grid gap-3 sm:grid-cols-2'>
              {meta.options?.map(option => (
                <AntButton
                  key={option.label}
                  onClick={() =>
                    handleBookingOptionSelect(meta, option)
                  }
                  className='!h-auto !w-full !px-4 !py-3 !text-left !border-orange-200 hover:!border-orange-400 hover:!bg-orange-50'
                >
                  <div className='flex w-full items-start justify-between gap-3'>
                    <div className='flex flex-col items-start gap-1'>
                      <span className='font-medium'>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className='text-xs text-gray-500'>
                          {option.description}
                        </span>
                      )}
                    </div>
                    <IcArrowRight className='mt-0.5 size-4 shrink-0 -rotate-90 text-orange-500' />
                  </div>
                </AntButton>
              ))}
            </div>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'booking_confirm') {
      const summaryRows = buildSummaryRows(meta);

      return (
        <Card
          key={`${messageId}-booking-confirm`}
          size='small'
          className='mt-3 overflow-hidden border-orange-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <ShieldCheck className='size-4 text-orange-600' />
                  <Text strong className='text-base'>
                    Confirm booking details
                  </Text>
                </div>
                <Text type='secondary'>
                  Review the selected bed, then acknowledge the
                  dormitory rules.
                </Text>
              </div>
              <Tag color='gold'>Final review</Tag>
            </div>
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            {renderSelectionSummary(
              'Booking summary',
              summaryRows,
              <CheckCircle2 className='size-4 text-emerald-600' />,
            )}

            <Alert
              type='info'
              showIcon
              message='Dormitory rules acknowledgment'
              description={
                meta.rules_text ||
                'Please confirm that you have reviewed the booking details and agree to the dormitory rules before continuing.'
              }
            />

            <div className='rounded-xl border border-amber-100 bg-amber-50 p-3'>
              <Checkbox
                checked={bookingRulesAccepted}
                onChange={e => {
                  const checked = e.target.checked;
                  setBookingRulesAccepted(checked);
                  setPendingBooking(prev =>
                    prev
                      ? {
                          ...prev,
                          rules_accepted: checked,
                        }
                      : prev,
                  );
                }}
              >
                I have reviewed the booking details and agree to the
                dormitory rules.
              </Checkbox>
            </div>

            <AntButton
              type='primary'
              size='large'
              className='bg-orange-600 hover:!bg-orange-500'
              disabled={!bookingRulesAccepted || isStreaming}
              loading={isStreaming}
              onClick={handleBookingConfirm}
            >
              Confirm booking
            </AntButton>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'payment_handoff') {
      const checkoutUrl = getPaymentCheckoutUrl(meta);
      const resumeBookingId = meta.resumeBookingId || null;

      return (
        <Card
          key={`${messageId}-payment`}
          size='small'
          className='mt-3 overflow-hidden border-emerald-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <Wallet className='size-4 text-emerald-600' />
                  <Text strong className='text-base'>
                    Booking created
                  </Text>
                </div>
                <Text type='secondary'>
                  Your booking is ready. Continue to payment to finish
                  the process.
                </Text>
              </div>
              <Tag color='green'>Payment ready</Tag>
            </div>
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            <Alert
              type='success'
              showIcon
              message='Payment step opened'
              description='If your browser blocked the new tab, use the payment button below.'
            />

            {renderSelectionSummary(
              'Booking and invoice',
              [
                {
                  label: 'Booking ID',
                  value: formatBookingId(meta.booking),
                },
                {
                  label: 'Invoice',
                  value: formatInvoiceCode(meta.invoice),
                },
                {
                  label: 'Payment link',
                  value: checkoutUrl ? 'Available' : 'Not provided',
                },
              ],
              <CheckCircle2 className='size-4 text-emerald-600' />,
            )}

            <div className='flex flex-wrap gap-2'>
              {checkoutUrl && (
                <AntButton
                  type='primary'
                  className='bg-emerald-600 hover:!bg-emerald-500'
                  onClick={() =>
                    window.open(
                      checkoutUrl,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  Open payment
                </AntButton>
              )}
              {resumeBookingId && (
                <AntButton
                  onClick={() =>
                    navigate(ROUTES.STUDENT_BOOKING, {
                      state: { resumeBookingId },
                    })
                  }
                >
                  Resume booking page
                </AntButton>
              )}
            </div>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'utility_summary') {
      const sourceLabel =
        meta.room?.source === 'active_contract'
          ? 'Active contract'
          : meta.room?.source === 'approved_booking'
            ? 'Latest approved booking'
            : 'Assigned room';
      const utilityRecords = meta.utility?.records || [];
      const latestMonthLabel =
        meta.utility?.latest_month_label ||
        meta.utility?.latest_month_key ||
        'Latest month';

      return (
        <Card
          key={`${messageId}-utility`}
          size='small'
          className='mt-3 overflow-hidden border-blue-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <FileText className='size-4 text-blue-600' />
                  <Text strong className='text-base'>
                    Utility readings
                  </Text>
                </div>
                <Text type='secondary'>
                  Read-only room utility information for your current
                  assignment.
                </Text>
              </div>
              {meta.room?.label && (
                <Tag color='blue'>{meta.room.label}</Tag>
              )}
            </div>
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            <div className='flex flex-wrap gap-2'>
              <Tag color='blue'>{sourceLabel}</Tag>
              {meta.utility?.latest_month_key && (
                <Tag color='cyan'>{latestMonthLabel}</Tag>
              )}
              {meta.has_data ? (
                <Tag color='green'>Data found</Tag>
              ) : (
                <Tag>Empty</Tag>
              )}
            </div>

            {!meta.has_data ? (
              <Alert
                type='info'
                showIcon
                message='No utility readings available yet'
                description='The database does not have any utility readings recorded for this room yet.'
              />
            ) : (
              <>
                <div className='rounded-xl border border-blue-100 bg-blue-50 px-3 py-2'>
                  <Text
                    type='secondary'
                    className='block text-xs uppercase tracking-wide'
                  >
                    Your latest-month share
                  </Text>
                  <Text strong className='block text-lg text-blue-700'>
                    {formatVnd(meta.utility?.total_amount)}
                  </Text>
                </div>

                <div className='grid gap-2 sm:grid-cols-2'>
                  {utilityRecords.map(record => (
                    <div
                      key={`${record.type}-${record.id}`}
                      className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'
                    >
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <Tag
                          color={
                            record.type === 'electric' ? 'orange' : 'blue'
                          }
                          className='m-0'
                        >
                          {record.type === 'electric'
                            ? 'Electricity'
                            : 'Water'}
                        </Tag>
                        {record.is_prorated && (
                          <Tag color='purple' className='m-0'>
                            Prorated
                          </Tag>
                        )}
                      </div>

                      <div className='grid gap-2'>
                        {[
                          [
                            'Recorded date',
                            formatRecordDate(record.date),
                          ],
                          [
                            'Consumption',
                            `${record.consumption ?? '—'} ${
                              record.unit || ''
                            }`.trim(),
                          ],
                          [
                            'Meter range',
                            `${record.meter_left ?? '—'} → ${
                              record.meter_right ?? '—'
                            }`,
                          ],
                          [
                            'Unit price',
                            `${formatVnd(record.price_per_unit)} / ${
                              record.unit || 'unit'
                            }`,
                          ],
                          ['Your share', formatVnd(record.amount)],
                          [
                            'Block total',
                            formatVnd(record.total_amount),
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className='flex items-center justify-between gap-3 text-sm'
                          >
                            <Text type='secondary'>{label}</Text>
                            <Text strong className='text-right'>
                              {value}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <AntButton
              icon={<ExternalLink className='size-4' />}
              onClick={() => navigate(ROUTES.STUDENT_UTILITIES)}
            >
              Open Utilities
            </AntButton>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'manager_handoff') {
      return (
        <Card
          key={`${messageId}-manager-handoff`}
          size='small'
          className='mt-3 overflow-hidden border-amber-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <MessageCircle className='size-4 text-orange-600' />
                  <Text strong className='text-base'>
                    Dorm manager support
                  </Text>
                </div>
                <Text type='secondary'>
                  A manager can help with dorm-specific questions
                  outside this assistant&apos;s current scope.
                </Text>
              </div>
              <Tag color='orange'>Manager recommended</Tag>
            </div>
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            <Alert
              type='info'
              showIcon
              message='Contact the Dorm manager'
              description='Use student support chat for official guidance about this topic.'
            />
            <AntButton
              type='primary'
              icon={<MessageCircle className='size-4' />}
              className='bg-orange-600 hover:!bg-orange-500'
              onClick={() =>
                navigate(meta.chat_path || ROUTES.STUDENT_CHAT)
              }
            >
              Contact Dorm manager
            </AntButton>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'conduct_summary') {
      const score = meta.behavioral_score;
      const violations = meta.violations_current_semester;
      const scoreValue = score != null ? score : 0;
      const hasViolations = (violations ?? 0) > 0;
      const scoreTone =
        score == null
          ? 'default'
          : scoreValue < 5
            ? 'red'
            : scoreValue < 8
              ? 'gold'
              : 'green';

      return (
        <Card
          key={`${messageId}-conduct`}
          size='small'
          className='mt-3 overflow-hidden border-emerald-200 shadow-sm'
          bodyStyle={{ padding: 0 }}
        >
          <div className='border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-4'>
            <div className='flex items-start justify-between gap-3 flex-wrap'>
              <div>
                <div className='flex items-center gap-2'>
                  <Activity className='size-4 text-emerald-600' />
                  <Text strong className='text-base'>
                    Conduct summary
                  </Text>
                </div>
                <Text type='secondary'>
                  Read-only student conduct information for the
                  current semester.
                </Text>
              </div>
              <Tag color={scoreTone}>
                {score != null ? `${score}/10` : 'No score'}
              </Tag>
            </div>
          </div>

          <Space
            direction='vertical'
            size='middle'
            className='w-full p-4'
          >
            <Alert
              type={
                scoreValue < 5
                  ? 'warning'
                  : hasViolations
                    ? 'info'
                    : 'success'
              }
              showIcon
              message={
                score == null
                  ? 'No behavioral score recorded'
                  : scoreValue < 5
                    ? 'This score needs attention'
                    : hasViolations
                      ? 'There are violations recorded this semester'
                      : 'You are in good standing'
              }
              description={
                score == null
                  ? 'A behavioral score has not been set for this student yet.'
                  : hasViolations
                    ? 'Review the violations below if you need more context.'
                    : 'No current-semester violations were found.'
              }
            />

            <div className='grid gap-2 sm:grid-cols-2'>
              {[
                ['Student', meta.student?.full_name || '—'],
                ['Student code', meta.student?.student_code || '—'],
                [
                  'Behavioral score',
                  score != null ? String(score) : '—',
                ],
                [
                  'Violations this semester',
                  violations != null ? String(violations) : '—',
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'
                >
                  <Text
                    type='secondary'
                    className='block text-xs uppercase tracking-wide'
                  >
                    {label}
                  </Text>
                  <Text strong className='block break-words'>
                    {value}
                  </Text>
                </div>
              ))}
            </div>

            <AntButton
              icon={<ExternalLink className='size-4' />}
              onClick={() => navigate(ROUTES.STUDENT_CFD_POINTS)}
            >
              Open Conduct
            </AntButton>
          </Space>
        </Card>
      );
    }

    if (meta.type === 'booking_closed') {
      return (
        <Card
          key={`${messageId}-closed`}
          size='small'
          className='mt-3 border-amber-200'
        >
          <Alert
            type='warning'
            showIcon
            message='Booking is closed'
            description='Dormitory booking is not currently open. You can still ask about utilities or conduct.'
          />
        </Card>
      );
    }

    if (meta.type === 'booking_error') {
      return (
        <Card
          key={`${messageId}-error`}
          size='small'
          className='mt-3 border-red-200'
        >
          <Alert
            type='error'
            showIcon
            message='Booking could not be completed'
            description='Please try again or ask the assistant to restart the booking flow.'
          />
        </Card>
      );
    }

    return null;
  };

  const onSendMessage = async (value: string) => {
    await sendMessage(value);
  };

  const onQuestionKeyDown = async (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key !== 'Enter' || e.shiftKey) return;

    e.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isStreaming) return;

    await onSendMessage(trimmedQuestion);
  };

  return (
    <>
      <button
        onClick={onToggle}
        className='fixed z-[50] right-7 bottom-7 rounded-full bg-orange-600 p-3 shadow-lg shadow-orange-600/25 transition-transform hover:scale-105'
      >
        <BotIcon className='size-10 text-white' />
      </button>

      <Drawer
        open={open}
        onClose={onToggle}
        placement='right'
        width={800}
        closeIcon={null}
        title={null}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className='flex h-svh flex-col bg-gradient-to-b from-white via-white to-orange-50/40'>
          <div className='absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-orange-100 bg-white/95 px-4 py-4 backdrop-blur'>
            <div className='flex items-center gap-3'>
              <div className='rounded-2xl bg-orange-100 p-2 text-orange-600'>
                <BotIcon className='size-6' />
              </div>
              <div>
                <p className='text-xl font-semibold'>
                  Dormitory Assistant
                </p>
                <p className='text-sm text-gray-500'>
                  Book beds, review dorm rules, and check utility and
                  conduct details.
                </p>
              </div>
            </div>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                aria-label='Reset assistant chat'
                title='Reset chat'
                onClick={resetAssistant}
                className='rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-orange-600'
              >
                <RefreshCcw className='size-5' />
              </button>
              <button
                type='button'
                aria-label='Close assistant'
                onClick={onToggle}
                className='rounded-full p-2 hover:bg-gray-100'
              >
                <IcClose className='size-5' />
              </button>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto p-4 pt-24'>
            {messagesState.length > 0 ? (
              <ul className='space-y-6'>
                {messagesState.map(({ id, content, role, meta }) => {
                  const isUser = role === 'user';
                  const showBubble =
                    isUser || content.trim().length > 0;

                  return (
                    <li
                      key={id}
                      className={cn(
                        'flex flex-col',
                        isUser ? 'items-end' : 'items-start',
                      )}
                    >
                      {showBubble && (
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 shadow-sm',
                            isUser
                              ? 'ml-4 max-w-md bg-gray-surface'
                              : 'mr-4 max-w-[85%] border border-orange-100 bg-white ring-1 ring-orange-50',
                          )}
                        >
                          <Message content={content} />
                        </div>
                      )}

                      {!isUser && renderMetaCard(meta || null, id)}
                    </li>
                  );
                })}

                {isStreaming && !currentContent && (
                  <div className='flex justify-start'>
                    <LoadingDots />
                  </div>
                )}

                {isStreaming && currentContent && (
                  <div className='mr-4 max-w-[85%] rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm ring-1 ring-orange-50'>
                    <Message content={currentContent} />
                  </div>
                )}

                <div
                  ref={latestDivRef}
                  className={cn(
                    isStreaming ? 'h-80' : 'h-40',
                    'transition-all duration-300 ease-in-out',
                  )}
                />
              </ul>
            ) : (
              <div className='flex min-h-full flex-col justify-center gap-4'>
                <div className='rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm'>
                  <div className='flex items-start gap-3'>
                    <div className='rounded-2xl bg-orange-100 p-3 text-orange-600'>
                      <Sparkles className='size-6' />
                    </div>
                    <div className='space-y-2'>
                      <p className='text-2xl font-semibold'>
                        Welcome
                      </p>
                      <p className='max-w-lg text-base text-gray-600'>
                        I can help you book a bed, review dorm rules,
                        check utility readings, and view your conduct
                        summary.
                      </p>
                    </div>
                  </div>

                  <div className='mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
                    {QUICK_ACTIONS.map(action => {
                      const Icon = action.icon;

                      return (
                        <button
                          key={action.label}
                          onClick={() =>
                            handleQuickAction(action.prompt)
                          }
                          className='flex h-full flex-col items-start gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md'
                        >
                          <div className='rounded-2xl bg-orange-50 p-2 text-orange-600'>
                            <Icon className='size-5' />
                          </div>
                          <div className='space-y-1'>
                            <p className='font-semibold'>
                              {action.label}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {action.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className='sticky bottom-0 border-t border-orange-100 bg-white/95 px-4 py-3 backdrop-blur'>
            {pendingBooking && (
              <div className='mb-3 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='size-4 text-orange-600' />
                    <Text strong className='text-sm'>
                      Booking draft in progress
                    </Text>
                  </div>
                  <Tag
                    color={bookingRulesAccepted ? 'green' : 'orange'}
                  >
                    {bookingRulesAccepted
                      ? 'Rules accepted'
                      : 'Needs review'}
                  </Tag>
                </div>
                <Text type='secondary' className='mt-1 block text-xs'>
                  You can keep asking questions, or use the current
                  draft to continue booking.
                </Text>
              </div>
            )}

            <div className='flex items-end gap-2'>
              <Input.TextArea
                autoFocus
                autoSize={{
                  maxRows: 5,
                  minRows: 1,
                }}
                onKeyDown={onQuestionKeyDown}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder='Ask about dorm rules, booking, utilities, or conduct...'
                className='no-scrollbar !mb-0 !border-none !outline-none !ring-0'
              />
              <Button
                loading={isStreaming}
                disabled={!question.trim() || isStreaming}
                onClick={() => onSendMessage(question.trim())}
                icon={<IcArrowRight className='-rotate-90' />}
                className='mb-0.5 h-11 bg-orange-600 !px-6'
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
});
