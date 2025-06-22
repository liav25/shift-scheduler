import React, { useState, useEffect } from 'react';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { getAlgorithmInfo } from '../services/api';
import { AlgorithmInfo as AlgorithmInfoType } from '../types';

interface AlgorithmInfoProps {
  onClose: () => void;
}

const AlgorithmInfo: React.FC<AlgorithmInfoProps> = ({ onClose }) => {
  const [algorithmData, setAlgorithmData] = useState<AlgorithmInfoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlgorithmInfo = async () => {
      try {
        const data = await getAlgorithmInfo();
        setAlgorithmData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load algorithm information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlgorithmInfo();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Info className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Algorithm Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading algorithm information...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {algorithmData && (
            <div className="space-y-6">
              {/* Algorithm Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {algorithmData.algorithm}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {algorithmData.description}
                </p>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Key Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {algorithmData.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Constraints Handled</h4>
                <div className="space-y-2">
                  {algorithmData.constraints.map((constraint, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{constraint}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-md font-semibold text-blue-900 mb-3">How It Works</h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span>Creates rotating queues for each post with all guards</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span>For each time slot, selects the next available guard from the queue</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span>Checks guard availability and constraint violations</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">4</span>
                    <span>Assigns shifts and rotates guards to back of queue for fairness</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmInfo; 