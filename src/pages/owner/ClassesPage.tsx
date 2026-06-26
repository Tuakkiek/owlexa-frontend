import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ClassForm } from './components/ClassForm';
import { classApi } from '../../api/classApi';
import type { ClassResponse, ClassRequest } from '../../types/class';

export const ClassesPage = () => {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassResponse | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await classApi.findAll();
      setClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    const lowerQ = searchQuery.toLowerCase();
    return classes.filter(c => 
      c.name.toLowerCase().includes(lowerQ) || 
      c.vstepLevel.toLowerCase().includes(lowerQ)
    );
  }, [classes, searchQuery]);

  const handleCreate = async (data: ClassRequest) => {
    await classApi.create(data);
    setIsAddModalOpen(false);
    loadClasses();
  };

  const handleUpdate = async (data: ClassRequest) => {
    if (editingClass) {
      await classApi.update(editingClass.id, data);
      setEditingClass(null);
      loadClasses();
    }
  };

  const handleDelete = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      await classApi.delete(classId);
      loadClasses();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6 text-neutral-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header gọn gàng, sử dụng đường kẻ mỏng phân cách */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-neutral-200 space-y-4 sm:space-y-0">
        <h1 className="text-xl font-medium tracking-tight">Class Management</h1>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="border border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 rounded-none px-4 py-2 text-sm transition-colors"
        >
          Create Class
        </Button>
      </div>

      {/* Thanh tìm kiếm tinh giản, bỏ nền xám */}
      <div className="max-w-md w-full">
        <Input 
          label=""
          placeholder="Search by name or level..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Khu vực bảng dữ liệu - loại bỏ đổ bóng và bo góc quá đà */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-neutral-400">Loading classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No classes found.</div>
        ) : (
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-normal">
                <th className="pb-3 pr-4 font-normal">Class Name</th>
                <th className="pb-3 px-4 font-normal">Level</th>
                <th className="pb-3 px-4 font-normal text-right">Max Students</th>
                <th className="pb-3 px-4 font-normal text-right">Monthly Fee</th>
                <th className="pb-3 px-4 font-normal text-center">Status</th>
                <th className="pb-3 pl-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 pr-4 font-normal text-neutral-900">{cls.name}</td>
                  <td className="py-4 px-4 text-neutral-500">{cls.vstepLevel}</td>
                  <td className="py-4 px-4 text-neutral-500 text-right">{cls.maxStudents}</td>
                  <td className="py-4 px-4 text-neutral-900 text-right">{formatCurrency(cls.monthFee)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-xs uppercase tracking-wider text-neutral-600">
                      {cls.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 pl-4 text-right text-xs space-x-4">
                    <button
                      onClick={() => setEditingClass(cls)}
                      className="text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="text-neutral-400 hover:text-neutral-900 underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals giữ nguyên logic xử lý */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Class"
      >
        <ClassForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        title="Edit Class"
      >
        {editingClass && (
          <ClassForm
            initialData={{
              name: editingClass.name,
              vstepLevel: editingClass.vstepLevel,
              maxStudent: editingClass.maxStudents,
              monthlyFee: editingClass.monthFee,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingClass(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ClassesPage;