const LINE_API_BASE = 'https://api.line.me/v2/bot/message';

type LineNotifyParams = {
  token: string;
  message: string;
};

export async function sendLineNotify({ token, message }: LineNotifyParams): Promise<boolean> {
  try {
    const res = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type LinePushMessage = {
  to: string;
  messages: Array<{
    type: 'text' | 'sticker' | 'image' | 'flex';
    text?: string;
    altText?: string;
    contents?: unknown;
  }>;
};

export async function pushLineMessage(
  channelAccessToken: string,
  payload: LinePushMessage
): Promise<boolean> {
  try {
    const res = await fetch(`${LINE_API_BASE}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendBillingAlert(
  channelAccessToken: string,
  lineUserId: string,
  patientName: string,
  amount: number,
  dueDate: string,
  invoiceUrl: string,
  locale: 'en' | 'th'
): Promise<boolean> {
  const message = locale === 'en'
    ? `[Billing Notice]\nPatient: ${patientName}\nAmount: ฿${amount.toFixed(2)}\nDue Date: ${dueDate}\nView invoice: ${invoiceUrl}`
    : `[แจ้งเตือนการเรียกเก็บเงิน]\nผู้ป่วย: ${patientName}\nจำนวนเงิน: ${amount.toFixed(2)} บาท\nกำหนดชำระ: ${dueDate}\nดูใบแจ้งหนี้: ${invoiceUrl}`;

  return pushLineMessage(channelAccessToken, {
    to: lineUserId,
    messages: [{ type: 'text', text: message }],
  });
}

export async function sendAppointmentReminder(
  channelAccessToken: string,
  lineUserId: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  location: string,
  locale: 'en' | 'th'
): Promise<boolean> {
  const message = locale === 'en'
    ? `[Appointment Reminder]\nPatient: ${patientName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nLocation: ${location}`
    : `[แจ้งเตือนการนัดหมาย]\nผู้ป่วย: ${patientName}\nวันที่: ${appointmentDate}\nเวลา: ${appointmentTime}\nสถานที่: ${location}`;

  return pushLineMessage(channelAccessToken, {
    to: lineUserId,
    messages: [{ type: 'text', text: message }],
  });
}
