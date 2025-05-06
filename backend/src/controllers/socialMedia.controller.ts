import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SocialMediaAccount, SocialMediaPlatform, SocialMediaMetrics } from '../models/socialMediaAccount.model';
import { SocialMediaPost, PostStatus, PostEngagementMetrics } from '../models/socialMediaPost.model';
import { User } from '../models/user.model';
import { MarketingCampaign } from '../models/marketingCampaign.model';

// Social Media Account controllers
export const getAllSocialMediaAccounts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      platform,
      active,
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (platform && Object.values(SocialMediaPlatform).includes(platform as SocialMediaPlatform)) {
      filter.platform = platform;
    }
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    if (search) {
      filter[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { accountUsername: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const accounts = await SocialMediaAccount.findAndCountAll({
      where: filter,
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]]
    });

    return res.status(200).json({
      total: accounts.count,
      accounts: accounts.rows,
      limit: Number(limit),
      offset: Number(offset),
      totalPages: Math.ceil(accounts.count / Number(limit))
    });
  } catch (error) {
    console.error('Error getting social media accounts:', error);
    return res.status(500).json({
      message: 'Server error while fetching social media accounts',
      error: (error as Error).message
    });
  }
};

export const getSocialMediaAccountById = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const account = await SocialMediaAccount.findByPk(accountId, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error(`Error getting social media account ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while fetching social media account',
      error: (error as Error).message
    });
  }
};

export const createSocialMediaAccount = async (req: Request, res: Response) => {
  try {
    const {
      name,
      platform,
      accountId,
      accountUsername,
      profileUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      metrics,
      active,
      settings,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !platform || !accountId || !accountUsername) {
      return res.status(400).json({ 
        message: 'Name, platform, accountId, and accountUsername are required' 
      });
    }

    // Validate platform
    if (!Object.values(SocialMediaPlatform).includes(platform)) {
      return res.status(400).json({ message: 'Invalid social media platform' });
    }

    // Check if account already exists
    const existingAccount = await SocialMediaAccount.findOne({
      where: {
        [Op.or]: [
          { accountId, platform },
          { accountUsername, platform }
        ]
      }
    });

    if (existingAccount) {
      return res.status(409).json({ 
        message: 'A social media account with this ID or username already exists for this platform' 
      });
    }

    // Create the account
    const account = await SocialMediaAccount.create({
      name,
      platform,
      accountId,
      accountUsername,
      profileUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      metrics,
      active: active !== undefined ? active : true,
      createdById: req.user?.id,
      settings,
      notes
    });

    return res.status(201).json({
      message: 'Social media account created successfully',
      account
    });
  } catch (error) {
    console.error('Error creating social media account:', error);
    return res.status(500).json({
      message: 'Server error while creating social media account',
      error: (error as Error).message
    });
  }
};

export const updateSocialMediaAccount = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const {
      name,
      accountUsername,
      profileUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      metrics,
      active,
      settings,
      notes
    } = req.body;

    // Find the account
    const account = await SocialMediaAccount.findByPk(accountId);

    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }

    // Update the account
    await account.update({
      name: name || account.name,
      accountUsername: accountUsername || account.accountUsername,
      profileUrl: profileUrl !== undefined ? profileUrl : account.profileUrl,
      accessToken: accessToken !== undefined ? accessToken : account.accessToken,
      refreshToken: refreshToken !== undefined ? refreshToken : account.refreshToken,
      tokenExpiresAt: tokenExpiresAt || account.tokenExpiresAt,
      metrics: metrics || account.metrics,
      active: active !== undefined ? active : account.active,
      settings: settings || account.settings,
      notes: notes !== undefined ? notes : account.notes,
      lastUpdatedById: req.user?.id
    });

    return res.status(200).json({
      message: 'Social media account updated successfully',
      account
    });
  } catch (error) {
    console.error('Error updating social media account:', error);
    return res.status(500).json({
      message: 'Server error while updating social media account',
      error: (error as Error).message
    });
  }
};

export const updateSocialMediaMetrics = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const { metrics } = req.body;

    // Validate metrics
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ message: 'Valid metrics object is required' });
    }

    // Find the account
    const account = await SocialMediaAccount.findByPk(accountId);

    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }

    // Prepare updated metrics
    const updatedMetrics: SocialMediaMetrics = {
      followers: metrics.followers !== undefined ? metrics.followers : (account.metrics?.followers || 0),
      engagement: metrics.engagement !== undefined ? metrics.engagement : (account.metrics?.engagement || 0),
      impressions: metrics.impressions !== undefined ? metrics.impressions : (account.metrics?.impressions || 0),
      clicks: metrics.clicks !== undefined ? metrics.clicks : (account.metrics?.clicks || 0),
      lastUpdated: new Date()
    };

    // Update the account
    await account.update({
      metrics: updatedMetrics,
      lastUpdatedById: req.user?.id
    });

    return res.status(200).json({
      message: 'Social media metrics updated successfully',
      metrics: updatedMetrics
    });
  } catch (error) {
    console.error('Error updating social media metrics:', error);
    return res.status(500).json({
      message: 'Server error while updating social media metrics',
      error: (error as Error).message
    });
  }
};

export const deleteSocialMediaAccount = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);
    
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    // Find the account
    const account = await SocialMediaAccount.findByPk(accountId);

    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }

    // Check for associated posts
    const postsCount = await SocialMediaPost.count({
      where: { socialMediaAccountId: accountId }
    });

    if (postsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete account with ${postsCount} associated posts. Deactivate it instead.` 
      });
    }

    // Soft delete (paranoid is true for this model)
    await account.destroy();

    return res.status(200).json({
      message: 'Social media account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social media account:', error);
    return res.status(500).json({
      message: 'Server error while deleting social media account',
      error: (error as Error).message
    });
  }
};

