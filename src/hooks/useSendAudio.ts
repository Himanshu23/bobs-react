import { ENDPOINTS } from '../config/api';
import { trackEvent } from '../utils/analytics';

export const useSendAudio = () => {
  const sendAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');

    const res = await fetch(`${ENDPOINTS.SEND_VOICE}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Voice upload failed (${res.status})`);
    }

    const data = (await res.json()) as { text?: string };
    trackEvent('voice_transcribe_result', {
      has_text: Boolean(data.text),
    });

    if (data.text) {
      window.dispatchEvent(
        new CustomEvent('voice:text', { detail: { text: data.text } })
      );
    }
  };

  return sendAudio;
};
