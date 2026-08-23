// frontend/src/components/letters/LetterInbox.jsx
import LetterList from './LetterList';

function LetterInbox() {
  return (
    <LetterList
      type="inbox"
      title="📥 صندوق ورودی"
      showFilters={true}
      showActions={true}
      showBulkActions={true}
    />
  );
}

export default LetterInbox;