import React from 'react';
import { Toast, ToastProps } from './Toast';

interface ToastContainerProps {
    toasts: Omit<ToastProps, 'onClose'>[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                pointerEvents: 'none',
            }}
        >
            {toasts.map((toast) => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
