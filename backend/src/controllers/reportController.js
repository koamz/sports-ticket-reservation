import { ReportService } from '../services/reportService.js';

export const ReportController = {
  async create(req, res) {
    try {
      const result = await ReportService.createReport(req.user.id, req.body);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async adminGetReports(req, res) {
    try {
      const result = await ReportService.adminGetReports();
      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async adminUpdateReport(req, res) {
    try {
      const { reportId, status } = req.body;
      const result = await ReportService.adminUpdateReport(reportId, status);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
};