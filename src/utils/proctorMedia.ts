/**
 * proctorMedia.ts
 * Enterprise-grade WebRTC and MediaRecorder utility for KLE Technological University
 * Online Course Examination System Agent proctoring engine.
 */

export interface ProctorStreamResult {
  stream: MediaStream;
  isVirtual: boolean;
  resolution: { width: number; height: number };
  stop: () => void;
  error?: string;
}

/**
 * Creates an animated virtual proctor test camera stream using an HTML5 Canvas.
 * Used when a physical webcam is not attached, permission is blocked by iframe,
 * or during automated sandbox testing. Emits a valid MediaStream with video and audio tracks
 * so MediaRecorder and proctoring telemetry function completely.
 */
export function createVirtualProctorStream(
  candidateName = 'Student Candidate',
  studentId = 'KLE2024-CS042'
): { stream: MediaStream; stop: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let animationFrameId: number;
  let angle = 0;

  // Create subtle audio oscillator for audio track
  let audioContext: AudioContext | null = null;
  let dest: MediaStreamAudioDestinationNode | null = null;
  let osc: OscillatorNode | null = null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
      dest = audioContext.createMediaStreamDestination();
      osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.value = 0.001; // Inaudible room tone for valid audio track
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
    }
  } catch (e) {
    console.warn('Virtual audio track notice:', e);
  }

  const renderFrame = () => {
    angle += 0.03;
    const now = new Date();

    // Dark academic slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Simulated candidate silhouette & face target
    const centerX = canvas.width / 2 + Math.sin(angle) * 12;
    const centerY = canvas.height / 2 - 20 + Math.cos(angle * 0.8) * 8;

    // Candidate body silhouette
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 130, 85, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Candidate head
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 20, 52, 0, Math.PI * 2);
    ctx.fill();

    // Simulated facial features
    ctx.fillStyle = '#64748b';
    // Eyes
    ctx.beginPath();
    ctx.arc(centerX - 18, centerY + 12, 5, 0, Math.PI * 2);
    ctx.arc(centerX + 18, centerY + 12, 5, 0, Math.PI * 2);
    ctx.fill();
    // Smile / expression
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 28, 14, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    // Dynamic AI Biometric Tracking Box
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    const boxSize = 130;
    const half = boxSize / 2;
    const corner = 18;

    // Corner brackets
    // Top-left
    ctx.beginPath();
    ctx.moveTo(centerX - half, centerY - half + corner);
    ctx.lineTo(centerX - half, centerY - half);
    ctx.lineTo(centerX - half + corner, centerY - half);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(centerX + half - corner, centerY - half);
    ctx.lineTo(centerX + half, centerY - half);
    ctx.lineTo(centerX + half, centerY - half + corner);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(centerX - half, centerY + half - corner);
    ctx.lineTo(centerX - half, centerY + half);
    ctx.lineTo(centerX - half + corner, centerY + half);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(centerX + half - corner, centerY + half);
    ctx.lineTo(centerX + half, centerY + half);
    ctx.lineTo(centerX + half, centerY + half - corner);
    ctx.stroke();

    // Live AI tracking metadata badge (Clearly marked SIMULATED)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(centerX - half, centerY - half - 22, 160, 20);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('SIMULATED STREAM (DEMO)', centerX - half + 4, centerY - half - 8);

    // Large high-visibility center watermark for proctor honesty
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEMO: NOT A REAL PROCTOR FEED', canvas.width / 2, canvas.height / 2 + 80);
    ctx.restore();

    // KLE Technological University watermark & header
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(16, 16, 32, 22);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('KLE', 21, 31);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KLE TECHNOLOGICAL UNIVERSITY', 56, 31);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('DEMO MODE • SYNTHETIC PROCTOR CANVAS STREAM', 56, 45);

    // Live timestamp & recording banner
    const timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(16, canvas.height - 48, canvas.width - 32, 34);

    // Blinking red recording dot
    const blink = Math.floor(now.getTime() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(28, canvas.height - 31, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('REC', 38, canvas.height - 27);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px monospace';
    ctx.fillText(`TIME: ${timeStr}  |  ID: ${studentId}`, 70, canvas.height - 27);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(candidateName.toUpperCase(), canvas.width - 170, canvas.height - 27);

    animationFrameId = requestAnimationFrame(renderFrame);
  };

  renderFrame();

  const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream(30);

  // Combine with audio track if available
  if (dest && dest.stream.getAudioTracks().length > 0) {
    const audioTrack = dest.stream.getAudioTracks()[0];
    canvasStream.addTrack(audioTrack);
  }

  const stop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (osc) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
    }
    canvasStream.getTracks().forEach((track) => track.stop());
  };

  return { stream: canvasStream, stop };
}

/**
 * Attempts to request real camera and microphone media with multiple graceful fallbacks.
 * If hardware camera is blocked or not found, provides clear diagnostic reasons.
 */
export async function requestHardwareMediaStream(
  preferDeviceId?: string
): Promise<{ stream: MediaStream; resolution: { width: number; height: number } }> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Webcam media capture API is not supported in this browser.');
  }

  let stream: MediaStream;

  // Try 1: High definition front-facing camera with audio
  try {
    const constraints: MediaStreamConstraints = {
      video: preferDeviceId
        ? { deviceId: { exact: preferDeviceId } }
        : {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
          },
      audio: true,
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err1) {
    console.warn('HD camera with audio constraint failed, trying basic video+audio:', err1);
    // Try 2: Basic video + audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err2) {
      console.warn('Video + audio failed, trying video only:', err2);
      // Try 3: Video only
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }
  }

  // Determine actual resolution from track settings
  let width = 640;
  let height = 480;
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    const settings = videoTrack.getSettings();
    if (settings.width && settings.height) {
      width = settings.width;
      height = settings.height;
    }
  }

  return { stream, resolution: { width, height } };
}

/**
 * Captures a crisp JPEG data URL snapshot from an active HTMLVideoElement
 */
export function captureVideoFrame(videoElement: HTMLVideoElement): string | null {
  try {
    if (!videoElement || videoElement.videoWidth === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror image for frontal camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (e) {
    console.warn('Failed to capture video frame snapshot:', e);
    return null;
  }
}

/**
 * Helper to determine best supported MediaRecorder MIME type
 */
export function getSupportedRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidateTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}
