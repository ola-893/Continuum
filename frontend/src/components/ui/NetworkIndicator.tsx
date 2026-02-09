/**
 * Network Indicator Component
 * 
 * Displays the current network status, warnings for network mismatches,
 * and provides quick access to network switching.
 */

import React from 'react';
import { useNetworkManager } from '../../hooks/useNetworkManager';
import { getNetworkInfo } from '../../services/networkService';

interface NetworkIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ 
  showDetails = false,
  className = '' 
}) => {
  const {
    currentNetwork,
    connectedNetwork,
    isCorrectNetwork,
    needsSwitch,
    mismatchMessage,
    configWarnings,
    isFullyConfigured,
  } = useNetworkManager();

  const networkInfo = getNetworkInfo(currentNetwork);

  // Determine indicator color
  const getIndicatorColor = () => {
    if (!isFullyConfigured) return 'bg-yellow-500';
    if (needsSwitch) return 'bg-red-500';
    if (isCorrectNetwork) return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Determine status text
  const getStatusText = () => {
    if (!isFullyConfigured) return 'Configuration Incomplete';
    if (needsSwitch) return 'Wrong Network';
    if (isCorrectNetwork) return 'Connected';
    return 'Not Connected';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network indicator dot */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getIndicatorColor()} animate-pulse`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {networkInfo.displayName}
        </span>
        {networkInfo.isTestnet && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            Testnet
          </span>
        )}
      </div>

      {/* Status badge */}
      {showDetails && (
        <span className={`text-xs px-2 py-1 rounded ${
          isCorrectNetwork 
            ? 'bg-green-100 text-green-700' 
            : needsSwitch
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {getStatusText()}
        </span>
      )}

      {/* Warning icon for issues */}
      {(needsSwitch || !isFullyConfigured) && (
        <svg 
          className="w-4 h-4 text-yellow-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      )}
    </div>
  );
};

interface NetworkWarningBannerProps {
  onDismiss?: () => void;
}

export const NetworkWarningBanner: React.FC<NetworkWarningBannerProps> = ({ onDismiss }) => {
  const {
    needsSwitch,
    mismatchMessage,
    configWarnings,
    isFullyConfigured,
    currentNetwork,
    getSwitchInstructions,
  } = useNetworkManager();

  const [showInstructions, setShowInstructions] = React.useState(false);

  // Don't show if everything is fine
  if (!needsSwitch && isFullyConfigured && configWarnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-yellow-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Network Configuration Warning
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            {/* Network mismatch warning */}
            {needsSwitch && mismatchMessage && (
              <div className="mb-2">
                <p className="font-medium">{mismatchMessage}</p>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="mt-1 text-yellow-800 underline hover:text-yellow-900"
                >
                  {showInstructions ? 'Hide' : 'Show'} instructions
                </button>
                {showInstructions && (
                  <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs whitespace-pre-wrap">
                    {getSwitchInstructions(currentNetwork)}
                  </pre>
                )}
              </div>
            )}

            {/* Configuration warnings */}
            {configWarnings.length > 0 && (
              <div>
                <p className="font-medium mb-1">Configuration Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  {configWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-yellow-400 hover:text-yellow-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
