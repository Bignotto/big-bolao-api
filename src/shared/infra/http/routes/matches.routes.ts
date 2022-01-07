import { UpdateMatchResultController } from '@modules/matches/useCases/updateMatchResult/UpdateMatchResultController';
import { Router } from 'express';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const updateMatchResultController = new UpdateMatchResultController();

const matchRoutes = Router();

matchRoutes.post(
  '/:match_id/result',
  ensureAuthenticated,
  ensureAdmin,
  updateMatchResultController.handle,
);

export { matchRoutes };
