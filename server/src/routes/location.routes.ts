import express from 'express';
import LocationController from '../controllers/location.controller';

const router = express.Router();

router.get('/ip', LocationController.getLocationByIP);

export default router;
