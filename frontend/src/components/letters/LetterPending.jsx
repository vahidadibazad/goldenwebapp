// src/components/letters/LetterPending.jsx
import LetterList from './LetterList';

function LetterPending() {
  return (
    <LetterList
      type="pending"
      title="⏳ نامه‌های در انتظار تایید"
      showFilters={true}
      showActions={true}
      showBulkActions={false}
    />
  );
}

export default LetterPending;