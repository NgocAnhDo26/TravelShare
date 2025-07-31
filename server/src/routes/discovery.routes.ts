import { Router } from 'express';
import { discoveryController } from '../controllers/discovery.controllers';

const discoveryRouter: Router = Router();

discoveryRouter.get('/discover', discoveryController.getTrendings);
discoveryRouter.get('/plans', discoveryController.getPlans);
discoveryRouter.get('/posts', discoveryController.getPosts);
discoveryRouter.get('/people', discoveryController.getPeople);

export default discoveryRouter;
