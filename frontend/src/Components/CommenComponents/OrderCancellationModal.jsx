import React, { useState } from 'react';

// ─── Role-based cancellation reasons ─────────────────────────────────────────
const CANCELLATION_REASONS = {
  customer: [
    'Changed my mind',
    'Ordered by mistake',
    'Duplicate order',
    'Delivery time too long',
    'Found better option',
    'Payment issue',
    'Address entered incorrectly',
    'Other',
  ],
  chef: [
    'Item Out of Stock',
    'Ingredients Unavailable',
    'Unable to Prepare Food',
    'Kitchen Closed',
    'Kitchen Busy',
    'Chef Emergency',
    'Power Failure',
    'Equipment Failure',
    'Technical Issue',
    'Restaurant Closed',
    'Other',
  ],
  delivery: [
    'Vehicle Breakdown',
    'Accident',
    'Personal Emergency',
    'Unable to Reach Restaurant',
    'Restaurant Closed',
    'Pickup Delayed',
    'Wrong Pickup Location',
    'Safety Issue',
    'Bad Weather',
    'Technical Issue',
    'Other',
  ],
  admin: [
    'Fraud Detected',
    'Duplicate Order',
    'Payment Verification Failed',
    'Customer Request',
    'Home Chef Request',
    'Delivery Partner Request',
    'Policy Violation',
    'Service Not Available',
    'Technical Issue',
    'Manual Cancellation',
    'Other',
  ],
};

function getRoleKey(role) {
  if (!role) return 'admin';
  const r = role.toLowerCase();
  if (r === 'customer' || r === 'user') return 'customer';
  if (r === 'chef' || r === 'homechef') return 'chef';
  if (r === 'delivery' || r === 'deliveryboy' || r === 'delivery_partner') return 'delivery';
  return 'admin';
}

/**
 * OrderCancellationModal
 *
 * Props:
 *  - order       : The order object (must have `id`, `order_id`, `status`)
 *  - role        : Current user role string
 *  - onClose     : () => void
 *  - onSuccess   : (updatedOrder) => void
 *  - apiCall     : async (id, payload) => response  — should call POST /user-food-orders/cancel/:id
 */
export default function OrderCancellationModal({ order, role, onClose, onSuccess, apiCall }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleKey = getRoleKey(role);
  const reasons = CANCELLATION_REASONS[roleKey] || CANCELLATION_REASONS.admin;

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a cancellation reason.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiCall(order.id, {
        cancellation_reason: reason,
        cancellation_notes: notes,
      });
      onSuccess({ ...order, status: 'Cancelled', cancellation_reason: reason });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ocm-modal">
        {/* Header */}
        <div className="ocm-header">
          <div className="ocm-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="ocm-title">Cancel Order</h2>
            <p className="ocm-order-id">#{order.order_id}</p>
          </div>
          <button className="ocm-close-btn" onClick={onClose} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="ocm-body">
          <div className="ocm-warning-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="ocm-warning-title">Are you sure you want to cancel this order?</p>
              <p className="ocm-warning-sub">This action cannot be undone. Select a cancellation reason before continuing.</p>
            </div>
          </div>

          {/* Reason dropdown */}
          <div className="ocm-field-group">
            <label className="ocm-label">
              Cancellation Reason <span className="ocm-required">*</span>
            </label>
            <select
              className="ocm-select"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
            >
              <option value="">Select a reason…</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="ocm-field-group">
            <label className="ocm-label">Additional Notes <span className="ocm-optional">(Optional)</span></label>
            <textarea
              className="ocm-textarea"
              rows={3}
              placeholder="Provide any extra details about this cancellation…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="ocm-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ocm-footer">
          <button className="ocm-btn-keep" onClick={onClose} disabled={loading}>
            No, Keep Order
          </button>
          <button className="ocm-btn-cancel" onClick={handleSubmit} disabled={loading || !reason}>
            {loading ? (
              <span className="ocm-spinner" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Yes, Cancel Order
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .ocm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(4px); padding: 16px;
          animation: ocmFadeIn 0.2s ease;
        }
        @keyframes ocmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ocm-modal {
          background: #fff; border-radius: 20px; width: 100%; max-width: 480px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.25);
          animation: ocmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
          overflow: hidden;
        }
        @keyframes ocmSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ocm-header {
          display: flex; align-items: center; gap: 14px;
          padding: 22px 24px 18px; border-bottom: 1px solid #f0f0f0;
          background: linear-gradient(135deg, #fff1f1 0%, #fff8f8 100%);
        }
        .ocm-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #ff4d4d 0%, #e60000 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(230,0,0,0.3);
        }
        .ocm-title { font-size: 1.15rem; font-weight: 700; color: #1a1a1a; margin: 0; }
        .ocm-order-id { font-size: 0.82rem; color: #888; margin: 0; margin-top: 2px; font-family: monospace; }
        .ocm-close-btn {
          margin-left: auto; background: #f5f5f5; border: none; border-radius: 10px;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #555; transition: all 0.15s;
        }
        .ocm-close-btn:hover { background: #ffe5e5; color: #e60000; }
        .ocm-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .ocm-warning-box {
          display: flex; gap: 12px; align-items: flex-start;
          background: #fff8e1; border: 1px solid #ffe082;
          border-radius: 12px; padding: 14px 16px; color: #a16207;
        }
        .ocm-warning-box svg { flex-shrink: 0; margin-top: 1px; }
        .ocm-warning-title { font-weight: 600; font-size: 0.92rem; margin: 0 0 4px; }
        .ocm-warning-sub { font-size: 0.82rem; color: #92400e; margin: 0; line-height: 1.45; }
        .ocm-field-group { display: flex; flex-direction: column; gap: 6px; }
        .ocm-label { font-size: 0.88rem; font-weight: 600; color: #374151; }
        .ocm-required { color: #e60000; }
        .ocm-optional { font-weight: 400; color: #9ca3af; font-size: 0.82rem; }
        .ocm-select, .ocm-textarea {
          width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb;
          border-radius: 10px; font-size: 0.9rem; color: #1f2937;
          background: #fafafa; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box; font-family: inherit;
        }
        .ocm-select:focus, .ocm-textarea:focus {
          border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
          background: #fff;
        }
        .ocm-textarea { resize: vertical; min-height: 80px; }
        .ocm-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 10px 14px;
          color: #dc2626; font-size: 0.87rem; font-weight: 500;
        }
        .ocm-footer {
          display: flex; gap: 12px; padding: 16px 24px 22px;
          border-top: 1px solid #f0f0f0;
        }
        .ocm-btn-keep {
          flex: 1; padding: 12px 0; border: 1.5px solid #e5e7eb; background: #fff;
          border-radius: 12px; font-size: 0.92rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.15s;
        }
        .ocm-btn-keep:hover { background: #f9fafb; border-color: #d1d5db; }
        .ocm-btn-cancel {
          flex: 1.4; padding: 12px 0; border: none;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 12px; font-size: 0.92rem; font-weight: 700; color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(239,68,68,0.35);
        }
        .ocm-btn-cancel:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 6px 20px rgba(239,68,68,0.45); transform: translateY(-1px);
        }
        .ocm-btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .ocm-btn-keep:disabled { opacity: 0.5; cursor: not-allowed; }
        .ocm-spinner {
          width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: ocmSpin 0.7s linear infinite; display: inline-block;
        }
        @keyframes ocmSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
