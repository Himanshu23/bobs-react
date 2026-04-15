export type VoiceRecordResult =
  | { ok: true; blob: Blob }
  | { ok: false; error: string };

const pickSupportedMimeType = () => {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  if (typeof MediaRecorder === 'undefined') return undefined;
  const isTypeSupported = (MediaRecorder as any).isTypeSupported?.bind(
    MediaRecorder
  ) as ((type: string) => boolean) | undefined;

  for (const type of candidates) {
    if (!isTypeSupported || isTypeSupported(type)) return type;
  }
  return undefined;
};

export async function recordAudioForMs(
  durationMs: number
): Promise<VoiceRecordResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: 'Audio recording is not supported.' };
  }

  let stream: MediaStream | undefined;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return { ok: false, error: 'Microphone permission denied.' };
  }

  const mimeType = pickSupportedMimeType();

  let recorder: MediaRecorder;
  try {
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    return { ok: false, error: 'Failed to start audio recorder.' };
  }

  const chunks: BlobPart[] = [];
  let recordedType: string | undefined;

  return await new Promise<VoiceRecordResult>((resolve) => {
    const cleanup = () => {
      stream?.getTracks().forEach((t) => t.stop());
    };

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedType = e.data.type || recordedType;
        chunks.push(e.data);
      }
    };

    recorder.onerror = () => {
      cleanup();
      resolve({ ok: false, error: 'Recording error.' });
    };

    recorder.onstop = () => {
      cleanup();
      const type = mimeType || recordedType || 'audio/webm';
      resolve({ ok: true, blob: new Blob(chunks, { type }) });
    };

    recorder.start();
    window.setTimeout(() => recorder.stop(), durationMs);
  });
}

