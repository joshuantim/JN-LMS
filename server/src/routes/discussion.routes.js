import express from 'express';
import { DiscussionController } from '../controllers/discussion.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', DiscussionController.listDiscussions);
router.post('/', DiscussionController.createDiscussion);
router.get('/:id', DiscussionController.getDiscussionById);
router.post('/:id/replies', DiscussionController.replyToDiscussion);
router.patch('/:id/pin', DiscussionController.togglePin);
router.delete('/:id', DiscussionController.deleteDiscussion);
router.delete('/:id/replies/:replyId', DiscussionController.deleteReply);

export default router;
