import * as XLSX from 'xlsx';
import { toPersianDate } from '../utils/dateHelper';
import { toPersianNumber } from '../utils/numberHelper';

function ExcelReportButton({ data, title, columns, fileName }) {
  const generateExcel = () => {
    // تبدیل داده به فرمت مناسب برای Excel
    const excelData = data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        const value = col.accessor(row);
        // تبدیل تاریخ‌ها به فرمت شمسی
        if (typeof value === 'string' && value.includes('/')) {
          newRow[col.label] = value;
        } else if (typeof value === 'number') {
          newRow[col.label] = value;
        } else {
          newRow[col.label] = value || '-';
        }
      });
      return newRow;
    });

    // ایجاد workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // تنظیم عرض ستون‌ها
    const colWidths = columns.map(() => ({ wch: 18 }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'گزارش');

    // ذخیره فایل
    const dateStr = toPersianDate(new Date()).replace(/\//g, '-');
    XLSX.writeFile(wb, `${fileName}-${dateStr}.xlsx`);
  };

  return (
    <button onClick={generateExcel} className="btn btn-success">
      📊 گزارش Excel
    </button>
  );
}

export default ExcelReportButton;