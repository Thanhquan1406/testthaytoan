/**
 * @fileoverview Service xử lý import/export câu hỏi và kết quả - Phase 2.
 *
 * Import:
 *   - PDF, DOCX: Dùng pdf-parse và mammoth để extract text, parse theo format định sẵn
 *   - Excel: Dùng exceljs để đọc bảng tính
 *
 * Export:
 *   - Excel: Xuất danh sách kết quả thi theo lớp/đề
 */

/* eslint-disable no-unused-vars */

/**
 * Parse file DOCX thành danh sách câu hỏi
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<object[]>} Danh sách câu hỏi đã parse
 *
 * @todo Phase 2 - Implement with mammoth
 */
const importDocx = async (buffer) => {
  // const mammoth = require('mammoth');
  // const { value: text } = await mammoth.extractRawText({ buffer });
  // return parseCauHoiFromText(text);
  throw new Error('Tính năng import DOCX sẽ có ở Phase 2');
};

/**
 * Parse file PDF thành danh sách câu hỏi
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<object[]>} Danh sách câu hỏi đã parse
 *
 * @todo Phase 2 - Implement with pdf-parse
 */
const importPdf = async (buffer) => {
  // const pdfParse = require('pdf-parse');
  // const { text } = await pdfParse(buffer);
  // return parseCauHoiFromText(text);
  throw new Error('Tính năng import PDF sẽ có ở Phase 2');
};

/**
 * Xuất kết quả thi ra file Excel
 * @param {object[]} ketQuas - Danh sách kết quả
 * @param {string} tenDeThi - Tên đề thi
 * @returns {Promise<Buffer>} Excel file buffer
 *
 * @todo Phase 2 - Implement with exceljs
 */
const exportKetQuaExcel = async (ketQuas, tenDeThi) => {
  // const ExcelJS = require('exceljs');
  // const workbook = new ExcelJS.Workbook();
  // const sheet = workbook.addWorksheet(tenDeThi);
  // sheet.columns = [
  //   { header: 'Họ tên', key: 'hoTen', width: 30 },
  //   { header: 'Email', key: 'email', width: 30 },
  //   { header: 'Điểm', key: 'diem', width: 10 },
  //   { header: 'Thời gian nộp', key: 'thoiGianNop', width: 20 },
  // ];
  // ketQuas.forEach(kq => sheet.addRow(kq));
  // return workbook.xlsx.writeBuffer();
  throw new Error('Tính năng xuất Excel sẽ có ở Phase 2');
};

module.exports = { importDocx, importPdf, exportKetQuaExcel };
