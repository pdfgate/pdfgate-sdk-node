import { createHmac, timingSafeEqual } from 'node:crypto';
import { PdfGateSignatureVerificationError } from '../types/classes.js';

type VerifySignatureOptions = {
  toleranceSeconds?: number;
  currentTimestamp?: number;
};

export function verifySignature(
  secret: string,
  signatureHeader: string | undefined,
  payload: Buffer | string
): true {
  return verifySignatureInternal(secret, signatureHeader, payload);
}

export function verifySignatureInternal(
  secret: string,
  signatureHeader: string | undefined,
  payload: Buffer | string,
  options: VerifySignatureOptions = {}
): true {
  const parts = signatureHeader?.split(',').map((part) => part.trim()) ?? [];
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 't' && value) {
      timestamp = Number(value);
    }

    if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (!timestamp || Number.isNaN(timestamp)) {
    throw new PdfGateSignatureVerificationError('Missing timestamp');
  }

  if (signatures.length === 0) {
    throw new PdfGateSignatureVerificationError('Missing signature');
  }

  const toleranceSeconds = options.toleranceSeconds ?? 300;
  const currentTimestamp = options.currentTimestamp ?? Math.floor(Date.now() / 1000);

  if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
    throw new PdfGateSignatureVerificationError('Signature expired');
  }

  const rawPayload = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
  const signedPayload = `${timestamp}.${rawPayload}`;
  const expectedSignature = createHmac('sha256', secret).update(signedPayload).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  const isValid = signatures.some((signature) => {
    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      return (
        signatureBuffer.length === expectedBuffer.length &&
        timingSafeEqual(signatureBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });

  if (!isValid) {
    throw new PdfGateSignatureVerificationError('Invalid signature');
  }

  return true;
}
