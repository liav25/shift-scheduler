import React, { useState } from 'react';
import { Clock, Users, Shield, Calendar, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import SchedulerForm from './components/SchedulerForm';
import ScheduleTable from './components/ScheduleTable';
import AlgorithmInfo from './components/AlgorithmInfo';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';
import Card from './layout/Card';

import { useScheduleGeneration } from './hooks/useScheduleGeneration';
import { useConnection } from './hooks/useConnection';

function App() {
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);
  const { schedule, isLoading, handleGenerateSchedule } = useScheduleGeneration();
  const { isConnected } = useConnection();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-900">Shift Scheduler</h1>
              </div>
              <p className="text-lg text-gray-600 mb-4">
                Generate fair and efficient guard schedules with our intelligent queue-based algorithm
              </p>
              
              {/* Connection Status and Info Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <ConnectionStatus isConnected={isConnected} />
                <button
                  onClick={() => setShowAlgorithmInfo(true)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-white rounded-lg transition-colors"
                >
                  <Info className="h-4 w-4 mr-1" />
                  Algorithm Info
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form Section - Takes up 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <Card
                  title="Schedule Configuration"
                  icon={<Calendar className="h-6 w-6 text-blue-600" />}
                >
                  <SchedulerForm 
                    onSubmit={handleGenerateSchedule} 
                    isLoading={isLoading}
                    disabled={!isConnected}
                  />
                </Card>
              </div>

              {/* Results Section - Takes up 3 columns */}
              <div className="lg:col-span-3 space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 text-green-600 mr-2" />
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Generated Schedule
                      </h2>
                    </div>
                    
                    {/* Schedule Status Indicator */}
                    {schedule && (
                      <div className="flex items-center">
                        {schedule.success ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle2 className="h-5 w-5 mr-1" />
                            <span className="font-medium">Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-5 w-5 mr-1" />
                            <span className="font-medium">Failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <div className="space-y-2">
                          <p className="text-xl font-medium text-gray-700">
                            Generating Schedule...
                          </p>
                          <p className="text-sm text-gray-500">
                            This may take a few seconds for complex schedules
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoading && !schedule && (
                    <div className="text-center py-20">
                      <Users className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                      <h3 className="text-xl font-medium text-gray-700 mb-2">
                        Ready to Generate Schedule
                      </h3>
                      <p className="text-gray-500">
                        Fill out the configuration form and click "Generate Schedule" to see results
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {!isLoading && schedule && !schedule.success && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800 mb-2">
                            Schedule Generation Failed
                          </h3>
                          <p className="text-red-700 mb-4">{schedule.error}</p>
                          <div className="text-sm text-red-600">
                            <p className="font-medium mb-1">Common solutions:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Add more guards to the schedule</li>
                              <li>Reduce unavailability periods</li>

                              <li>Adjust shift lengths or schedule duration</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success State - Schedule Table */}
                  {!isLoading && schedule && schedule.success && schedule.assignments && (
                    <div className="space-y-6">
                      {/* Schedule Metadata */}
                      {schedule.metadata && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                            <h4 className="font-medium text-green-800">Schedule Generated Successfully</h4>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-green-600">Total Shifts:</span>
                              <span className="ml-2 font-semibold text-green-800">
                                {schedule.metadata.total_assignments}
                              </span>
                            </div>
                            <div>
                              <span className="text-green-600">Guards Used:</span>
                              <span className="ml-2 font-semibold text-green-800">
                                {schedule.metadata.unique_guards}
                              </span>
                            </div>
                            <div>
                              <span className="text-green-600">Posts Covered:</span>
                              <span className="ml-2 font-semibold text-green-800">
                                {schedule.metadata.unique_posts}
                              </span>
                            </div>
                            <div>
                              <span className="text-green-600">Duration:</span>
                              <span className="ml-2 font-semibold text-green-800">
                                {Math.round(schedule.metadata.schedule_duration_hours)}h
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Schedule Table */}
                      <ScheduleTable assignments={schedule.assignments} />
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Info Modal */}
        {showAlgorithmInfo && (
          <AlgorithmInfo onClose={() => setShowAlgorithmInfo(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;