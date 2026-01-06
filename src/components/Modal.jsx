import React, { useState, useRef, useEffect } from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, className = '' }) {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Center modal on open
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({
        x: (windowWidth - size.width) / 2,
        y: (windowHeight - size.height) / 2,
      });
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('modal-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setSize({
          width: Math.max(800, size.width + deltaX),
          height: Math.max(600, size.height + deltaY),
        });
        setDragStart({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position, size]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`modal ${className}`}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close" title="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-resize-handle" onMouseDown={handleResizeMouseDown}>
          ⋰
        </div>
      </div>
    </div>
  );
}

export default Modal;
