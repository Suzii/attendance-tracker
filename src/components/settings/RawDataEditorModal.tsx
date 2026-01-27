import { useState, useEffect } from 'react';
import { STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../../constants';

interface RawDataEditorModalProps {
  onClose: () => void;
  onDataSaved: () => void;
}

type DataType = 'attendance' | 'settings';

export function RawDataEditorModal({ onClose, onDataSaved }: RawDataEditorModalProps) {
  const [dataType, setDataType] = useState<DataType>('attendance');
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load data when switching tabs
  useEffect(() => {
    loadData();
  }, [dataType]);

  const getStorageKey = () => {
    return dataType === 'attendance' ? STORAGE_KEY : SETTINGS_STORAGE_KEY;
  };

  const loadData = () => {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setJsonValue(JSON.stringify(parsed, null, 2));
      } catch {
        setJsonValue(raw);
      }
    } else {
      setJsonValue('{}');
    }
    setError(null);
    setIsDirty(false);
  };

  const handleChange = (value: string) => {
    setJsonValue(value);
    setIsDirty(true);

    // Validate JSON on change
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  };

  const handleSave = () => {
    try {
      // Validate JSON
      const parsed = JSON.parse(jsonValue);

      // Save to localStorage
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(parsed));

      setError(null);
      setIsDirty(false);
      onDataSaved();
      onClose();
    } catch (e) {
      setError(`Cannot save: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
    }
  };

  const handleReset = () => {
    loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Raw Data Editor
              </h2>
              <p className="text-sm text-gray-500">
                Edit localStorage data directly. Be careful!
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setDataType('attendance')}
              className={`
                pb-3 text-sm font-medium border-b-2 transition-colors
                ${dataType === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              Attendance Data
            </button>
            <button
              onClick={() => setDataType('settings')}
              className={`
                pb-3 text-sm font-medium border-b-2 transition-colors
                ${dataType === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col min-h-0">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-mono">{error}</p>
            </div>
          )}

          <textarea
            value={jsonValue}
            onChange={(e) => handleChange(e.target.value)}
            className={`
              flex-1 w-full p-4 font-mono text-sm border rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}
            `}
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {isDirty ? (
                <span className="text-amber-600">Unsaved changes</span>
              ) : (
                <span>No changes</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={!isDirty}
                className={`
                  px-4 py-2 text-sm rounded-lg transition-colors
                  ${isDirty
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!error || !isDirty}
                className={`
                  px-4 py-2 text-sm rounded-lg transition-colors
                  ${error || !isDirty
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }
                `}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
