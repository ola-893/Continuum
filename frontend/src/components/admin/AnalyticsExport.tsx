/**
 * Analytics Export Component
 * 
 * Provides UI for exporting analytics data including:
 * - Gas cost records (CSV)
 * - Transaction metrics (JSON)
 * - System metrics (JSON)
 */

import React, { useState } from 'react';
import { Download, FileText, Database, Calendar } from 'lucide-react';
import {
  downloadGasCostRecordsCSV,
  downloadMetricsJSON,
  getGasCostRecords,
  getSummaryStatistics,
  getGasCostRecordsByTimeRange,
} from '../../services/analyticsTrackingService';
import { getSystemMetrics } from '../../services/systemMetricsService';

export const AnalyticsExport: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all');

  const handleExportGasCosts = async () => {
    setExporting(true);
    setExportStatus('Exporting gas cost records...');

    try {
      let records = getGasCostRecords();

      // Filter by time range if not 'all'
      if (timeRange !== 'all') {
        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
          case '24h':
            startTime = now - 24 * 60 * 60 * 1000;
            break;
          case '7d':
            startTime = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case '30d':
            startTime = now - 30 * 24 * 60 * 60 * 1000;
            break;
        }

        records = getGasCostRecordsByTimeRange(startTime, now);
      }

      downloadGasCostRecordsCSV(records);
      setExportStatus(`Successfully exported ${records.length} gas cost records`);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleExportMetrics = async () => {
    setExporting(true);
    setExportStatus('Exporting transaction metrics...');

    try {
      downloadMetricsJSON();
      setExportStatus('Successfully exported transaction metrics');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleExportSystemMetrics = async () => {
    setExporting(true);
    setExportStatus('Exporting system metrics...');

    try {
      const metrics = await getSystemMetrics();
      const summary = getSummaryStatistics();

      const data = {
        exportDate: new Date().toISOString(),
        systemMetrics: metrics,
        transactionSummary: summary,
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `system_metrics_${Date.now()}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('Successfully exported system metrics');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    setExportStatus('Exporting all analytics data...');

    try {
      // Export gas costs
      let records = getGasCostRecords();
      if (timeRange !== 'all') {
        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
          case '24h':
            startTime = now - 24 * 60 * 60 * 1000;
            break;
          case '7d':
            startTime = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case '30d':
            startTime = now - 30 * 24 * 60 * 60 * 1000;
            break;
        }

        records = getGasCostRecordsByTimeRange(startTime, now);
      }

      downloadGasCostRecordsCSV(records);

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));

      // Export metrics
      downloadMetricsJSON();

      await new Promise(resolve => setTimeout(resolve, 500));

      // Export system metrics
      const metrics = await getSystemMetrics();
      const summary = getSummaryStatistics();

      const data = {
        exportDate: new Date().toISOString(),
        systemMetrics: metrics,
        transactionSummary: summary,
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `system_metrics_${Date.now()}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('Successfully exported all analytics data');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Export Analytics Data</h3>
      
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
        Export historical analytics data for analysis and reporting
      </p>

      {/* Time Range Selector */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
          <Calendar size={16} style={{ display: 'inline', marginRight: 'var(--spacing-xs)' }} />
          Time Range
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-md)',
          }}
        >
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button
          onClick={handleExportGasCosts}
          disabled={exporting}
          style={{
            padding: 'var(--spacing-md)',
            background: exporting ? 'var(--color-bg-secondary)' : 'var(--gradient-primary)',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            color: 'white',
            cursor: exporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-xs)',
            fontWeight: 600,
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <FileText size={18} />
          Export Gas Costs (CSV)
        </button>

        <button
          onClick={handleExportMetrics}
          disabled={exporting}
          style={{
            padding: 'var(--spacing-md)',
            background: exporting ? 'var(--color-bg-secondary)' : 'var(--gradient-secondary)',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            color: 'white',
            cursor: exporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-xs)',
            fontWeight: 600,
            opacity: exporting ? 0.6 : 1,
          }}
        >
          <Database size={18} />
          Export Metrics (JSON)
        </button>
      </div>

      <button
        onClick={handleExportSystemMetrics}
        disabled={exporting}
        style={{
          width: '100%',
          padding: 'var(--spacing-md)',
          background: exporting ? 'var(--color-bg-secondary)' : 'linear-gradient(135deg, var(--color-success) 0%, var(--color-primary) 100%)',
          border: 'none',
          borderRadius: 'var(--border-radius-md)',
          color: 'white',
          cursor: exporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
          fontWeight: 600,
          opacity: exporting ? 0.6 : 1,
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <Download size={18} />
        Export System Metrics (JSON)
      </button>

      <button
        onClick={handleExportAll}
        disabled={exporting}
        style={{
          width: '100%',
          padding: 'var(--spacing-md)',
          background: exporting ? 'var(--color-bg-secondary)' : 'linear-gradient(135deg, var(--color-warning) 0%, var(--color-secondary) 100%)',
          border: 'none',
          borderRadius: 'var(--border-radius-md)',
          color: 'white',
          cursor: exporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
          fontWeight: 600,
          opacity: exporting ? 0.6 : 1,
        }}
      >
        <Download size={18} />
        Export All Data
      </button>

      {/* Status Message */}
      {exportStatus && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius-md)',
            background: exportStatus.includes('failed')
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${exportStatus.includes('failed') ? 'var(--color-error)' : 'var(--color-success)'}`,
            color: exportStatus.includes('failed') ? 'var(--color-error)' : 'var(--color-success)',
            textAlign: 'center',
          }}
        >
          {exportStatus}
        </div>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          <strong>Note:</strong> Gas cost records are stored locally in your browser. 
          Export data regularly for backup and analysis purposes.
        </p>
      </div>
    </div>
  );
};
