'use client';

import { getTranslations } from '@/i18n';
import type { Locale, Invoice } from '@/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const statusBadge: Record<string, string> = {
  draft: 'badge-default',
  sent: 'badge-info',
  paid: 'badge-success',
  overdue: 'badge-danger',
  cancelled: 'badge-default',
};

const methodKeyMap: Record<string, string> = {
  cash: 'cash',
  promptpay: 'promptpay',
  bank_transfer: 'bankTransfer',
  credit_card: 'creditCard',
  debit_card: 'debitCard',
};

export default function BillingPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  async function loadInvoices() {
    setLoading(true);
    try {
      let query = supabase.from('invoices').select('*');
      if (filterStatus) query = query.eq('status', filterStatus);
      query = query.order('created_at', { ascending: false });
      const { data } = await query;
      if (data) setInvoices(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalPending = invoices
    .filter(i => i.status === 'draft' || i.status === 'sent')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalOverdue = invoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.billing.title}</h1>
        <button className="btn btn-primary">{t.billing.add}</button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.billing.draft} / {t.billing.sent}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>฿{totalPending.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.billing.paid}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>฿{totalPaid.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.billing.overdue}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>฿{totalOverdue.toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <select
          className="form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: '250px' }}
        >
          <option value="">{locale === 'en' ? 'All statuses' : 'ทุกสถานะ'}</option>
          <option value="draft">{t.billing.draft}</option>
          <option value="sent">{t.billing.sent}</option>
          <option value="paid">{t.billing.paid}</option>
          <option value="overdue">{t.billing.overdue}</option>
          <option value="cancelled">{t.billing.cancelled}</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : invoices.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            {t.common.noData}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.billing.invoiceNumber}</th>
                  <th>{t.billing.amount}</th>
                  <th>{t.billing.status}</th>
                  <th>{t.billing.paymentMethod}</th>
                  <th>{t.billing.issueDate}</th>
                  <th>{t.billing.dueDate}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ fontWeight: 600 }}>฿{Number(inv.amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${statusBadge[inv.status] || 'badge-default'}`}>
                        {t.billing[inv.status as keyof typeof t.billing] || inv.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {inv.payment_method ? t.billing[methodKeyMap[inv.payment_method] as keyof typeof t.billing] || inv.payment_method : '-'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(inv.issued_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.5rem' }}>
                        {t.billing.generateQR}
                      </button>
                      <button className="btn btn-secondary btn-sm">{t.common.edit}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
