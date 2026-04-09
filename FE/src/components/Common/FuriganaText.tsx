import React from 'react';

interface FuriganaTextProps {
  kanji: string;
  furigana?: string;
  showFurigana?: boolean;
  className?: string;
  rtClassName?: string;
}

/**
 * Component hiển thị Kanji kèm Furigana bằng thẻ ruby.
 */
const FuriganaText: React.FC<FuriganaTextProps> = ({ 
  kanji, 
  furigana, 
  showFurigana = true,
  className = "",
  rtClassName = "text-[0.6em] text-[#886373] uppercase tracking-tighter"
}) => {
  if (!furigana || !showFurigana) {
    return <span className={className}>{kanji}</span>;
  }

  return (
    <ruby className={className}>
      {kanji}
      <rt className={rtClassName}>
        {furigana}
      </rt>
    </ruby>
  );
};

export default FuriganaText;
