import { useEffect, useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TeacherForm } from './components/TeacherForm';
import { BulkAddTeacherForm } from './components/BulkAddTeacherForm';
import { teacherApi } from '../../api/teacherApi';
import type { TeacherResponse, TeacherRequest, BulkTeacherRequest, BulkTeacherResult } from '../../types/teacher';

export const TeachersPage = () => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await teacherApi.findAll();
      setTeachers(data);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      // In a real app, show a toast here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleCreate = async (data: TeacherRequest) => {
    await teacherApi.create(data);
    setIsAddModalOpen(false);
    loadTeachers();
  };

  const handleUpdate = async (data: TeacherRequest) => {
    if (editingTeacher) {
      await teacherApi.update(editingTeacher.userId, data);
      setEditingTeacher(null);
      loadTeachers();
    }
  };

  const handleDelete = async (teacherId: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      await teacherApi.delete(teacherId);
      loadTeachers();
    }
  };

  const handleBulkCreate = async (data: BulkTeacherRequest): Promise<BulkTeacherResult[]> => {
    const results = await teacherApi.bulkCreate(data);
    loadTeachers(); // Refresh list in background
    return results; // Return to form to display temporary passwords
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Management</h1>
        <div className="space-x-3">
          <Button variant="secondary" onClick={() => setIsBulkAddModalOpen(true)}>
            Bulk Add
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Teacher
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No teachers found. Click "Add Teacher" to create one.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{teacher.fullName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {teacher.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => setEditingTeacher(teacher)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.userId)}
                      className="text-red-600 hover:text-red-900"
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

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Teacher"
      >
        <TeacherForm
          onSubmit={handleCreate}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="Edit Teacher"
      >
        {editingTeacher && (
          <TeacherForm
            initialData={{
              fullName: editingTeacher.fullName,
              phoneNumber: editingTeacher.phoneNumber,
              email: '', // Backend doesn't return email in TeacherResponse. Might need a separate GET by ID if editing email is required.
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTeacher(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        title="Bulk Add Teachers"
      >
        <BulkAddTeacherForm
          onSubmit={handleBulkCreate}
          onCancel={() => setIsBulkAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default TeachersPage;
