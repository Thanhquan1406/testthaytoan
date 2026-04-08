/**
 * @fileoverview Service quản lý Cấu trúc (cây thư mục) trong ngân hàng câu hỏi.
 * Hỗ trợ CRUD + xóa đệ quy toàn bộ con cháu.
 */

const CauTruc = require('../models/CauTruc');
const CauHoi = require('../models/CauHoi');
const NganHang = require('../models/NganHang');

/**
 * Kiểm tra quyền truy cập ngân hàng
 * @param {string} nganHangId
 * @param {string} giaoVienId
 */
const _kiemTraQuyenNganHang = async (nganHangId, giaoVienId) => {
  const nganHang = await NganHang.findOne({
    _id: nganHangId,
    nguoiDungId: giaoVienId,
    deletedAt: null,
  });
  if (!nganHang) {
    throw Object.assign(new Error('Không tìm thấy ngân hàng hoặc không có quyền'), { statusCode: 404 });
  }
  return nganHang;
};

/**
 * Lấy danh sách cấu trúc (flat list) theo ngân hàng
 * Frontend sẽ tự build cây từ parentId
 * @param {string} nganHangId
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSach = async (nganHangId, giaoVienId) => {
  await _kiemTraQuyenNganHang(nganHangId, giaoVienId);

  const [structures, cauHoiStats] = await Promise.all([
    CauTruc.find({ nganHangId }).sort({ thuTu: 1, thoiGianTao: 1 }).lean(),
    CauHoi.aggregate([
      { $match: { nganHangId: new (require('mongoose').Types.ObjectId)(nganHangId), cauTrucId: { $ne: null } } },
      { $group: {
          _id: { cauTrucId: "$cauTrucId", doKho: "$doKho" },
          count: { $sum: 1 }
      }}
    ])
  ]);

  // Khởi tạo map đếm
  const statsMap = {};
  structures.forEach(s => {
    statsMap[s._id.toString()] = { total: 0, nb: 0, th: 0, vh: 0 };
  });

  // Điền dữ liệu cho các node (áp dụng cho node trực tiếp chứa câu hỏi)
  cauHoiStats.forEach(stat => {
    const cId = stat._id.cauTrucId?.toString();
    const doKho = stat._id.doKho;
    if (cId && statsMap[cId]) {
      statsMap[cId].total += stat.count;
      if (doKho === 'NB') statsMap[cId].nb += stat.count;
      if (doKho === 'TH') statsMap[cId].th += stat.count;
      if (doKho === 'VH') statsMap[cId].vh += stat.count;
    }
  });

  // Viết hàm cộng dồn từ con lên cha (đệ quy từ dưới lên hoặc theo thứ bậc)
  // Vì là cây lồng nhau, ta có thể dùng hàm đệ quy tinh toán cho mỗi node
  const calculateRecursive = (nodeId) => {
    // Tìm các con trực tiếp
    const children = structures.filter(s => s.parentId?.toString() === nodeId);
    let childSum = { total: 0, nb: 0, th: 0, vh: 0 };
    
    children.forEach(child => {
      const cSum = calculateRecursive(child._id.toString());
      childSum.total += cSum.total;
      childSum.nb += cSum.nb;
      childSum.th += cSum.th;
      childSum.vh += cSum.vh;
    });

    // Cộng dồn con vào cha
    statsMap[nodeId].total += childSum.total;
    statsMap[nodeId].nb += childSum.nb;
    statsMap[nodeId].th += childSum.th;
    statsMap[nodeId].vh += childSum.vh;

    return statsMap[nodeId];
  };

  // Tính toán bắt đầu từ các node gốc (không có parent)
  const rootNodes = structures.filter(s => !s.parentId);
  rootNodes.forEach(root => calculateRecursive(root._id.toString()));

  // Gắn kết quả vào danh sách trả về
  return structures.map(s => {
    const sId = s._id.toString();
    return {
      ...s,
      soCauHoi: statsMap[sId].total,
      soCauHoiNB: statsMap[sId].nb,
      soCauHoiTH: statsMap[sId].th,
      soCauHoiVH: statsMap[sId].vh,
    };
  });
};

/**
 * Tạo cấu trúc mới
 * @param {string} giaoVienId
 * @param {object} data - { ten, loai, nganHangId, parentId? }
 * @returns {Promise<object>}
 */
