import { Router } from 'express';

import { CreateUserController } from '@modules/accounts/useCases/createUser/CreateUserController';
import { LisUsersController } from '@modules/accounts/useCases/listUsers/ListUsersController';
import { UpdatePasswordController } from '@modules/accounts/useCases/updatePassword/UpdatePasswordController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const createUserController = new CreateUserController();
const listUsersController = new LisUsersController();
const updatePasswordController = new UpdatePasswordController();

const usersRoutes = Router();

usersRoutes.post('/', createUserController.handle);
usersRoutes.get('/', ensureAuthenticated, listUsersController.handle);
usersRoutes.post('/pass', ensureAuthenticated, updatePasswordController.handle);

export { usersRoutes };
