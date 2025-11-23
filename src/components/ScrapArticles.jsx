import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScrapArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/articles`);
      setArticles(response.data.articles || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch articles. Please ensure the backend is running and MongoDB is accessible.');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (article) => {
    // If the article is already open and has a summary, don't re-summarize immediately
    if (selectedArticle?._id === article._id && summarizing) {
        return;
    }
    
    // Open the modal if it's not already open for this article
    if (selectedArticle?._id !== article._id) {
        setSelectedArticle(article);
        setSummary('');
    }

    setSummarizing(true);
    setSummary('');

    try {
      // Prioritize content with HTML stripped, or full_text, falling back to existing summary
      let textToSummarize = '';
      if (article.full_text) {
          textToSummarize = article.full_text;
      } else if (article.content_html) {
          // Simple way to strip HTML tags for summarization API
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = article.content_html;
          textToSummarize = tempDiv.textContent || tempDiv.innerText || '';
      } else {
          textToSummarize = article.summary || '';
      }

      if (textToSummarize.length < 100) {
        setSummary('Article text is too short to generate a meaningful summary (min 100 characters required).');
        return;
      }

      // Check if the article text is excessively long (Gemini has high limits, but good practice)
      // Truncate to a reasonable size if needed before sending (e.g., first 10,000 characters)
      const truncatedText = textToSummarize.substring(0, 10000); 

      const response = await axios.post(`${API_BASE_URL}/articles/summarize`, {
        text: truncatedText
      });

      setSummary(response.data.summary);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to generate summary due to a network or API error.';
      setSummary(errorMessage);
      console.error('Error summarizing:', err.response?.data || err);
    } finally {
      setSummarizing(false);
    }
  };

  const handleReadMore = (article) => {
    setSelectedArticle(article);
    setSummary('');
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
    setSummary('');
    setSummarizing(false);
  };

  const filteredArticles = articles.filter(article => {
    const title = article.title?.toLowerCase() || '';
    const summaryText = article.summary?.toLowerCase() || '';
    const matchesSearch = title.includes(searchQuery.toLowerCase()) ||
                            summaryText.includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || article.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(articles.map(a => a.category).filter(Boolean))];

  // Helper to safely format dates
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // --- UI Components ---

  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading articles...</p>
      </div>
    </div>
  );

  const ErrorState = ({ error, retry }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <i className="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Articles</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={retry}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
        >
          <i className="fas fa-redo mr-2"></i>
          Try Again
        </button>
      </div>
    </div>
  );

  const ArticleModal = ({ article, onClose, onSummarize, isSummarizing, generatedSummary }) => {
    const isError = generatedSummary && (generatedSummary.startsWith('Failed') || generatedSummary.startsWith('Article text is too short') || generatedSummary.startsWith('Gemini API error'));
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {article.title}
              </h2>
              <div className="flex items-center text-sm text-gray-600 flex-wrap gap-4">
                <span>
                  <i className="fas fa-newspaper mr-2"></i>
                  {article.source_name}
                </span>
                {article.published_at && (
                  <span>
                    <i className="fas fa-calendar mr-2"></i>
                    {formatDate(article.published_at)}
                  </span>
                )}
                {article.word_count && (
                  <span>
                    <i className="fas fa-align-left mr-2"></i>
                    {article.word_count} words
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Summarize Button at Top */}
            <div className="mb-6">
              <button
                onClick={() => onSummarize(article)}
                disabled={isSummarizing}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className={`fas ${isSummarizing ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
                {isSummarizing ? 'Generating AI Summary...' : generatedSummary ? 'Regenerate AI Summary' : 'Generate AI Summary'}
              </button>
            </div>

            {/* Summary Section */}
            {isSummarizing && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                  <p className="text-gray-700 font-medium">AI is analyzing the article...</p>
                </div>
              </div>
            )}

            {generatedSummary && !isSummarizing && (
              <div className={`mb-6 p-6 border-l-4 rounded-lg shadow-md ${isError ? 'bg-red-50 border-red-600' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-600'}`}>
                <h3 className={`font-bold ${isError ? 'text-red-900' : 'text-blue-900'} mb-3 flex items-center text-lg`}>
                  <i className={`fas ${isError ? 'fa-exclamation-triangle' : 'fa-magic'} mr-2`}></i>
                  {isError ? 'Summary Error' : 'AI Generated Summary'}
                </h3>
                <p className={`leading-relaxed text-base ${isError ? 'text-red-800' : 'text-gray-800'}`}>{generatedSummary}</p>
              </div>
            )}

            {/* Full Content */}
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-file-alt mr-2"></i>
                Full Article
              </h3>
              {article.content_html ? (
                <div
                  dangerouslySetInnerHTML={{ __html: article.content_html }}
                  className="text-gray-700 leading-relaxed space-y-4"
                />
              ) : article.full_text ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap space-y-4">
                  {article.full_text}
                </div>
              ) : (
                <p className="text-gray-600 italic bg-gray-50 p-4 rounded-lg">
                  {article.summary || 'No content available'}
                </p>
              )}
            </div>

            {/* Action Buttons at Bottom */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
              {article.url && typeof article.url === 'string' && article.url.startsWith('http') && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-all duration-300 inline-flex items-center"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View Original Source
                </a>
              )}

              <button
                onClick={onClose}
                className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
              >
                <i className="fas fa-times mr-2"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} retry={fetchArticles} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Latest <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Articles</span>
          </h1>
          <p className="text-xl text-gray-600">
            Discover trending articles from top tech and business sources.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search titles or summaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition duration-150"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredArticles.length}</span> of <span className="font-semibold">{articles.length}</span> total articles
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
            <p className="text-xl text-gray-600">No articles match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <div
                key={article._id || index}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
              >
                {/* Article Card */}
                <div className="p-6 flex flex-col flex-grow">
                  {/* Category Badge */}
                  {article.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full mb-3 self-start">
                      {article.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.summary || 'No brief summary available.'}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center text-xs text-gray-500 mb-4 flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-100">
                    <span className="flex items-center">
                      <i className="fas fa-newspaper mr-1"></i>
                      {article.source_name || 'Unknown'}
                    </span>
                    {article.published_at && (
                      <span className="flex items-center">
                        <i className="fas fa-calendar mr-1"></i>
                        {formatDate(article.published_at)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => handleReadMore(article)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-sm transform hover:scale-[1.01] shadow-blue-500/50"
                    >
                      <i className="fas fa-book-open mr-2"></i>
                      Read More
                    </button>
                    <button
                      onClick={() => handleSummarize(article)}
                      className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 transition-all duration-300 text-sm transform hover:scale-[1.01]"
                    >
                      <i className="fas fa-compress-alt mr-2"></i>
                      AI Summarize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Modal */}
        {selectedArticle && (
          <ArticleModal
            article={selectedArticle}
            onClose={handleCloseModal}
            onSummarize={handleSummarize}
            isSummarizing={summarizing}
            generatedSummary={summary}
          />
        )}
      </div>
    </div>
  );
};

export default ScrapArticles;