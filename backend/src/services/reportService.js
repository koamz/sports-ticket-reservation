import { ReportRepository } from '../repositories/reportRepository.js';

export class ReportService {
  static async createReport(userId, data) {
    return await ReportRepository.createReport(userId, data);
  }

  static async adminGetReports() {
    return await ReportRepository.adminGetReports();
  }

  static async adminUpdateReport(reportId, status) {
    return await ReportRepository.adminUpdateReportStatus(reportId, status);
  }
}