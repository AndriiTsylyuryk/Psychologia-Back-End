import { Router } from 'express';
import authRouter from './auth.js';
import calendarRouter from './calendar.js';



const router = Router();

router.use('/auth', authRouter);
router.use('/calendar', calendarRouter);


export default router;