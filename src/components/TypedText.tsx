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
  speed = 3,
  onComplete,
  className = "",
}: TypedTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDisplayedLength(0);
    setIsComplete(false);
    /* eslint-enable react-hooks/set-state-in-effect */

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

  const displayed = text.slice(0, displayedLength);
  const paragraphs = displayed.split("\n\n");

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="mb-3 leading-relaxed">
          {para}
          {i === paragraphs.length - 1 && !isComplete && (
            <span className="typing-cursor text-amber ml-0.5">▎</span>
          )}
        </p>
      ))}
    </div>
  );
}
