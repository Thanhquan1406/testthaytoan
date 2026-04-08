/**
 * @fileoverview Service xử lý import/export câu hỏi và kết quả.
 *
 * Định dạng file import hỗ trợ (PDF và DOCX):
 *
 *   Câu 1: Nội dung câu hỏi?
 *   A. Lựa chọn A
 *   B. Lựa chọn B
 *   C. Lựa chọn C
 *   D. Lựa chọn D
 *   Đáp án: A
 *
 *   Câu 2. Nội dung câu hỏi 2?
 *   ...
 *
 * Hỗ trợ biến thể:
 *   - Số câu: "Câu 1:", "Câu 1.", "1.", "1)"
 *   - Option:  "A.", "A)", "A:", "a.", "a)"
 *   - Đáp án:  "Đáp án: A", "ĐA: B", "Đáp án đúng: C", "Answer: D"
 */

const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Chuẩn hoá văn bản thô → danh sách câu hỏi trắc nghiệm
 * @param {string} rawText
 * @returns {Array<{noiDung,loaiCauHoi,doKho,dapAnDung,luaChonA,luaChonB,luaChonC,luaChonD}>}
 */
function parseCauHoiFromText(rawText) {
  // Chuẩn hoá xuống dòng, bỏ khoảng trắng thừa mỗi đầu dòng
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const results = [];

  // Tách thành các block theo dấu hiệu đầu câu (Câu N: / N. / N))
  // Dùng lookahead để giữ lại marker tại đầu mỗi block
  const blocks = text
    .split(/\n(?=\s*(?:Câu\s+)?\d+[:.)\s])/i)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    // Tìm vị trí đầu option A
    const optAIdx = lines.findIndex((l) => /^[Aa]\s*[.):]\s*\S/.test(l));
    if (optAIdx < 1) continue;

    // Nội dung câu hỏi: tất cả dòng trước optA, bỏ prefix "Câu N:" / "N."
    const rawQ = lines.slice(0, optAIdx).join(' ');
    const noiDung = rawQ
      .replace(/^\s*(?:Câu\s+)?\d+[:.)\s]+\s*/i, '')
      .trim();
    if (!noiDung) continue;

    // Lấy nội dung một option theo prefix chữ cái (hỗ trợ [Aa], [Bb], ...)
    const getOpt = (letter) => {
      const re = new RegExp(`^${letter}\\s*[.):][\\s]+`, 'i');
      const i = lines.findIndex((l) => re.test(l));
      if (i === -1) return '';

      // Dừng tại option tiếp theo hoặc dòng đáp án
      const nextOptI = lines.findIndex(
        (l, j) => j > i && /^[A-Ea-e]\s*[.):]\s*\S/.test(l)
      );
      const ansI = lines.findIndex(
        (l, j) => j > i && /^(?:Đáp án|ĐA|Answer)/i.test(l)
      );
      const stop = Math.min(
        nextOptI !== -1 ? nextOptI : lines.length,
        ansI !== -1 ? ansI : lines.length
      );

      const firstPart = lines[i].replace(re, '').trim();
      return [firstPart, ...lines.slice(i + 1, stop)]
        .filter(Boolean)
        .join(' ')
        .trim();
    };

    const luaChonA = getOpt('[Aa]');
    const luaChonB = getOpt('[Bb]');
    if (!luaChonA || !luaChonB) continue; // tối thiểu 2 lựa chọn

    const luaChonC = getOpt('[Cc]');
    const luaChonD = getOpt('[Dd]');

    // Tìm đáp án đúng
    const ansLine = lines.find((l) =>
      /^(?:Đáp án|Đáp án đúng|ĐA|Answer)\s*[:\s]/i.test(l)
    );
    let dapAnDung = 'A';
    if (ansLine) {
      const m = ansLine.match(/[A-Da-d]/);
      if (m) dapAnDung = m[0].toUpperCase();
    }

    results.push({
      noiDung,
      loaiCauHoi: 'TRAC_NGHIEM',
      doKho: 'TH',
      dapAnDung,
      luaChonA,
      luaChonB,
      luaChonC: luaChonC || '',
      luaChonD: luaChonD || '',
    });
  }

  return results;
}

/**
 * Parse file DOCX thành danh sách câu hỏi
 * @param {Buffer} buffer
 * @returns {Promise<object[]>}
 */
const importDocx = async (buffer) => {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const questions = parseCauHoiFromText(text);
  if (!questions.length) {
    throw Object.assign(
      new Error(
        'Không tìm thấy câu hỏi nào trong file. Hãy kiểm tra lại định dạng file.'
      ),
      { statusCode: 422 }
    );
  }
  return questions;
};

/**
 * Parse file PDF thành danh sách câu hỏi
 * @param {Buffer} buffer
 * @returns {Promise<object[]>}
 */
const importPdf = async (buffer) => {
  const { text } = await pdfParse(buffer);
  const questions = parseCauHoiFromText(text);
  if (!questions.length) {
    throw Object.assign(
      new Error(
        'Không tìm thấy câu hỏi nào trong file. Hãy kiểm tra lại định dạng file.'
      ),
      { statusCode: 422 }
    );
  }
  return questions;
};

/**
 * Xuất kết quả thi ra file Excel
 * @param {object[]} ketQuas
 * @param {string} tenDeThi
 * @param {object} analytics
 * @returns {Promise<Buffer>}
 */
