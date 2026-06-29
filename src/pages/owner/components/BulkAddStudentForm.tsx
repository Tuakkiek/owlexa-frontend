import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import type { BulkStudentRequest, BulkStudentResult } from '../../../types/student';

interface BulkAddStudentFormProps {
  onSubmit: (data: BulkStudentRequest) => Promise<BulkStudentResult[]>;
  onCancel: () => void;
}

export const BulkAddStudentForm = ({ onSubmit, onCancel }: BulkAddStudentFormProps) => {
  const [textData, setTextData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<BulkStudentResult[] | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!textData.trim()) {
      setError('Please enter some data');
      return;
    }

    const lines = textData.split('\n').filter((line) => line.trim() !== '');
    const students = lines.map((line) => {
      // Assuming format: Phone, Name, Email
      const parts = line.split(',').map((p) => p.trim());
      return {
        phoneNumber: parts[0] || '',
        fullName: parts[1] || '',
        email: parts[2] || '',
      };
    });

    const invalid = students.find(t => !t.phoneNumber || !t.fullName || !t.email);
    if (invalid) {
      setError('Each line must contain Phone, Name, and Email separated by commas.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await onSubmit({ students });
      setResults(res);
    } catch (err) {
      setError('Failed to bulk add students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (results) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded text-green-800">
          Successfully processed {results.length} students.
        </div>
        <div className="max-h-64 overflow-y-auto border rounded divide-y">
          {results.map((r, i) => (
            <div key={i} className="p-3 flex justify-between">
              <div>
                <p className="font-medium">{r.phoneNumber}</p>
                {r.message && <p className="text-sm text-red-500">{r.message}</p>}
              </div>
              {r.temporaryPassword && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Temp Password:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{r.temporaryPassword}</code>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onCancel}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paste Student Data
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Format each line as: <code>Phone, Full Name, Email</code>
        </p>
        <textarea
          rows={6}
          className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
          value={textData}
          onChange={(e) => setTextData(e.target.value)}
          placeholder="0912345678, Nguyen Van A, a@example.com&#10;0987654321, Tran Thi B, b@example.com"
        />
        {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Import Students
        </Button>
      </div>
    </form>
  );
};
