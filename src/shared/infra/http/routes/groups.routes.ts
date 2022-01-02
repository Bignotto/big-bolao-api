import { CreateGroupController } from '@modules/groups/useCases/createGroup/CreateGroupController';
import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const createGroupController = new CreateGroupController();

const groupsRoutes = Router();

groupsRoutes.post('/', ensureAuthenticated, createGroupController.handle);

export { groupsRoutes };
