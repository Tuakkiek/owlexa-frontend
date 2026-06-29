import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StudentForm } from './components/StudentForm';
import { BulkAddStudentForm } from './components/BulkAddStudentForm';
import { studentApi } from '../../api/studentApi';
import type { StudentResponse, StudentRequest, BulkStudentRequest, BulkStudentResult } from '../../types/student';

export const StudentsPage = () => {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await studentApi.findAll();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQ = searchQuery.toLowerCase();
    return students.filter(s => 
      s.fullName.toLowerCase().includes(lowerQ) || 
      s.phoneNumber.includes(lowerQ)
    );
  }, [students, searchQuery]);

  const handleCreate = async (data: StudentRequest) => {
    await studentApi.create(data);
    setIsAddModalOpen(false);
    loadStudents();
  };

  const handleUpdate = async (data: StudentRequest) => {
    if (editingStudent) {
      await studentApi.update(editingStudent.userId, data);
      setEditingStudent(null);
      loadStudents();
    }
  };

  const handleDelete = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await studentApi.delete(studentId);
      loadStudents();
    }
  };

  const handleBulkCreate = async (data: BulkStudentRequest): Promise<BulkStudentResult[]> => {
    const results = await studentApi.bulkCreate(data);
    loadStudents();
    return results;
  };

  return (
    <div className="space-y-6 text-neutral-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header phẳng, tiêu đề mỏng và cụm nút bấm đơn sắc */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-neutral-200 space-y-4 sm:space-y-0">
        <h1 className="text-xl font-medium tracking-tight">Student Management</h1>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button 
            variant="secondary" 
            onClick={() => setIsBulkAddModalOpen(true)}
            className="border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 rounded-none px-4 py-2 text-sm transition-colors"
          >
            Bulk Add
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="border border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 rounded-none px-4 py-2 text-sm transition-colors"
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Thanh tìm kiếm dọn sạch nền xám thừa */}
      <div className="max-w-md w-full pt-2">
        <Input 
          label=""
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Khu vực danh sách - Loại bỏ shadow, bo góc và nền xám của table header */}
      <div className="w-full overflow-x-auto pt-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-neutral-400">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No students found.</div>
        ) : (
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400">
                <th className="pb-3 pr-4 font-normal">Name</th>
                <th className="pb-3 px-4 font-normal">Phone</th>
                <th className="pb-3 pl-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredStudents.map((student) => (
                <tr key={student.userId} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4 pr-4 font-normal text-neutral-900">
                    {student.fullName}
                  </td>
                  <td className="py-4 px-4 text-neutral-500">
                    {student.phoneNumber}
                  </td>
                  <td className="py-4 pl-4 text-right text-xs space-x-4">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.userId)}
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

      {/* Giữ nguyên cấu trúc Modals để bảo toàn logic xử lý form */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
      >
        <StudentForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student"
      >
        {editingStudent && (
          <StudentForm
            initialData={{
              fullName: editingStudent.fullName,
              phoneNumber: editingStudent.phoneNumber,
              email: '', 
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingStudent(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        title="Bulk Add Students"
      >
        <BulkAddStudentForm
          onSubmit={handleBulkCreate}
          onCancel={() => setIsBulkAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default StudentsPage;