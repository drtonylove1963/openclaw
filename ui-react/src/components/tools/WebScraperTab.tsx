import { useState } from 'react';
import { Globe, Loader2, Play, FileText } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { GlassCard, NeuralButton, NeuralEmptyState } from '../shared';
import ReactMarkdown from 'react-markdown';

export function WebScraperTab() {
  const {
    scrapeUrl,
    scrapeOptions,
    scrapeResults,
    scrapeLoading,
    scrapeError,
    setScrapeUrl,
    setScrapeOptions,
    startScrape,
  } = useToolsStore();

  const [localUrl, setLocalUrl] = useState(scrapeUrl);

  const handleStartScrape = async () => {
    setScrapeUrl(localUrl);
    setScrapeOptions({ url: localUrl });
    await startScrape();
  };

  const handleModeChange = (mode: 'scrape' | 'crawl') => {
    setScrapeOptions({ mode });
  };

  const handleFormatChange = (format: 'markdown' | 'text' | 'html') => {
    setScrapeOptions({ format });
  };

  const handleMaxDepthChange = (depth: number) => {
    setScrapeOptions({ maxDepth: depth });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      {/* Configuration Panel */}
      <GlassCard variant="bordered" style={{ padding: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* URL Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#f0f0f5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              URL
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f0f0f5',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 200ms',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(0, 212, 255, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && localUrl.trim()) {
                    handleStartScrape();
                  }
                }}
              />
              <button
                onClick={handleStartScrape}
                disabled={!localUrl.trim() || scrapeLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.2)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  color: '#00d4ff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: scrapeLoading || !localUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: scrapeLoading || !localUrl.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  if (!scrapeLoading && localUrl.trim()) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0, 212, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0, 212, 255, 0.2)';
                }}
              >
                {scrapeLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Mode Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Mode
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['scrape', 'crawl'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: scrapeOptions.mode === mode
                        ? 'rgba(0, 212, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: scrapeOptions.mode === mode
                        ? '1px solid rgba(0, 212, 255, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      color: scrapeOptions.mode === mode ? '#00d4ff' : '#6b7280',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f0f0f5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Format
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['markdown', 'text', 'html'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleFormatChange(format)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: scrapeOptions.format === format
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: scrapeOptions.format === format
                        ? '1px solid rgba(139, 92, 246, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      color: scrapeOptions.format === format ? '#8b5cf6' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      textTransform: 'uppercase',
                    }}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Depth (only for crawl mode) */}
            {scrapeOptions.mode === 'crawl' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#f0f0f5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Max Depth
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={scrapeOptions.maxDepth || 3}
                  onChange={(e) => handleMaxDepthChange(parseInt(e.target.value))}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f0f0f5',
                    fontSize: '14px',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Error Display */}
      {scrapeError && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileText size={20} />
          <span>{scrapeError}</span>
        </div>
      )}

      {/* Results Display */}
      <div
        className="ni-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {!scrapeResults && !scrapeLoading && (
          <NeuralEmptyState
            icon={<Globe size={32} />}
            title="No scraping results yet"
            description="Enter a URL above and click Start to scrape web content."
          />
        )}

        {scrapeLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <Loader2 size={48} style={{ color: '#00d4ff', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {scrapeOptions.mode === 'crawl' ? 'Crawling website...' : 'Scraping page...'}
              </p>
            </div>
          </div>
        )}

        {scrapeResults && !scrapeLoading && (
          <GlassCard variant="bordered" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Metadata */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Globe size={18} style={{ color: '#00d4ff' }} />
                <span style={{ fontSize: '13px', color: '#6b7280', wordBreak: 'break-all' }}>
                  {scrapeResults.url}
                </span>
              </div>

              {/* Content */}
              <div
                style={{
                  fontSize: '14px',
                  color: '#f0f0f5',
                  lineHeight: 1.7,
                }}
              >
                {scrapeOptions.format === 'markdown' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{scrapeResults.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: scrapeOptions.format === 'html' ? 'monospace' : 'inherit',
                      fontSize: scrapeOptions.format === 'html' ? '12px' : '14px',
                      margin: 0,
                    }}
                  >
                    {scrapeResults.content}
                  </pre>
                )}
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .markdown-content h1,
          .markdown-content h2,
          .markdown-content h3,
          .markdown-content h4,
          .markdown-content h5,
          .markdown-content h6 {
            color: #f0f0f5;
            margin-top: 24px;
            margin-bottom: 12px;
            font-weight: 600;
          }

          .markdown-content h1 { font-size: 28px; }
          .markdown-content h2 { font-size: 24px; }
          .markdown-content h3 { font-size: 20px; }
          .markdown-content h4 { font-size: 18px; }
          .markdown-content h5 { font-size: 16px; }
          .markdown-content h6 { font-size: 14px; }

          .markdown-content p {
            margin-bottom: 16px;
            color: #f0f0f5;
          }

          .markdown-content a {
            color: #00d4ff;
            text-decoration: none;
          }

          .markdown-content a:hover {
            text-decoration: underline;
          }

          .markdown-content code {
            background: rgba(255, 255, 255, 0.06);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
          }

          .markdown-content pre {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 16px;
            overflow-x: auto;
            margin-bottom: 16px;
          }

          .markdown-content pre code {
            background: none;
            padding: 0;
          }

          .markdown-content ul,
          .markdown-content ol {
            margin-bottom: 16px;
            padding-left: 24px;
          }

          .markdown-content li {
            margin-bottom: 8px;
            color: #f0f0f5;
          }
        `}
      </style>
    </div>
  );
}
