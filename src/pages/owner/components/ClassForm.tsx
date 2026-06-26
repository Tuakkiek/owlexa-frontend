import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { ClassRequest } from '../../../types/class';

interface ClassFormProps {
  initialData?: ClassRequest;
  onSubmit: (data: ClassRequest) => Promise<void>;
  onCancel: () => void;
}

export const ClassForm = ({ initialData, onSubmit, onCancel }: ClassFormProps) => {
  const [formData, setFormData] = useState<ClassRequest>({
    name: '',
    vstepLevel: '',
    maxStudent: 15,
    monthlyFee: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassRequest, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClassRequest, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Class name is required';
    if (!formData.vstepLevel.trim()) newErrors.vstepLevel = 'VSTEP Level is required';
    if (formData.maxStudent < 1) newErrors.maxStudent = 'Max student must be at least 1';
    if (formData.monthlyFee < 0) newErrors.monthlyFee = 'Monthly fee cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      // Ensure numeric fields are numbers
      await onSubmit({
        ...formData,
        maxStudent: Number(formData.maxStudent),
        monthlyFee: Number(formData.monthlyFee),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Class Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="e.g., VSTEP Intensive 01"
      />
      
      <Input
        label="VSTEP Level"
        value={formData.vstepLevel}
        onChange={(e) => setFormData({ ...formData, vstepLevel: e.target.value })}
        error={errors.vstepLevel}
        placeholder="e.g., B1, B2"
      />

      <Input
        label="Max Students"
        type="number"
        value={formData.maxStudent}
        onChange={(e) => setFormData({ ...formData, maxStudent: Number(e.target.value) })}
        error={errors.maxStudent}
      />

      <Input
        label="Monthly Fee"
        type="number"
        value={formData.monthlyFee}
        onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
        error={errors.monthlyFee}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Class' : 'Create Class'}
        </Button>
      </div>
    </form>
  );
};
