import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toPersianDate } from '../utils/dateHelper';

function ReportButton({ data, title, columns, fileName }) {
  const generatePDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // عنوان
    doc.setFontSize(20);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    // تاریخ امروز
    doc.setFontSize(10);
    doc.text(`تاریخ: ${toPersianDate(new Date())}`, pageWidth - 20, 30, { align: 'left' });

    // جدول
    const tableHeaders = columns.map(col => col.label);
    const tableRows = data.map(row => columns.map(col => col.accessor(row)));

    doc.autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: 40,
      styles: { font: 'vazir', fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
      didDrawPage: function (data) {
        // شماره صفحه
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`صفحه ${pageCount}`, pageWidth - 10, doc.internal.pageSize.getHeight() - 10);
      }
    });

    // ذخیره
    doc.save(`${fileName}-${toPersianDate(new Date()).replace(/\//g, '-')}.pdf`);
  };

  return (
    <button onClick={generatePDF} className="btn btn-success">
      📄 گزارش PDF
    </button>
  );
}

export default ReportButton;