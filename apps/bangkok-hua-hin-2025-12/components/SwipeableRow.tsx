import React, { useState, useRef, useEffect } from 'react';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    className?: string;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, className = '' }) => {
    const [offset, setOffset] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const startX = useRef<number | null>(null);
    const currentOffset = useRef(0);
    const DELETE_THRESHOLD = -80; // Pixels to reveal delete
    const MAX_OFFSET = -100;

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        currentOffset.current = offset;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null) return;
        const diff = e.touches[0].clientX - startX.current;
        const newOffset = Math.min(0, Math.max(MAX_OFFSET, currentOffset.current + diff));
        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        if (offset < DELETE_THRESHOLD) {
            setOffset(MAX_OFFSET);
        } else {
            setOffset(0);
        }
        startX.current = null;
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        // Wait for animation
        setTimeout(() => {
            onDelete();
            // Reset state in case component is reused/not unmounted immediately
            setOffset(0);
            setIsDeleting(false);
        }, 300);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div
                className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white w-24 transition-transform z-0"
                style={{ transform: `translateX(${offset < -20 ? 0 : 100}%)` }}
                onClick={handleDeleteClick}
            >
                <span className="material-symbols-outlined">delete</span>
            </div>
            <div
                className={`relative bg-inherit transition-transform duration-200 ease-out z-10 ${isDeleting ? '-translate-x-full opacity-0' : ''}`}
                style={{ transform: isDeleting ? undefined : `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeableRow;
