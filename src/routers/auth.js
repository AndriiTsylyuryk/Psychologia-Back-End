import { Router } from 'express';
import { loginUserController, logoutUserController, refreshUserSessionController, registerUserController, requestResetEmailController, resetPasswordController } from '../controllers/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { loginUserSchema, registerUserSchema, requestResetEmailSchema, resetPasswordSchema } from '../validation/auth.js';

const router = Router();

router.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);


router.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);


router.post('/logout', ctrlWrapper(logoutUserController));

router.post('/refresh', ctrlWrapper(refreshUserSessionController));

router.post(
  '/request-reset-email',
  validateBody(requestResetEmailSchema),
  ctrlWrapper(requestResetEmailController),
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

export default router;
