import { useState, useRef, useEffect } from 'react';
import EmojiPickerReact from 'emoji-picker-react';

export default function EmojiPicker({ onEmojiSelect, children }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <div onClick={() => setShowPicker(!showPicker)} className="cursor-pointer">
        {children || <span className="text-xl">😀</span>}
      </div>
      {showPicker && (
        <div ref={pickerRef} className="absolute bottom-10 left-0 z-50">
          <EmojiPickerReact onEmojiClick={(emoji) => {
            onEmojiSelect(emoji.emoji);
            setShowPicker(false);
          }} />
        </div>
      )}
    </div>
  );
}