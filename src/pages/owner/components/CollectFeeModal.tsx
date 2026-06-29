import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { FeeRecordResponse, CashPaymentRequest } from '../../../types/fee';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecordResponse | null;
  onSubmit: (feeRecordId: number, data: CashPaymentRequest) => Promise<void>;
}

export const CollectFeeModal = ({ isOpen, onClose, feeRecord, onSubmit }: CollectFeeModalProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && feeRecord) {
      // Default to remaining balance
      const remaining = feeRecord.amount - feeRecord.paidAmount;
      setAmount(remaining);
      setNote('');
      setError('');
    }
  }, [isOpen, feeRecord]);

  if (!feeRecord) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const remaining = feeRecord.amount - feeRecord.paidAmount;
    if (amount > remaining) {
      setError(`Amount cannot exceed the remaining balance (${formatCurrency(remaining)})`);
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(feeRecord.id, { amount, note });
      onClose();
    } catch (err) {
      setError('Failed to collect cash. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const remainingBalance = feeRecord.amount - feeRecord.paidAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Cash Payment">
      <div className="mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Student:</span>
          <span className="font-medium text-gray-900">{feeRecord.studentFullName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Class:</span>
          <span className="font-medium text-gray-900">{feeRecord.className}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Month:</span>
          <span className="font-medium text-gray-900">{feeRecord.month}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="text-gray-500">Total Fee:</span>
          <span className="font-medium text-gray-900">{formatCurrency(feeRecord.amount)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Already Paid:</span>
          <span>{formatCurrency(feeRecord.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-red-600 pt-1">
          <span>Remaining Balance:</span>
          <span>{formatCurrency(remainingBalance)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount to Collect (VND)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          error={error}
        />
        
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
          <input
            type="text"
            className="px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid in full by mother"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
