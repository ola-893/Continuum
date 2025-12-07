// TransactionPreviewModal.tsx
import React, { useState } from 'react';

interface TransactionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    details: Record<string, any>;
}

export const TransactionPreviewModal: React.FC<TransactionPreviewModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    details,
}) => {
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>{title}</h2>
                <div className="transaction-details">
                    {Object.entries(details).map(([key, value]) => (
                        <div className="detail-row" key={key}>
                            <span className="detail-key">{key}:</span>
                            <span className="detail-value">{JSON.stringify(value)}</span>
                        </div>
                    ))}
                </div>

                <div className="risk-warning" style={{marginTop: '20px', padding: '10px', background: 'rgba(255, 255, 0, 0.1)', borderRadius: '5px'}}>
                    <p style={{fontWeight: 'bold'}}>Warning: Blockchain transactions are irreversible.</p>
                    <p>Please double-check all details before confirming.</p>
                    <label style={{display: 'block', marginTop: '10px'}}>
                        <input type="checkbox" checked={isAcknowledged} onChange={() => setIsAcknowledged(!isAcknowledged)} />
                        I acknowledge the risks and want to proceed.
                    </label>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="btn-primary" disabled={!isAcknowledged}>Confirm</button>
                </div>
            </div>
        </div>
    );
};
