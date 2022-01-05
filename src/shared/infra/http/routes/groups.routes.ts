import { CreateGroupController } from '@modules/groups/useCases/createGroup/CreateGroupController';
import { CreateGuessController } from '@modules/groups/useCases/createGuess/CreateGuessController';
import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const createGroupController = new CreateGroupController();
const createGuessController = new CreateGuessController();

const groupsRoutes = Router();

groupsRoutes.post('/', ensureAuthenticated, createGroupController.handle);
groupsRoutes.post(
  '/:group_id/guess',
  ensureAuthenticated,
  createGuessController.handle,
);

export { groupsRoutes };
