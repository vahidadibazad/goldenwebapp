// src/components/letters/LetterOutbox.jsx
import LetterList from './LetterList';

function LetterOutbox() {
  return (
    <LetterList
      type="outbox"
      title="📤 صندوق خروجی"
      showFilters={true}
      showActions={true}
      showBulkActions={true}
    />
  );
}

export default LetterOutbox;