import { TicketService } from '../services/ticketService.js';

export const TicketController = {
  async search(req, res) {
    try {
      const results = await TicketService.search(req.query);
      res.status(200).json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getDetails(req, res) {
    try {
      const result = await TicketService.getDetails(req.params.id);
      if (!result) return res.status(404).json({ error: 'Ticket not found.' });
      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};