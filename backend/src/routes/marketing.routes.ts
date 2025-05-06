import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';
import * as marketingController from '../controllers/marketing.controller';
import * as templateController from '../controllers/marketingTemplate.controller';
import * as socialMediaController from '../controllers/socialMedia.controller';

const router = express.Router();

// Campaign routes
/**
 * @swagger
 * /api/marketing/campaigns:
 *   get:
 *     summary: Get all marketing campaigns with filtering and pagination
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, sms, social_media, push_notification, whatsapp, other]
 *         description: Filter by campaign type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, active, paused, completed, cancelled]
 *         description: Filter by campaign status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of campaigns to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of campaigns to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to get campaigns
 */
router.get('/campaigns', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), marketingController.getAllCampaigns);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   get:
 *     summary: Get a campaign by ID
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to get campaign
 */
router.get('/campaigns/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), marketingController.getCampaignById);

/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 description: Campaign name
 *               description:
 *                 type: string
 *                 description: Campaign description
 *               type:
 *                 type: string
 *                 enum: [email, sms, social_media, push_notification, whatsapp, other]
 *                 description: Campaign type
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Campaign start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Campaign end date
 *               audienceSegments:
 *                 type: array
 *                 description: Audience segments
 *               content:
 *                 type: object
 *                 description: Campaign content
 *               budget:
 *                 type: object
 *                 description: Campaign budget
 *               isAutomated:
 *                 type: boolean
 *                 description: Whether the campaign is automated
 *               automationTriggers:
 *                 type: object
 *                 description: Automation triggers
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Campaign tags
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to create campaign
 */
router.post('/campaigns', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.createCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, sms, social_media, push_notification, whatsapp, other]
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, active, paused, completed, cancelled]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               audienceSegments:
 *                 type: array
 *               content:
 *                 type: object
 *               budget:
 *                 type: object
 *               isAutomated:
 *                 type: boolean
 *               automationTriggers:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to update campaign
 */
router.put('/campaigns/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.updateCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       400:
 *         description: Cannot delete an active campaign
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to delete campaign
 */
router.delete('/campaigns/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.deleteCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/recipients:
 *   post:
 *     summary: Add recipients to a campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of customer IDs
 *               segmentCriteria:
 *                 type: object
 *                 description: Criteria for segmenting customers
 *     responses:
 *       200:
 *         description: Recipients added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to add recipients
 */
router.post('/campaigns/:id/recipients', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.addCampaignRecipients);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/recipients:
 *   get:
 *     summary: Get campaign recipients
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed, bounced]
 *         description: Filter by recipient status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recipients to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of recipients to skip
 *     responses:
 *       200:
 *         description: Recipients retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to get recipients
 */
router.get('/campaigns/:id/recipients', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), marketingController.getCampaignRecipients);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/launch:
 *   post:
 *     summary: Launch a campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign launched successfully
 *       400:
 *         description: Invalid campaign state or no recipients
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to launch campaign
 */
router.post('/campaigns/:id/launch', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.launchCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/pause:
 *   post:
 *     summary: Pause a campaign
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign paused successfully
 *       400:
 *         description: Invalid campaign state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to pause campaign
 */
router.post('/campaigns/:id/pause', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.pauseCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/complete:
 *   post:
 *     summary: Mark a campaign as completed
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign marked as completed
 *       400:
 *         description: Invalid campaign state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to complete campaign
 */
router.post('/campaigns/:id/complete', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), marketingController.completeCampaign);

/**
 * @swagger
 * /api/marketing/campaigns/{id}/performance:
 *   get:
 *     summary: Get campaign performance metrics
 *     tags: [Marketing Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Failed to get performance metrics
 */
router.get('/campaigns/:id/performance', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), marketingController.getCampaignPerformance);

// Template routes
router.get('/templates', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), templateController.getAllTemplates);
router.get('/templates/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), templateController.getTemplateById);
router.post('/templates', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), templateController.createTemplate);
router.put('/templates/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), templateController.updateTemplate);
router.delete('/templates/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), templateController.deleteTemplate);
router.post('/templates/:id/clone', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), templateController.cloneTemplate);

// Social Media Account routes
router.get('/social-accounts', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), socialMediaController.getAllSocialMediaAccounts);
router.get('/social-accounts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), socialMediaController.getSocialMediaAccountById);
router.post('/social-accounts', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.createSocialMediaAccount);
router.put('/social-accounts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.updateSocialMediaAccount);
router.put('/social-accounts/:id/metrics', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.updateSocialMediaMetrics);
router.delete('/social-accounts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.deleteSocialMediaAccount);

// Social Media Post routes
router.get('/social-posts', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), socialMediaController.getAllSocialMediaPosts);
router.get('/social-posts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]), socialMediaController.getSocialMediaPostById);
router.post('/social-posts', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.createSocialMediaPost);
router.put('/social-posts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.updateSocialMediaPost);
router.delete('/social-posts/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.deleteSocialMediaPost);
router.post('/social-posts/:id/publish', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.publishSocialMediaPost);
router.put('/social-posts/:id/metrics', authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]), socialMediaController.updatePostEngagementMetrics);

export default router; 