/**
 * @fileoverview Service quản lý ngân hàng câu hỏi (dành cho Giáo viên).
 * CRUD câu hỏi, filter, tạo chủ đề.
 */

const CauHoi = require('../models/CauHoi');
const ChuDe = require('../models/ChuDe');
const MonHoc = require('../models/MonHoc');
const { LOAI_CAU_HOI, DO_KHO } = require('../utils/constants');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Lấy danh sách câu hỏi với filter và phân trang
 * @param {string} giaoVienId - ObjectId giáo viên (chỉ thấy câu hỏi của mình)
 * @param {object} query - Tham số lọc từ req.query
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layDanhSach = async (giaoVienId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { chuDeId, monHocId, loaiCauHoi, doKho, search } = query;

  const filter = { nguoiDungId: giaoVienId };

  if (loaiCauHoi && Object.values(LOAI_CAU_HOI).includes(loaiCauHoi)) filter.loaiCauHoi = loaiCauHoi;
  if (doKho && Object.values(DO_KHO).includes(doKho)) filter.doKho = doKho;
  if (search) filter.noiDung = { $regex: search, $options: 'i' };

  // Filter theo chủ đề hoặc môn học (cần lookup qua ChuDe)
  if (chuDeId) {
    filter.chuDeId = chuDeId;
  } else if (monHocId) {
    const chuDeIds = await ChuDe.find({ monHocId }).distinct('_id');
    filter.chuDeId = { $in: chuDeIds };
  }

  const [data, total] = await Promise.all([
    CauHoi.find(filter)
      .populate({ path: 'chuDeId', populate: { path: 'monHocId', select: 'ten' } })
      .skip(skip)
      .limit(limit)
      .sort({ thoiGianTao: -1 })
      .lean(),
    CauHoi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Tạo câu hỏi mới
 * @param {string} giaoVienId
 * @param {object} data
 * @returns {Promise<object>}
 */
const taoCauHoi = async (giaoVienId, data) => {
  const { chuDeId, noiDung, loaiCauHoi, doKho, dapAnDung, luaChonA, luaChonB, luaChonC, luaChonD } = data;

  const chuDe = await ChuDe.findById(chuDeId);
  if (!chuDe) throw Object.assign(new Error('Chủ đề không tồn tại'), { statusCode: 404 });

  return CauHoi.create({
    chuDeId, noiDung, loaiCauHoi, doKho,
    dapAnDung, luaChonA, luaChonB, luaChonC, luaChonD,
    nguoiDungId: giaoVienId,
  });
};

/**
 * Cập nhật câu hỏi (chỉ người tạo mới được sửa)
 * @param {string} cauHoiId
 * @param {string} giaoVienId
 * @param {object} data
 * @returns {Promise<object>}
 */
const capNhatCauHoi = async (cauHoiId, giaoVienId, data) => {
  const updated = await CauHoi.findOneAndUpdate(
    { _id: cauHoiId, nguoiDungId: giaoVienId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw Object.assign(new Error('Không tìm thấy câu hỏi hoặc không có quyền'), { statusCode: 404 });
  return updated;
};

/**
 * Xóa câu hỏi
 * @param {string} cauHoiId
 * @param {string} giaoVienId
 */
const xoaCauHoi = async (cauHoiId, giaoVienId) => {
  const result = await CauHoi.findOneAndDelete({ _id: cauHoiId, nguoiDungId: giaoVienId });
  if (!result) throw Object.assign(new Error('Không tìm thấy câu hỏi'), { statusCode: 404 });
};

/**
 * Tạo chủ đề mới cho môn học
 * @param {string} monHocId
 * @param {string} tenChuDe
 * @returns {Promise<object>}
 */
const taoChuDe = async (monHocId, tenChuDe) => {
  const monHoc = await MonHoc.findById(monHocId);
  if (!monHoc) throw Object.assign(new Error('Môn học không tồn tại'), { statusCode: 404 });

  const tonTai = await ChuDe.findOne({ ten: tenChuDe, monHocId });
  if (tonTai) throw Object.assign(new Error('Chủ đề đã tồn tại trong môn học này'), { statusCode: 409 });

  return ChuDe.create({ ten: tenChuDe, monHocId });
};

/**
 * Lấy danh sách chủ đề theo môn học
 * @param {string} monHocId
 * @returns {Promise<object[]>}
 */
const layDanhSachChuDe = async (monHocId) => {
  const filter = monHocId ? { monHocId } : {};
  return ChuDe.find(filter).populate('monHocId', 'ten').sort({ ten: 1 }).lean();
};

/**
 * Lấy danh sách môn học (cho dropdown)
 * @returns {Promise<object[]>}
 */
const layDanhSachMonHoc = async () => {
  return MonHoc.find({}).sort({ ten: 1 }).lean();
};

// ─── NGÂN HÀNG CÂU HỎI ──────────────────────────────────────────────────────

const NganHang = require('../models/NganHang');

/**
 * Import mảng câu hỏi đã parse vào ngân hàng (bulk insert)
 * @param {string} giaoVienId
 * @param {string} nganHangId
 * @param {string|null} cauTrucId
 * @param {object[]} questions - Mảng { noiDung, loaiCauHoi, doKho, dapAnDung, luaChonA-D }
 * @returns {Promise<object[]>}
 */
const importCauHoi = async (giaoVienId, nganHangId, cauTrucId, questions) => {
  if (!questions || !questions.length) {
    throw Object.assign(new Error('Không có câu hỏi nào để import'), { statusCode: 400 });
  }

  const docs = questions.map((q) => ({
    noiDung: q.noiDung,
    loaiCauHoi: q.loaiCauHoi || LOAI_CAU_HOI.TRAC_NGHIEM,
    doKho: q.doKho || DO_KHO.TH,
    dapAnDung: q.dapAnDung || '',
    luaChonA: q.luaChonA || '',
    luaChonB: q.luaChonB || '',
    luaChonC: q.luaChonC || '',
    luaChonD: q.luaChonD || '',
    nganHangId,
    cauTrucId: q.cauTrucId || cauTrucId || null,
    nguoiDungId: giaoVienId,
  }));

  const inserted = await CauHoi.insertMany(docs);

  // Cập nhật cache soCauHoi trên ngân hàng
  const totalCount = await CauHoi.countDocuments({ nganHangId });
  await NganHang.findByIdAndUpdate(nganHangId, { soCauHoi: totalCount });

  return inserted;
};

/**
 * Lấy câu hỏi theo ngân hàng (có filter, phân trang)
 * @param {string} nganHangId
 * @param {string} giaoVienId
 * @param {object} query
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layTheoNganHang = async (nganHangId, giaoVienId, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { cauTrucId, loaiCauHoi, doKho, search } = query;

  const filter = { nganHangId, nguoiDungId: giaoVienId };

  if (cauTrucId) filter.cauTrucId = cauTrucId;
  if (loaiCauHoi && Object.values(LOAI_CAU_HOI).includes(loaiCauHoi)) filter.loaiCauHoi = loaiCauHoi;
  if (doKho && Object.values(DO_KHO).includes(doKho)) filter.doKho = doKho;
  if (search) filter.noiDung = { $regex: search, $options: 'i' };

  const [data, total] = await Promise.all([
    CauHoi.find(filter)
      .populate('cauTrucId', 'ten loai')
      .skip(skip)
      .limit(limit)
      .sort({ thoiGianTao: -1 })
      .lean(),
    CauHoi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

module.exports = {
  layDanhSach,
  taoCauHoi,
  capNhatCauHoi,
  xoaCauHoi,
  taoChuDe,
  layDanhSachChuDe,
  layDanhSachMonHoc,
  importCauHoi,
  layTheoNganHang,
};

