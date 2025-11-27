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
    if (selectedArticle?._id === article._id && summarizing) return;

    if (selectedArticle?._id !== article._id) {
      setSelectedArticle(article);
      setSummary('');
    }

    setSummarizing(true);
    setSummary('');

    try {
      let textToSummarize = '';
      if (article.full_text) textToSummarize = article.full_text;
      else if (article.content_html) {
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

  const handleGenerateLinkedInPost = async (article) => {
    try {
      let textToUse = '';

      if (article.full_text) textToUse = article.full_text;
      else if (article.content_html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.content_html;
        textToUse = tempDiv.textContent || tempDiv.innerText || '';
      } else textToUse = article.summary || '';

      if (textToUse.length < 100) {
        alert("Not enough content to generate a LinkedIn post.");
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/articles/generate-post`, {
        text: textToUse.substring(0, 5000)
      });

      const postDraft = response.data.post;

      localStorage.setItem("generatedPostDraft", postDraft);

      alert("LinkedIn-style post created! Open Dashboard to edit it.");

    } catch (err) {
      console.error("LinkedIn post error:", err.response?.data || err);
      alert("Failed to generate LinkedIn post.");
    }
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

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
    const isError =
      generatedSummary &&
      (generatedSummary.startsWith('Failed') ||
        generatedSummary.startsWith('Article text is too short') ||
        generatedSummary.startsWith('Gemini API error'));

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

          {/* Modal Body */}
          <div className="p-6">

            {/* Summary Button */}
            <div className="mb-6">
              <button
                onClick={() => onSummarize(article)}
                disabled={isSummarizing}
                className="
                  w-full md:w-auto py-3 px-6 rounded-xl font-medium 
                  bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                  shadow-sm hover:shadow-lg 
                  transition-all duration-200 disabled:opacity-50
                "
              >
                <i className={`fas ${isSummarizing ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
                {isSummarizing ? 'Generating Summary...' : 'Generate Summary'}
              </button>
            </div>

            {/* Summary Content */}
            {generatedSummary && !isSummarizing && (
              <div
                className={`mb-6 p-6 border-l-4 rounded-lg shadow-md ${
                  isError
                    ? 'bg-red-50 border-red-600'
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-600'
                }`}
              >
                <h3
                  className={`font-bold mb-3 flex items-center text-lg ${
                    isError ? 'text-red-900' : 'text-blue-900'
                  }`}
                >
                  <i className={`fas ${isError ? 'fa-exclamation-triangle' : 'fa-magic'} mr-2`}></i>
                  {isError ? 'Summary Error' : 'AI Generated Summary'}
                </h3>

                <p className={`${isError ? 'text-red-800' : 'text-gray-800'} leading-relaxed`}>
                  {generatedSummary}
                </p>
              </div>
            )}

            {/* Full Article */}
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-file-alt mr-2"></i> Full Article
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

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4">

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-2 py-3 px-6 rounded-xl 
                    bg-white border border-blue-600 text-blue-600
                    hover:bg-blue-50 transition-all duration-200 shadow-sm
                  "
                >
                  <i className="fas fa-external-link-alt"></i> View Source
                </a>
              )}

              <button
                onClick={onClose}
                className="
                  py-3 px-6 rounded-xl bg-gray-100 text-gray-700 
                  hover:bg-gray-200 transition-all duration-200
                "
              >
                <i className="fas fa-times mr-2"></i> Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={fetchArticles} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Articles
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Discover trending articles from top tech and business sources.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">

            {/* Search */}
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search titles or summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  transition
                "
              />
            </div>

            {/* Category */}
            <div className="md:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  transition
                "
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredArticles.length}</span> of{' '}
            <span className="font-semibold">{articles.length}</span> articles
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <div
              key={article._id || index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col"
            >
              {article.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full mb-3">
                  {article.category}
                </span>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {article.summary || 'No summary available.'}
              </p>

              <div className="flex items-center text-xs text-gray-500 mb-4 gap-4 border-t pt-2">
                <span className="flex items-center">
                  <i className="fas fa-newspaper mr-1"></i>
                  {article.source_name}
                </span>

                {article.published_at && (
                  <span className="flex items-center">
                    <i className="fas fa-calendar mr-1"></i>
                    {formatDate(article.published_at)}
                  </span>
                )}
              </div>

              {/* Improved Buttons */}
              <div className="flex items-center gap-3 mt-auto">

                {/* Read More (Light Purple Gradient) */}
                <button
                  onClick={() => handleReadMore(article)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 whitespace-nowrap"
                >
                  <i className="fas fa-book-open text-white text-sm"></i>
                  Read More
                </button>

                {/* AI Summary (Outline Blue) */}
                <button
                  onClick={() => handleSummarize(article)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-600 bg-white border border-blue-300 hover:bg-blue-50 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 whitespace-nowrap"
                >
                  <i className="fas fa-bolt text-blue-600 text-sm"></i>
                  AI Summary
                </button>

                {/* LinkedIn Post (Compact Width) */}
                <button
                  onClick={() => handleGenerateLinkedInPost(article)}
                  className="inline-flex items-center gap-1 px-2 py-0 rounded-md text-sm font-medium bg-[#0A66C2] text-white hover:bg-[#0654a8] shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
                >
                  <i className="fab fa-linkedin text-white text-base"></i>
                  Generate Draft
                </button>


              </div>


            </div>
          ))}
        </div>

        {/* Modal */}
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
