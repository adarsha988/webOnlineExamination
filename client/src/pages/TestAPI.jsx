import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { instructorExamAPI } from '../api/instructorExams';

const TestAPI = () => {
  const { user } = useSelector((state) => state.auth);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    const testResults = {};

    try {
      console.log('🧪 Starting API Tests...');
      console.log('👤 Current User:', user);
      
      // Test 1: Check user authentication
      testResults.auth = {
        status: user ? 'authenticated' : 'not authenticated',
        userId: user?.id,
        email: user?.email,
        role: user?.role
      };

      if (user?.id) {
        // Test 2: Test analytics endpoint
        try {
          console.log('📊 Testing analytics endpoint...');
          const analytics = await instructorExamAPI.getDashboardStats(user.id);
          testResults.analytics = {
            status: 'success',
            data: analytics
          };
          console.log('✅ Analytics response:', analytics);
        } catch (error) {
          testResults.analytics = {
            status: 'error',
            error: error.message,
            details: error.response?.data
          };
          console.error('❌ Analytics error:', error);
        }

        // Test 3: Test exams endpoint
        try {
          console.log('📋 Testing exams endpoint...');
          const exams = await instructorExamAPI.getInstructorExams(user.id, { limit: 5 });
          testResults.exams = {
            status: 'success',
            data: exams,
            count: exams?.exams?.length || 0
          };
          console.log('✅ Exams response:', exams);
        } catch (error) {
          testResults.exams = {
            status: 'error',
            error: error.message,
            details: error.response?.data
          };
          console.error('❌ Exams error:', error);
        }
      }

      setResults(testResults);
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, [user]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Connectivity Test</h1>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run API Tests'}
      </button>

      <div className="space-y-6">
        {/* Authentication Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">🔐 Authentication</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(results.auth, null, 2)}
          </pre>
        </div>

        {/* Analytics Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">📊 Analytics API</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(results.analytics, null, 2)}
          </pre>
        </div>

        {/* Exams Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">📋 Exams API</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(results.exams, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Open browser developer tools (F12)</li>
          <li>Go to Console tab</li>
          <li>Look for emoji-prefixed logs (🧪, 📊, 📋, ✅, ❌)</li>
          <li>Check the JSON responses above</li>
          <li>Share any error messages you see</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAPI;