// Social Media Post controllers
export const getAllSocialMediaPosts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      platform,
      status,
      accountId,
      campaignId,
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (platform && Object.values(SocialMediaPlatform).includes(platform as SocialMediaPlatform)) {
      filter.platform = platform;
    }
    
    if (status && Object.values(PostStatus).includes(status as PostStatus)) {
      filter.status = status;
    }

    if (accountId && !isNaN(Number(accountId))) {
      filter.socialMediaAccountId = accountId;
    }

    if (campaignId && !isNaN(Number(campaignId))) {
      filter.campaignId = campaignId;
    }

    if (search) {
      filter.content = { [Op.iLike]: `%${search}%` };
    }

    const posts = await SocialMediaPost.findAndCountAll({
      where: filter,
      include: [
        {
          model: SocialMediaAccount,
          attributes: ['id', 'name', 'accountUsername', 'platform']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: MarketingCampaign,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy as string, sortOrder as string]]
    });

    return res.status(200).json({
      total: posts.count,
      posts: posts.rows,
      limit: Number(limit),
      offset: Number(offset),
      totalPages: Math.ceil(posts.count / Number(limit))
    });
  } catch (error) {
    console.error('Error getting social media posts:', error);
    return res.status(500).json({
      message: 'Server error while fetching social media posts',
      error: (error as Error).message
    });
  }
};