const taoCauTruc = async (giaoVienId, data) => {
  const { ten, loai, nganHangId, parentId } = data;

  await _kiemTraQuyenNganHang(nganHangId, giaoVienId);

  if (!ten || !ten.trim()) {
    throw Object.assign(new Error('Tên cấu trúc không được để trống'), { statusCode: 400 });
  }

  // Nếu có parentId, kiểm tra parent tồn tại
  if (parentId) {
    const parent = await CauTruc.findOne({ _id: parentId, nganHangId });
    if (!parent) {
      throw Object.assign(new Error('Cấu trúc cha không tồn tại'), { statusCode: 404 });
    }
  }

  // Tìm thứ tự lớn nhất cùng cấp cha
  const maxThuTu = await CauTruc.findOne({ nganHangId, parentId: parentId || null })
    .sort({ thuTu: -1 })
    .select('thuTu')
    .lean();

  const cauTruc = await CauTruc.create({
    ten: ten.trim(),
    loai: loai || 'KHUNG_KIEN_THUC',
    nganHangId,
    parentId: parentId || null,
    thuTu: maxThuTu ? maxThuTu.thuTu + 1 : 0,
    nguoiDungId: giaoVienId,
  });

  return cauTruc.toObject();
};

/**
 * Cập nhật cấu trúc (tên, loại)
 * @param {string} id
 * @param {string} nganHangId
 * @param {string} giaoVienId
 * @param {object} data - { ten?, loai? }
 * @returns {Promise<object>}
 */
const capNhatCauTruc = async (id, nganHangId, giaoVienId, data) => {
  await _kiemTraQuyenNganHang(nganHangId, giaoVienId);

  const allowedFields = {};
  if (data.ten !== undefined) allowedFields.ten = data.ten.trim();
  if (data.loai !== undefined) allowedFields.loai = data.loai;

  const updated = await CauTruc.findOneAndUpdate(
    { _id: id, nganHangId, nguoiDungId: giaoVienId },
    { $set: allowedFields },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw Object.assign(new Error('Không tìm thấy cấu trúc'), { statusCode: 404 });
  }

  return updated;
};

/**
 * Xóa cấu trúc + toàn bộ con cháu (đệ quy) + gỡ liên kết câu hỏi
 * @param {string} id
 * @param {string} nganHangId
 * @param {string} giaoVienId
 */
const xoaCauTruc = async (id, nganHangId, giaoVienId) => {
  await _kiemTraQuyenNganHang(nganHangId, giaoVienId);

  const cauTruc = await CauTruc.findOne({ _id: id, nganHangId, nguoiDungId: giaoVienId });
  if (!cauTruc) {
    throw Object.assign(new Error('Không tìm thấy cấu trúc'), { statusCode: 404 });
  }

  // Thu thập tất cả ID con cháu (đệ quy)
  const idsToDelete = [id];
  const _getDescendants = async (parentId) => {
    const children = await CauTruc.find({ parentId }).select('_id').lean();
    for (const child of children) {
      idsToDelete.push(child._id.toString());
      await _getDescendants(child._id);
    }
  };
  await _getDescendants(id);

  // Gỡ liên kết câu hỏi khỏi các cấu trúc bị xóa
  await CauHoi.updateMany(
    { cauTrucId: { $in: idsToDelete } },
    { $set: { cauTrucId: null } }
  );

  // Xóa tất cả cấu trúc
  await CauTruc.deleteMany({ _id: { $in: idsToDelete } });

  // Cập nhật lại soCauHoi của ngân hàng
  const remainingCount = await CauHoi.countDocuments({ nganHangId, nganHangId: { $ne: null } });
  await NganHang.findByIdAndUpdate(nganHangId, { soCauHoi: remainingCount });
};

module.exports = {
  layDanhSach,
  taoCauTruc,
  capNhatCauTruc,
  xoaCauTruc,
};
