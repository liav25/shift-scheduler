import React from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Calendar, Sun, Moon } from 'lucide-react';
import { ShiftAssignment } from '../types';

interface ScheduleTableProps {
  assignments: ShiftAssignment[];
}

interface ScheduleRow {
  date: string;
  dateKey: string;
  shiftTime: string;
  isNight: boolean;
  posts: Record<string, string>;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ assignments }) => {
  // Group assignments by date and shift time
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const startTime = parseISO(assignment.shift_start_time);
    const endTime = parseISO(assignment.shift_end_time);
    const dateKey = format(startTime, 'yyyy-MM-dd');
    const shiftTime = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
    const key = `${dateKey}-${shiftTime}`;

    if (!acc[key]) {
      // Determine if this is a night shift (simple heuristic)
      const startHour = startTime.getHours();
      const isNight = startHour >= 22 || startHour < 6; // 10 PM to 6 AM

      acc[key] = {
        date: format(startTime, 'EEE, MMM dd, yyyy'), // Include day name
        dateKey,
        shiftTime,
        isNight,
        posts: {},
      };
    }

    acc[key].posts[assignment.post_id] = assignment.guard_id;
    return acc;
  }, {} as Record<string, ScheduleRow>);

  // Get all unique posts for table headers
  const allPosts = Array.from(
    new Set(assignments.map(assignment => assignment.post_id))
  ).sort();

  // Convert to array and sort by date and time
  const rows = Object.values(groupedAssignments).sort((a, b) => {
    const dateA = new Date(a.dateKey).getTime();
    const dateB = new Date(b.dateKey).getTime();
    
    if (dateA !== dateB) return dateA - dateB;
    
    return a.shiftTime.localeCompare(b.shiftTime);
  });

  // Calculate rowspan for date cells
  const dateRowSpans: Record<string, number> = {};
  const dateFirstOccurrence: Record<string, number> = {};
  
  rows.forEach((row, index) => {
    if (!dateRowSpans[row.dateKey]) {
      dateRowSpans[row.dateKey] = 0;
      dateFirstOccurrence[row.dateKey] = index;
    }
    dateRowSpans[row.dateKey]++;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Shift Time', ...allPosts];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        `"${row.date}"`,
        `"${row.shiftTime}"`,
        ...allPosts.map(post => `"${row.posts[post] || 'Unassigned'}"`)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `schedule_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-500">No assignments to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift Time
              </th>
              {allPosts.map(post => (
                <th
                  key={post}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {post}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 transition-colors`}
              >
                {/* Date cell with rowspan */}
                {dateFirstOccurrence[row.dateKey] === index && (
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-10 bg-inherit border-r border-gray-200"
                    rowSpan={dateRowSpans[row.dateKey]}
                  >
                    {row.date}
                  </td>
                )}
                {/* Shift Time with icon */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  <div className="flex items-center space-x-2">
                    {row.isNight ? (
                      <Moon className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Sun className="h-4 w-4 text-yellow-600" />
                    )}
                    <span>{row.shiftTime}</span>
                  </div>
                </td>
                {/* Post assignments */}
                {allPosts.map(post => (
                  <td
                    key={post}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row.posts[post] ? (
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                        {row.posts[post]}
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                        Unassigned
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Shifts</p>
              <p className="text-2xl font-bold text-blue-900">{assignments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Guards</p>
              <p className="text-2xl font-bold text-green-900">
                {new Set(assignments.map(a => a.guard_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Posts</p>
              <p className="text-2xl font-bold text-purple-900">{allPosts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Time Slots</p>
              <p className="text-2xl font-bold text-orange-900">{rows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guard Workload Distribution */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Guard Workload Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(new Set(assignments.map(a => a.guard_id))).map(guard => {
            const guardShifts = assignments.filter(a => a.guard_id === guard);
            const nightShifts = guardShifts.filter(a => {
              const hour = parseISO(a.shift_start_time).getHours();
              return hour >= 22 || hour < 6;
            });
            
            return (
              <div key={guard} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{guard}</h5>
                  <span className="text-sm text-gray-500">{guardShifts.length} shifts</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day shifts:</span>
                    <span className="font-medium">{guardShifts.length - nightShifts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Night shifts:</span>
                    <span className="font-medium">{nightShifts.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleTable; 