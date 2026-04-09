import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, message, Modal, Select, Table, Tag } from 'antd';
import {
  CameraOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getRegisteredStudents, registerFace, removeFace } from '@/lib/actions/faceRecognition';
import type { IFaceRecognition } from '@/interfaces';
import { api } from '@/lib/apiRequest';

interface StudentOption {
  value: string;
  label: string;
  code: string;
}

export default function FaceRegistrationPage() {
  // ─── State ───
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [registeredList, setRegisteredList] = useState<IFaceRecognition.RegisteredStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── Load students for the selector ───
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await api.get<
          { _id: string; student_code: string; full_name: string }[]
        >('face-recognition/all-students');
        if (Array.isArray(data)) {
          setStudents(
            data.map((s) => ({
              value: s._id,
              label: `${s.full_name} (${s.student_code})`,
              code: s.student_code,
            }))
          );
        }
      } catch {
        // Silently fail on initial load
      }
    };
    loadStudents();
  }, []);

  // ─── Load registered students ───
  const loadRegistered = useCallback(async () => {
    try {
      const data = await getRegisteredStudents();
      if (Array.isArray(data)) {
        setRegisteredList(data);
      }
    } catch {
      // Silently fail on initial load
    }
  }, []);

  useEffect(() => {
    loadRegistered();
  }, [loadRegistered]);

  // ─── Webcam controls ───
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setCapturedImage(null);
      setCapturedBlob(null);
    } catch (err) {
      message.error('Failed to access webcam. Please check permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setCapturedBlob(blob);
      },
      'image/jpeg',
      0.9
    );
  };

  // ─── Register face ───
  const handleRegister = async () => {
    if (!selectedStudent) {
      message.warning('Please select a student first');
      return;
    }
    if (!capturedBlob) {
      message.warning('Please capture a photo first');
      return;
    }

    setLoading(true);
    try {
      const file = new File([capturedBlob], 'face.jpg', { type: 'image/jpeg' });
      await registerFace(selectedStudent, file);
      message.success('Face registered successfully!');
      setCapturedImage(null);
      setCapturedBlob(null);
      setSelectedStudent(null);
      await loadRegistered();
    } catch (err: unknown) {
      const error = err as { message?: string };
      message.error(error.message || 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  // ─── Remove face ───
  const handleRemove = async (studentId: string) => {
    Modal.confirm({
      title: 'Remove Face Registration',
      content: 'Are you sure you want to remove this student\'s face registration?',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await removeFace(studentId);
          message.success('Face registration removed');
          await loadRegistered();
        } catch {
          message.error('Failed to remove face registration');
        }
      },
    });
  };

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Table columns ───
  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_: unknown, record: IFaceRecognition.RegisteredStudent) => (
        <div className="flex items-center gap-3">
          {record.faceImageUrl ? (
            <img
              src={record.faceImageUrl}
              alt={record.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserOutlined />
            </div>
          )}
          <div>
            <div className="font-medium">{record.fullName}</div>
            <div className="text-sm text-gray-500">{record.studentCode}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quality',
      dataIndex: 'qualityScore',
      key: 'quality',
      render: (score: number) => {
        const color = score >= 0.8 ? 'green' : score >= 0.6 ? 'orange' : 'red';
        return <Tag color={color}>{(score * 100).toFixed(0)}%</Tag>;
      },
    },
    {
      title: 'Registered By',
      dataIndex: 'registeredBy',
      key: 'registeredBy',
    },
    {
      title: 'Date',
      dataIndex: 'registeredAt',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: IFaceRecognition.RegisteredStudent) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              setSelectedStudent(record.studentId);
              startWebcam();
            }}
          >
            Re-register
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(record.studentId)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Face Registration</h1>
        <p className="text-gray-500 mt-1">
          Register student faces for AI-powered check-in/check-out
        </p>
      </div>

      {/* Registration Form */}
      <Card title="Register New Face">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Student selector + webcam */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Student
              </label>
              <Select
                showSearch
                placeholder="Search by name or student code..."
                value={selectedStudent}
                onChange={setSelectedStudent}
                options={students}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                className="w-full"
                size="large"
                suffixIcon={<SearchOutlined />}
              />
            </div>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isStreaming && !capturedImage ? 'block' : 'none' }}
              />
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              ) : !isStreaming ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <CameraOutlined className="text-4xl mb-2" />
                    <p>Click "Start Webcam" to begin</p>
                  </div>
                </div>
              ) : null}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!isStreaming ? (
                <Button type="primary" icon={<CameraOutlined />} onClick={startWebcam}>
                  Start Webcam
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    onClick={capturePhoto}
                    disabled={!!capturedImage}
                  >
                    Capture
                  </Button>
                  {capturedImage && (
                    <Button
                      onClick={() => {
                        setCapturedImage(null);
                        setCapturedBlob(null);
                      }}
                    >
                      Retake
                    </Button>
                  )}
                  <Button danger onClick={stopWebcam}>
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right: Preview + Register button */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
              <h3 className="font-medium mb-3">Registration Preview</h3>
              {selectedStudent ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">Student:</span>{' '}
                    <span className="font-medium">
                      {students.find((s) => s.value === selectedStudent)?.label}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Photo:</span>{' '}
                    {capturedImage ? (
                      <Tag color="green">Captured</Tag>
                    ) : (
                      <Tag color="orange">Not captured</Tag>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Select a student to begin</p>
              )}
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              disabled={!selectedStudent || !capturedBlob}
              onClick={handleRegister}
            >
              Register Face
            </Button>
          </div>
        </div>
      </Card>

      {/* Registered Students Table */}
      <Card
        title={`Registered Students (${registeredList.length})`}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadRegistered}>
            Refresh
          </Button>
        }
      >
        <Table
          dataSource={registeredList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No students registered yet' }}
        />
      </Card>
    </div>
  );
}
