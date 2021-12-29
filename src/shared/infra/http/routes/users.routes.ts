import { Router } from 'express';

import { CreateUserController } from '@modules/accounts/useCases/createUser/CreateUserController';
import { LisUsersController } from '@modules/accounts/useCases/listUsers/ListUsersController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const createUserController = new CreateUserController();
const listUsersController = new LisUsersController();

const usersRoutes = Router();

usersRoutes.post('/', createUserController.handle);
usersRoutes.get('/', ensureAuthenticated, listUsersController.handle);

export { usersRoutes };
