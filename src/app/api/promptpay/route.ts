import { NextResponse } from 'next/server';
import { generatePromptPayQR } from '@/lib/promptpay';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetId, amount } = body;

    if (!targetId || amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: 'targetId and amount (positive number) are required' },
        { status: 400 }
      );
    }

    const qrRaw = generatePromptPayQR({ targetId, amount: Number(amount) });
    const qrImage = await QRCode.toDataURL(qrRaw, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return NextResponse.json({
      qr_raw: qrRaw,
      qr_data_url: qrImage,
      amount: Number(amount),
      currency: 'THB',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate QR' },
      { status: 500 }
    );
  }
}
