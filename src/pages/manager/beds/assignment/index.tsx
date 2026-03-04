import { useEffect, useState } from 'react';
import { Select, Button, Alert, Tag, Modal } from 'antd';
import { ArrowRight, UserCheck, BedDouble } from 'lucide-react';
import {
  fetchBeds,
  changeBedAssignment,
  type Bed,
} from '@/lib/actions/admin';

const BED_LABEL = (b: Bed) => {
  const room = `${b.room?.block?.block_name ?? ''}-${b.room?.room_number ?? ''}`;
  return `${room} · Bed #${b.bed_number}`;
};

export default function ChangeBedAssignmentPage() {
  const [occupiedBeds, setOccupiedBeds] = useState<Bed[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [loadingOccupied, setLoadingOccupied] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [sourceBedId, setSourceBedId] = useState<string | undefined>();
  const [targetBedId, setTargetBedId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sourceBed = occupiedBeds.find((b) => b.id === sourceBedId);
  const targetBed = availableBeds.find((b) => b.id === targetBedId);

  useEffect(() => {
    loadOccupied();
    loadAvailable();
  }, []);

  const loadOccupied = async () => {
    try {
      setLoadingOccupied(true);
      const res = await fetchBeds({ status: 'occupied', page: 1, limit: 500 });
      setOccupiedBeds(res.items);
    } catch { /* silent */ } finally {
      setLoadingOccupied(false);
    }
  };

  const loadAvailable = async () => {
    try {
      setLoadingAvailable(true);
      const res = await fetchBeds({ status: 'available', page: 1, limit: 500 });
      setAvailableBeds(res.items);
    } catch { /* silent */ } finally {
      setLoadingAvailable(false);
    }
  };

  const handleConfirm = () => {
    if (!sourceBedId || !targetBedId) return;
    Modal.confirm({
      title: 'Confirm Bed Assignment Change',
      content: (
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>From:</strong> {sourceBed ? BED_LABEL(sourceBed) : '-'}</p>
          <p><strong>Student:</strong> {sourceBed?.contract?.student.full_name} ({sourceBed?.contract?.student.student_code})</p>
          <p><strong>To:</strong> {targetBed ? BED_LABEL(targetBed) : '-'}</p>
          <p className="text-orange-600 text-xs mt-2">This will update the student's contract and bed statuses.</p>
        </div>
      ),
      okText: 'Confirm',
      cancelText: 'Cancel',
      okButtonProps: { danger: false },
      centered: true,
      onOk: handleSubmit,
    });
  };

  const handleSubmit = async () => {
    if (!sourceBedId || !targetBedId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await changeBedAssignment(sourceBedId, targetBedId);
      setSuccessMsg(
        `Successfully moved ${sourceBed?.contract?.student.full_name} from Bed #${sourceBed?.bed_number} to Bed #${targetBed?.bed_number}`
      );
      setSourceBedId(undefined);
      setTargetBedId(undefined);
      // Reload lists
      await Promise.all([loadOccupied(), loadAvailable()]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change bed assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UserCheck size={22} className="text-orange-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Change Bed Assignment</h1>
          <p className="text-sm text-gray-500">Move a student from one bed to another available bed</p>
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon className="mb-4" closable onClose={() => setErrorMsg(null)} />}
      {successMsg && <Alert type="success" message={successMsg} showIcon className="mb-4" closable onClose={() => setSuccessMsg(null)} />}

      {/* Assignment panel */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">

        {/* Source bed (occupied) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-800">Current Bed (Occupied)</span>
            <Tag color="blue" className="ml-auto">{occupiedBeds.length} beds</Tag>
          </div>
          <Select
            showSearch
            allowClear
            placeholder="Search occupied bed or student..."
            loading={loadingOccupied}
            value={sourceBedId}
            onChange={(v) => { setSourceBedId(v); setErrorMsg(null); }}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={occupiedBeds.map((b) => ({
              value: b.id,
              label: `${BED_LABEL(b)} — ${b.contract?.student.full_name ?? ''} (${b.contract?.student.student_code ?? ''})`,
            }))}
            style={{ width: '100%' }}
          />

          {/* Source bed detail */}
          {sourceBed && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
              <div className="font-medium text-blue-800 mb-2">
                {sourceBed.room?.block?.block_name}-{sourceBed.room?.room_number} · Bed #{sourceBed.bed_number}
              </div>
              {sourceBed.contract && (
                <div className="space-y-1 text-gray-700">
                  <div><span className="text-gray-500">Name:</span> {sourceBed.contract.student.full_name}</div>
                  <div><span className="text-gray-500">Code:</span> {sourceBed.contract.student.student_code}</div>
                  {sourceBed.contract.student.phone && (
                    <div><span className="text-gray-500">Phone:</span> {sourceBed.contract.student.phone}</div>
                  )}
                  <div><span className="text-gray-500">Semester:</span> {sourceBed.contract.semester}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center py-4 md:py-16">
          <ArrowRight size={32} className="text-orange-400" />
        </div>

        {/* Target bed (available) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={16} className="text-green-500" />
            <span className="font-semibold text-gray-800">Target Bed (Available)</span>
            <Tag color="green" className="ml-auto">{availableBeds.length} beds</Tag>
          </div>
          <Select
            showSearch
            allowClear
            placeholder="Search available bed..."
            loading={loadingAvailable}
            value={targetBedId}
            onChange={(v) => { setTargetBedId(v); setErrorMsg(null); }}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={availableBeds.map((b) => ({
              value: b.id,
              label: BED_LABEL(b),
            }))}
            style={{ width: '100%' }}
          />

          {/* Target bed detail */}
          {targetBed && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
              <div className="font-medium text-green-800 mb-1">
                {targetBed.room?.block?.block_name}-{targetBed.room?.room_number} · Bed #{targetBed.bed_number}
              </div>
              <div className="text-gray-500">
                Room capacity: {targetBed.room?.total_beds} beds · {targetBed.room?.available_beds} available
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm button */}
      <div className="mt-6 flex justify-center">
        <Button
          type="primary"
          size="large"
          disabled={!sourceBedId || !targetBedId}
          loading={submitting}
          onClick={handleConfirm}
          className="px-10"
        >
          Confirm Assignment Change
        </Button>
      </div>
    </div>
  );
}
