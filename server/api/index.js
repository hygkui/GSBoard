import { Router } from 'express'

import users from './users'
import wds from './wds'

const router = Router()

// Add USERS Routes
router.use(users)
router.use(wds)

export default router
