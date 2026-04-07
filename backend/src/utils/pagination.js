/**
 * @fileoverview Tiện ích phân trang chuẩn hóa cho tất cả danh sách.
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} page - Trang hiện tại (bắt đầu từ 1)
 * @property {number} limit - Số bản ghi mỗi trang
 * @property {number} total - Tổng số bản ghi
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page - Trang hiện tại
 * @property {number} limit - Số bản ghi mỗi trang
 * @property {number} total - Tổng số bản ghi
 * @property {number} totalPages - Tổng số trang
 * @property {boolean} hasNext - Còn trang tiếp theo không
 * @property {boolean} hasPrev - Có trang trước không
 */

/**
 * Lấy giá trị phân trang từ query params, trả về skip/limit cho Mongoose
 * @param {object} query - req.query object
 * @param {number} [defaultLimit=10]
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Tạo metadata phân trang để đính kèm vào response
 * @param {PaginationOptions} options
 * @returns {PaginationMeta}
 */
const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = { getPaginationParams, buildPaginationMeta };
