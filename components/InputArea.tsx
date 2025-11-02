
import React from 'react';

interface InputAreaProps {
  text: string;
  setText: (text: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ text, setText, onAnalyze, isLoading }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <label htmlFor="poem-input" className="block text-lg font-medium text-gray-300 mb-2">
        Enter Kannada Poem
      </label>
      <textarea
        id="poem-input"
        rows={6}
        className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-200 font-kannada text-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 resize-y"
        placeholder="ನಿಮ್ಮ ಪದ್ಯವನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="px-8 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200 ease-in-out flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
