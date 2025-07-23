import { Router } from 'express';
import PostController from '../controllers/post.controllers';


const postRouter: Router = Router();
postRouter.post('/create', PostController.createPost);

export default postRouter;