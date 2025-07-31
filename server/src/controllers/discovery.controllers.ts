import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants/http';
import DiscoveryService from '../services/discovery.service';

class DiscoveryController {
  public async getTrendings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const after = req.query.after as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user as string | undefined;

      const trendings = await DiscoveryService.getTrendings({ limit, after });
      res.status(HTTP_STATUS.OK).json(trendings);
    } catch (error) {
      next(error); // Delegate to the central error handler
    }
  }

  public async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const plans = await DiscoveryService.getPlans(query as string, userId);
      res.status(HTTP_STATUS.OK).json(plans);
    } catch (error) {
      next(error);
    }
  }

  public async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const posts = await DiscoveryService.getPosts(query as string, userId);
      res.status(HTTP_STATUS.OK).json(posts);
    } catch (error) {
      next(error);
    }
  }

  public async getPeople(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query } = req.query;
      const userId = req.user as string | undefined;
      const people = await DiscoveryService.getPeople(query as string, userId);
      res.status(HTTP_STATUS.OK).json(people);
    } catch (error) {
      next(error);
    }
  }
}

export const discoveryController = new DiscoveryController();