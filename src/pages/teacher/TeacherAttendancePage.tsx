import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { attendanceApi } from '../../api/attendanceApi';
import type { AttendanceResponse, AttendanceMarkRequest, AttendanceStatus } from '../../types/attendance';

const TeacherAttendancePage = () => {
  const [scheduleId, setScheduleId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceResponse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary state for edits
  const [edits, setEdits] = useState<Record<number, AttendanceStatus>>({});

  const handleSearch = async () => {
    if (!scheduleId || !sessionDate) return;
    try {
      setIsLoading(true);
      const data = await attendanceApi.findAllBySchedule(Number(scheduleId), sessionDate);
      setRecords(data);
      setHasSearched(true);
      
      // Initialize edits state with existing status
      const initialEdits: Record<number, AttendanceStatus> = {};
      data.forEach(r => {
        initialEdits[r.studentUserId] = r.status;
      });
      setEdits(initialEdits);

    } catch (error) {
      console.error('Failed to load attendance', error);
      alert('Failed to load attendance. Check Schedule ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scheduleId || records.length === 0) return;
    try {
      setIsLoading(true);
      const request: AttendanceMarkRequest = {
        sessionDate,
        records: records.map(r => ({
          studentUserId: r.studentUserId,
          status: edits[r.studentUserId] || r.status,
        }))
      };
      
      await attendanceApi.markAttendance(Number(scheduleId), request);
      alert('Attendance saved successfully!');
      handleSearch(); // reload
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentUserId: number, status: AttendanceStatus) => {
    setEdits(prev => ({ ...prev, [studentUserId]: status }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mark Attendance (Workaround)</h1>
        <p className="text-gray-500 mt-1">
          Due to missing backend APIs (no way to list classes for a teacher), please manually enter a Schedule ID.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input 
              label="Schedule ID"
              type="number"
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              placeholder="e.g. 1"
            />
          </div>
          <div className="flex-1">
            <Input 
              label="Session Date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} isLoading={isLoading}>
            Load Students
          </Button>
        </div>
      </div>

      {hasSearched && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No attendance records found for this schedule on this date.</p>
              <p className="text-sm mt-2">Note: If no attendance has been marked yet, the backend currently returns an empty list, and there is no Teacher API to fetch the enrolled students directly.</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {record.studentFullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {record.studentPhoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${record.studentUserId}`}
                              checked={edits[record.studentUserId] === 'PRESENT'}
                              onChange={() => handleStatusChange(record.studentUserId, 'PRESENT')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Present</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${record.studentUserId}`}
                              checked={edits[record.studentUserId] === 'ABSENT'}
                              onChange={() => handleStatusChange(record.studentUserId, 'ABSENT')}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Absent</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`status-${record.studentUserId}`}
                              checked={edits[record.studentUserId] === 'EXCUSED'}
                              onChange={() => handleStatusChange(record.studentUserId, 'EXCUSED')}
                              className="text-yellow-600 focus:ring-yellow-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Excused</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <Button onClick={handleSave} isLoading={isLoading}>
                  Save Attendance
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;