const exportKetQuaExcel = async (ketQuas, tenDeThi, analytics = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WEB_THI_TRAC_NGHIEM';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('KetQuaChiTiet');
  dataSheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'HocVien', key: 'hocVien', width: 32 },
    { header: 'Lop', key: 'lop', width: 24 },
    { header: 'Diem', key: 'diem', width: 12 },
    { header: 'ThoiGianNop', key: 'thoiGianNop', width: 24 },
    { header: 'GhiChu', key: 'ghiChu', width: 50 },
  ];

  ketQuas.forEach((k, i) => {
    dataSheet.addRow({
      stt: i + 1,
      hocVien: k.nguoiDungId ? `${k.nguoiDungId.ho} ${k.nguoiDungId.ten}` : (k.hoTenAnDanh || 'Ẩn danh'),
      lop: k.lopHocId?.ten || '—',
      diem: Number(k.ketQua?.tongDiem ?? 0),
      thoiGianNop: k.thoiGianNop ? new Date(k.thoiGianNop).toLocaleString('vi-VN') : '—',
      ghiChu: k.ketQua?.ghiChu || '',
    });
  });

  const summarySheet = workbook.addWorksheet('TongQuan');
  const scores = ketQuas
    .map((k) => Number(k.ketQua?.tongDiem))
    .filter((n) => Number.isFinite(n));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const min = scores.length ? Math.min(...scores) : 0;
  const passCount = scores.filter((s) => s >= 5).length;
  const passRate = scores.length ? (passCount / scores.length) * 100 : 0;

  summarySheet.addRows([
    ['Bao cao ket qua thi'],
    ['De thi', tenDeThi],
    ['Ngay xuat', new Date().toLocaleString('vi-VN')],
    [],
    ['Tong bai nop', ketQuas.length],
    ['Diem trung binh', Number(avg.toFixed(2))],
    ['Diem cao nhat', Number(max.toFixed(2))],
    ['Diem thap nhat', Number(min.toFixed(2))],
    ['Ty le dat (>=5)', `${passRate.toFixed(2)}%`],
  ]);

  const histogramSheet = workbook.addWorksheet('Histogram');
  histogramSheet.columns = [
    { header: 'KhoangDiem', key: 'label', width: 20 },
    { header: 'SoLuong', key: 'count', width: 12 },
  ];
  (analytics.histogram?.bins || []).forEach((b) => histogramSheet.addRow({ label: b.label, count: b.count }));

  const classSheet = workbook.addWorksheet('SoSanhLop');
  classSheet.columns = [
    { header: 'TenLop', key: 'tenLop', width: 30 },
    { header: 'SoBaiNop', key: 'count', width: 12 },
    { header: 'DiemTB', key: 'avg', width: 12 },
    { header: 'Max', key: 'max', width: 10 },
    { header: 'Min', key: 'min', width: 10 },
    { header: 'TyLeDat', key: 'passRate', width: 14 },
  ];
  (analytics.classComparison?.data || []).forEach((c) => classSheet.addRow(c));

  const difficultySheet = workbook.addWorksheet('DoKhoCauHoi');
  difficultySheet.columns = [
    { header: 'ThuTu', key: 'thuTu', width: 10 },
    { header: 'NoiDung', key: 'noiDung', width: 60 },
    { header: 'TyLeDung(%)', key: 'tiLeDung', width: 14 },
    { header: 'MucDo', key: 'mucDo', width: 15 },
    { header: 'SoDung', key: 'soDung', width: 10 },
    { header: 'TongBaiLam', key: 'tongBaiLam', width: 12 },
  ];
  (analytics.questionDifficulty?.data || []).forEach((q) => difficultySheet.addRow(q));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const exportKetQuaPDF = async (ketQuas, tenDeThi, analytics = {}) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const scores = ketQuas
    .map((k) => Number(k.ketQua?.tongDiem))
    .filter((n) => Number.isFinite(n));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  doc.fontSize(16).text('Bao cao ket qua thi', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`De thi: ${tenDeThi}`);
  doc.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`);
  doc.text(`Tong bai nop: ${ketQuas.length}`);
  doc.text(`Diem trung binh: ${avg.toFixed(2)}`);
  doc.moveDown(0.8);

  doc.fontSize(12).text('So sanh lop');
  (analytics.classComparison?.data || []).slice(0, 10).forEach((row) => {
    doc
      .fontSize(10)
      .text(`${row.tenLop}: TB ${row.avg}, Dat ${row.passRate}% (${row.count} bai)`);
  });
  doc.moveDown(0.6);

  doc.fontSize(12).text('Histogram diem');
  (analytics.histogram?.bins || []).forEach((b) => {
    doc.fontSize(10).text(`${b.label}: ${b.count}`);
  });
  doc.moveDown(0.6);

  doc.fontSize(12).text('Top cau hoi kho (ti le dung thap)');
  (analytics.questionDifficulty?.data || [])
    .slice()
    .sort((a, b) => a.tiLeDung - b.tiLeDung)
    .slice(0, 10)
    .forEach((q) => {
      doc.fontSize(10).text(`Cau ${q.thuTu} - ${q.tiLeDung}% (${q.mucDo})`);
    });

  doc.end();
  return await new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

module.exports = { importDocx, importPdf, exportKetQuaExcel, exportKetQuaPDF, parseCauHoiFromText };
