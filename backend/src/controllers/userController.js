import { UserService } from '../services/userService.js';

export const UserController = {
  async requestOTP(req, res) {
    try {
      const { contact } = req.body;
      const result = await UserService.requestOTP(contact);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async verifyOTP(req, res) {
    try {
      const { contact, otpCode } = req.body;
      const result = await UserService.verifyOTPAndLogin(contact, otpCode);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async signup(req, res) {
    try {
      const result = await UserService.signup(req.body);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  async getCitiesAndVenues(req, res) {
    try {
      const result = await UserService.getCitiesAndVenues();
      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getProfile(req, res) {
    try {
      const result = await UserService.getProfile(req.user.id);
      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
};