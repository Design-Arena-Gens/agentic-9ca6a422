'use client';

import { useState } from 'react';

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert video');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              YouTube to Podcast Converter
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Transform any YouTube video into an engaging podcast episode with AI
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="youtube-url" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                  YouTube Video URL
                </label>
                <input
                  id="youtube-url"
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !youtubeUrl}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting to Podcast...
                  </span>
                ) : (
                  'Convert to Podcast'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 font-medium">Error: {error}</p>
              </div>
            )}
          </div>

          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{result.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Duration: {result.duration}</span>
                  <span>•</span>
                  <span>Channel: {result.channel}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Podcast Episode Description</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.podcastDescription}</p>
                </div>
              </div>

              {result.keyTopics && result.keyTopics.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Key Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keyTopics.map((topic: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.transcript && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Enhanced Transcript</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {result.transcript}
                    </p>
                  </div>
                </div>
              )}

              {result.audioUrl && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Audio Player</h3>
                  <audio
                    controls
                    className="w-full"
                    src={result.audioUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <a
                    href={result.audioUrl}
                    download
                    className="mt-4 inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Download Podcast Episode
                  </a>
                </div>
              )}

              {result.showNotes && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Show Notes</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.showNotes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              Powered by AI • Converts YouTube videos into podcast-ready content with enhanced descriptions, show notes, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