export const getSocialMediaPostById = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await SocialMediaPost.findByPk(postId, {
      include: [
        {
          model: SocialMediaAccount,
          attributes: ['id', 'name', 'accountUsername', 'platform', 'profileUrl']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: MarketingCampaign,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: SocialMediaPost,
          as: 'originalPost',
          required: false
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ message: 'Social media post not found' });
    }

    return res.status(200).json(post);
  } catch (error) {
    console.error(`Error getting social media post ID ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Server error while fetching social media post',
      error: (error as Error).message
    });
  }
};

export const createSocialMediaPost = async (req: Request, res: Response) => {
  try {
    const {
      content,
      mediaUrls,
      socialMediaAccountId,
      platform,
      scheduledFor,
      campaignId,
      tags,
      isRepost,
      originalPostId
    } = req.body;

    // Validate required fields
    if (!content || !socialMediaAccountId || !platform) {
      return res.status(400).json({ 
        message: 'Content, socialMediaAccountId, and platform are required' 
      });
    }

    // Validate platform
    if (!Object.values(SocialMediaPlatform).includes(platform)) {
      return res.status(400).json({ message: 'Invalid social media platform' });
    }

    // Check if social media account exists
    const account = await SocialMediaAccount.findByPk(socialMediaAccountId);
    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }

    // Check if platform matches account
    if (account.platform !== platform) {
      return res.status(400).json({ 
        message: `Platform mismatch: Account is for ${account.platform} but post is for ${platform}` 
      });
    }

    // Check campaign if provided
    if (campaignId) {
      const campaign = await MarketingCampaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Marketing campaign not found' });
      }
    }

    // Check original post if repost
    if (isRepost && originalPostId) {
      const originalPost = await SocialMediaPost.findByPk(originalPostId);
      if (!originalPost) {
        return res.status(404).json({ message: 'Original post not found' });
      }
    }

    // Create the post
    const post = await SocialMediaPost.create({
      content,
      mediaUrls,
      socialMediaAccountId,
      platform,
      scheduledFor,
      status: scheduledFor && scheduledFor > new Date() ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      campaignId,
      createdById: req.user?.id,
      tags,
      isRepost: isRepost || false,
      originalPostId
    });

    return res.status(201).json({
      message: 'Social media post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating social media post:', error);
    return res.status(500).json({
      message: 'Server error while creating social media post',
      error: (error as Error).message
    });
  }
};

export const updateSocialMediaPost = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const {
      content,
      mediaUrls,
      scheduledFor,
      status,
      campaignId,
      tags
    } = req.body;

    // Find the post
    const post = await SocialMediaPost.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Social media post not found' });
    }

    // Check if post can be updated
    if (post.status === PostStatus.PUBLISHED) {
      return res.status(400).json({ message: 'Cannot update a published post' });
    }

    // Update status validation
    let newStatus = status;
    if (newStatus === PostStatus.SCHEDULED && !scheduledFor) {
      return res.status(400).json({ message: 'scheduledFor date is required for scheduled status' });
    }

    // If moving from draft to scheduled, ensure scheduledFor is set
    if (post.status === PostStatus.DRAFT && newStatus === PostStatus.SCHEDULED && !scheduledFor && !post.scheduledFor) {
      return res.status(400).json({ message: 'scheduledFor date is required for scheduled status' });
    }

    // Update the post
    await post.update({
      content: content || post.content,
      mediaUrls: mediaUrls || post.mediaUrls,
      scheduledFor: scheduledFor || post.scheduledFor,
      status: newStatus || post.status,
      campaignId: campaignId !== undefined ? campaignId : post.campaignId,
      tags: tags || post.tags
    });

    return res.status(200).json({
      message: 'Social media post updated successfully',
      post
    });
  } catch (error) {
    console.error('Error updating social media post:', error);
    return res.status(500).json({
      message: 'Server error while updating social media post',
      error: (error as Error).message
    });
  }
};

export const deleteSocialMediaPost = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Find the post
    const post = await SocialMediaPost.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Social media post not found' });
    }

    // Check if post can be deleted
    if (post.status === PostStatus.PUBLISHED) {
      // For published posts, mark as deleted in our system but don't try to remove from social media
      await post.update({ status: PostStatus.DELETED });
      
      return res.status(200).json({
        message: 'Published post marked as deleted'
      });
    }

    // Soft delete (paranoid is true for this model)
    await post.destroy();

    return res.status(200).json({
      message: 'Social media post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social media post:', error);
    return res.status(500).json({
      message: 'Server error while deleting social media post',
      error: (error as Error).message
    });
  }
};

export const publishSocialMediaPost = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Find the post
    const post = await SocialMediaPost.findByPk(postId, {
      include: [
        {
          model: SocialMediaAccount,
          attributes: ['id', 'name', 'accountUsername', 'platform', 'accessToken', 'refreshToken']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ message: 'Social media post not found' });
    }

    // Check if post can be published
    if (post.status !== PostStatus.DRAFT && post.status !== PostStatus.SCHEDULED) {
      return res.status(400).json({ 
        message: `Post cannot be published from ${post.status} status` 
      });
    }

    // Check if we have a valid social media account with access token
    if (!post.socialMediaAccount || !post.socialMediaAccount.accessToken) {
      return res.status(400).json({ 
        message: 'Social media account does not have valid access credentials' 
      });
    }

    // In a real implementation, here you would use the appropriate social media API
    // to publish the post. This is just a placeholder.
    
    // Simulate a successful post
    const postResponse = {
      success: true,
      postId: `post_${Date.now()}`,
      postUrl: `https://${post.platform}.com/${post.socialMediaAccount.accountUsername}/status/${Date.now()}`
    };

    // Update post with published info
    await post.update({
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      postId: postResponse.postId,
      postUrl: postResponse.postUrl,
      engagementMetrics: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        impressions: 0,
        reach: 0,
        lastUpdated: new Date()
      }
    });

    return res.status(200).json({
      message: 'Social media post published successfully',
      post
    });
  } catch (error) {
    console.error('Error publishing social media post:', error);
    return res.status(500).json({
      message: 'Server error while publishing social media post',
      error: (error as Error).message
    });
  }
};

export const updatePostEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const { metrics } = req.body;

    // Validate metrics
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ message: 'Valid metrics object is required' });
    }

    // Find the post
    const post = await SocialMediaPost.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Social media post not found' });
    }

    // Check if post is published
    if (post.status !== PostStatus.PUBLISHED) {
      return res.status(400).json({ message: 'Cannot update metrics for unpublished post' });
    }

    // Prepare updated metrics
    const updatedMetrics: PostEngagementMetrics = {
      likes: metrics.likes !== undefined ? metrics.likes : (post.engagementMetrics?.likes || 0),
      comments: metrics.comments !== undefined ? metrics.comments : (post.engagementMetrics?.comments || 0),
      shares: metrics.shares !== undefined ? metrics.shares : (post.engagementMetrics?.shares || 0),
      saves: metrics.saves !== undefined ? metrics.saves : (post.engagementMetrics?.saves || 0),
      clicks: metrics.clicks !== undefined ? metrics.clicks : (post.engagementMetrics?.clicks || 0),
      impressions: metrics.impressions !== undefined ? metrics.impressions : (post.engagementMetrics?.impressions || 0),
      reach: metrics.reach !== undefined ? metrics.reach : (post.engagementMetrics?.reach || 0),
      lastUpdated: new Date()
    };

    // Update the post
    await post.update({
      engagementMetrics: updatedMetrics
    });

    return res.status(200).json({
      message: 'Post engagement metrics updated successfully',
      metrics: updatedMetrics
    });
  } catch (error) {
    console.error('Error updating post engagement metrics:', error);
    return res.status(500).json({
      message: 'Server error while updating post engagement metrics',
      error: (error as Error).message
    });
  }
}; 