import { Router } from 'express';
import {
  getUser,
  getUserCurrencies,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticateJwt } from '../middlewares/passport';

const router = Router({});

router.get('/', authenticateJwt, getUser);
router.get('/currencies', authenticateJwt, getUserCurrencies);
router.put('/update', authenticateJwt, updateUser);
router.delete('/delete', authenticateJwt, deleteUser);

export default router;
