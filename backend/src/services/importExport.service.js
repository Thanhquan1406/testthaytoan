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
 * @returns {Promise<Buffer>}
 * @todo Implement with exceljs
 */
const exportKetQuaExcel = async (ketQuas, tenDeThi) => {
  throw new Error('Tính năng xuất Excel sẽ có ở Phase 2');
};

module.exports = { importDocx, importPdf, exportKetQuaExcel, parseCauHoiFromText };
