import { Router } from 'express';
import PlanController from '../controllers/plan.controller';
import AuthJwtMiddleware from '../middlewares/authJwt';

const router = Router();


router.post(
    '/:id/items',
    AuthJwtMiddleware.verifyToken, 
    PlanController.addItineraryItem
);
router.get(
    '/:id/items/:itemId',
    AuthJwtMiddleware.verifyToken, 
    PlanController.getItineraryItemById
);
router.put(
    '/:id/items/:itemId',
    AuthJwtMiddleware.verifyToken, 
    PlanController.updateItineraryItem
);
router.delete(
    '/:id/items/:itemId',
     AuthJwtMiddleware.verifyToken, 
    PlanController.deleteItineraryItem
);


export default router;