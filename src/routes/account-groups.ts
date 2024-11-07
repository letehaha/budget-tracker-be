// accountGroup.routes.ts

import { Router } from 'express';
import { authenticateJwt } from '@middlewares/passport';
import { validateEndpoint } from '@middlewares/validations';
import * as accountGroupController from '@controllers/account-groups';

const router = Router();

router.post(
  '/',
  authenticateJwt,
  validateEndpoint(accountGroupController.createAccountGroupSchema),
  accountGroupController.createAccountGroup,
);

router.get('/', authenticateJwt, accountGroupController.getAccountGroups);

router.put(
  '/:groupId',
  authenticateJwt,
  validateEndpoint(accountGroupController.updateAccountGroupSchema),
  accountGroupController.updateAccountGroup,
);

router.delete(
  '/:groupId',
  authenticateJwt,
  validateEndpoint(accountGroupController.deleteAccountGroupSchema),
  accountGroupController.deleteAccountGroup,
);

router.post(
  '/add-account',
  authenticateJwt,
  validateEndpoint(accountGroupController.addAccountToGroupSchema),
  accountGroupController.addAccountToGroup,
);

router.delete(
  '/:groupId/accounts/:accountId',
  authenticateJwt,
  validateEndpoint(accountGroupController.removeAccountFromGroupSchema),
  accountGroupController.removeAccountFromGroup,
);

router.put(
  '/:groupId/move',
  authenticateJwt,
  validateEndpoint(accountGroupController.moveAccountGroupSchema),
  accountGroupController.moveAccountGroup,
);

router.get(
  '/:groupId/accounts',
  authenticateJwt,
  validateEndpoint(accountGroupController.getAccountsInGroupSchema),
  accountGroupController.getAccountsInGroup,
);

export default router;
