import { NextResponse } from 'next/server';
import {
  sendLineNotify,
  sendBillingAlert,
  sendAppointmentReminder,
} from '@/lib/line';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

    let success = false;
    switch (action) {
      case 'notify': {
        const { token, message } = params as { token: string; message: string };
        success = await sendLineNotify({ token, message });
        break;
      }
      case 'billing': {
        const { lineUserId, patientName, amount, dueDate, invoiceUrl, locale } =
          params as {
            lineUserId: string;
            patientName: string;
            amount: number;
            dueDate: string;
            invoiceUrl: string;
            locale: 'en' | 'th';
          };
        success = await sendBillingAlert(
          channelToken,
          lineUserId,
          patientName,
          amount,
          dueDate,
          invoiceUrl,
          locale
        );
        break;
      }
      case 'reminder': {
        const {
          lineUserId: rLineUserId,
          patientName: rPatientName,
          appointmentDate,
          appointmentTime,
          location,
          locale: rLocale,
        } = params as {
          lineUserId: string;
          patientName: string;
          appointmentDate: string;
          appointmentTime: string;
          location: string;
          locale: 'en' | 'th';
        };
        success = await sendAppointmentReminder(
          channelToken,
          rLineUserId,
          rPatientName,
          appointmentDate,
          appointmentTime,
          location,
          rLocale
        );
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}
