import { Router } from 'express';
import { discoveryController } from '../controllers/discovery.controllers';
import AuthJwtMiddleware from '../middlewares/authJwt';

const discoveryRouter: Router = Router();

discoveryRouter.get(
  '/discover',
  AuthJwtMiddleware.optionalAuth,
  discoveryController.getTrendings,
);
discoveryRouter.get(
  '/plans',
  AuthJwtMiddleware.optionalAuth,
  discoveryController.getPlans,
);
discoveryRouter.get(
  '/posts',
  AuthJwtMiddleware.optionalAuth,
  discoveryController.getPosts,
);
discoveryRouter.get(
  '/people',
  AuthJwtMiddleware.optionalAuth,
  discoveryController.getPeople,
);

export default discoveryRouter;
