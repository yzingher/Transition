"use client";

import { useState, useEffect, useRef } from "react";

interface TypedTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function TypedText({
  text,
  speed = 8,
  onComplete,
  className = "",
}: TypedTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);

    intervalRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsComplete(true);
          onCompleteRef.current?.();
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  const handleClick = () => {
    if (!isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedLength(text.length);
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  };

  // Split text into paragraphs and render
  const displayed = text.slice(0, displayedLength);
  const paragraphs = displayed.split("\n\n");

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="mb-3 leading-relaxed">
          {para}
          {i === paragraphs.length - 1 && !isComplete && (
            <span className="typing-cursor text-amber-500 ml-0.5">▎</span>
          )}
        </p>
      ))}
    </div>
  );
}
