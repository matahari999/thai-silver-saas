import * as crypto from 'crypto';

type PromptPayParams = {
  targetId: string;
  amount: number;
  payloadFormatIndicator?: string;
  pointOfInitiationMethod?: string;
  merchantCategoryCode?: string;
  transactionCurrency?: string;
  countryCode?: string;
};

type EMVField = {
  id: string;
  value: string;
};

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function buildEMVString(fields: EMVField[]): string {
  return fields.map(f => `${f.id}${String(f.value.length).padStart(2, '0')}${f.value}`).join('');
}

export function generatePromptPayQR({
  targetId,
  amount,
  payloadFormatIndicator = '01',
  pointOfInitiationMethod = '12',
  merchantCategoryCode = '0000',
  transactionCurrency = '764',
  countryCode = 'TH',
}: PromptPayParams): string {
  const cleanId = targetId.replace(/[^0-9]/g, '');

  let targetTag: string;
  let targetData: string;
  if (cleanId.length === 15) {
    targetTag = '01';
    const mobile = cleanId.slice(0, 13);
    const countryCodePrefix = '0066';
    targetData = countryCodePrefix + mobile.slice(1);
  } else if (cleanId.length === 13) {
    targetTag = '02';
    targetData = cleanId;
  } else {
    targetTag = '01';
    const padded = cleanId.padStart(13, '0');
    const countryCodePrefix = '0066';
    targetData = countryCodePrefix + padded.slice(1);
  }

  const merchantIdLen = targetData.length + 4;
  const merchantAccountInfo = buildEMVString([
    { id: '00', value: 'A000000677012006' },
    { id: targetTag, value: targetData },
  ]);

  const amountFormatted = amount.toFixed(2);

  const qrData = buildEMVString([
    { id: '00', value: payloadFormatIndicator },
    { id: '01', value: pointOfInitiationMethod },
    { id: '29', value: merchantAccountInfo },
    { id: '52', value: merchantCategoryCode },
    { id: '53', value: transactionCurrency },
    { id: '54', value: amountFormatted },
    { id: '58', value: countryCode },
    { id: '59', value: 'SilverCare' },
    { id: '60', value: 'Bangkok' },
  ]) + '6304';

  const finalQr = qrData + crc16(qrData);

  return finalQr;
}

export function isValidThaiNationalId(id: string): boolean {
  const clean = id.replace(/[^0-9]/g, '');
  if (clean.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return parseInt(clean[12]) === checkDigit;
}
