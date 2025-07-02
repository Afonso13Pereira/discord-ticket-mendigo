const mongoose = require('mongoose');

// Schemas
const TicketStateSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  ticketNumber: { type: Number, required: true },
  ownerTag: { type: String, required: true },
  ownerId: { type: String, required: true },
  category: { type: String, required: true },
  gwType: { type: String, default: null },
  vipType: { type: String, default: null },
  vipCasino: { type: String, default: null },
  vipId: { type: String, default: null },
  casino: { type: String, default: null },
  step: { type: Number, default: 0 },
  awaitConfirm: { type: Boolean, default: false },
  awaitProof: { type: Boolean, default: false },
  awaitDescription: { type: Boolean, default: false },
  prize: { type: String, default: null },
  telegramCode: { type: String, default: null },
  telegramHasImg: { type: Boolean, default: false },
  step4HasImg: { type: Boolean, default: false },
  step4HasAddr: { type: Boolean, default: false },
  ltcAddress: { type: String, default: null },
  description: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PromotionSchema = new mongoose.Schema({
  promoId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  endDate: { type: String, required: true },
  casino: { type: String, required: true },
  color: { type: String, default: 'grey' },
  emoji: { type: String, default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  categoryId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, default: 'grey' },
  emoji: { type: String, default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const ActionLogSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

const TranscriptSchema = new mongoose.Schema({
  transcriptId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  channelName: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  ownerTag: { type: String, required: true },
  ownerId: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// NOVO: Schema para contadores por categoria
const CategoryCounterSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 }
});

const SubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },
  messageId: { type: String, default: null }, // CORREÇÃO: Não obrigatório
  channelId: { type: String, default: null }, // CORREÇÃO: Não obrigatório
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  gwType: { type: String, required: true },
  casino: { type: String, default: null },
  prize: { type: String, default: null },
  ltcAddress: { type: String, default: null },
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  createdAt: { type: Date, default: Date.now }
});

const ApprovalSchema = new mongoose.Schema({
  approvalId: { type: String, required: true, unique: true },
  messageId: { type: String, default: null }, // CORREÇÃO: Não obrigatório
  channelId: { type: String, default: null }, // CORREÇÃO: Não obrigatório
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  casino: { type: String, required: true },
  prize: { type: String, required: true },
  ltcAddress: { type: String, required: true },
  status: { type: String, default: 'pending' }, // pending, paid, review
  createdAt: { type: Date, default: Date.now }
});

// Add index for automatic deletion
TranscriptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

class DatabaseManager {
  constructor() {
    this.connected = false;
    this.TicketState = null;
    this.Promotion = null;
    this.Category = null;
    this.ActionLog = null;
    this.Transcript = null;
    this.CategoryCounter = null;
    this.Submission = null;
    this.Approval = null;
    this.connect();
  }

  async connect() {
    try {
      const mongoUri = 'mongodb+srv://franciscop2004:MendigoTVAPI@mendigoapi.b8mvaps.mongodb.net/mendigo';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      // Create models with collection names in DiscordBot folder structure
      this.TicketState = mongoose.model('TicketState', TicketStateSchema, 'DiscordBot.ticketStates');
      this.Promotion = mongoose.model('Promotion', PromotionSchema, 'DiscordBot.promotions');
      this.Category = mongoose.model('Category', CategorySchema, 'DiscordBot.categories');
      this.ActionLog = mongoose.model('ActionLog', ActionLogSchema, 'DiscordBot.actionLogs');
      this.Transcript = mongoose.model('Transcript', TranscriptSchema, 'DiscordBot.transcripts');
      this.CategoryCounter = mongoose.model('CategoryCounter', CategoryCounterSchema, 'DiscordBot.categoryCounters');
      this.Submission = mongoose.model('Submission', SubmissionSchema, 'DiscordBot.submissions');
      this.Approval = mongoose.model('Approval', ApprovalSchema, 'DiscordBot.approvals');

      this.connected = true;
      console.log('✅ Connected to MongoDB (mendigo/DiscordBot)');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      this.connected = false;
    }
  }

  // === CATEGORY COUNTERS ===
  async getNextTicketNumberForCategory(category) {
    if (!this.connected) return 1;
    
    try {
      const counter = await this.CategoryCounter.findOneAndUpdate(
        { category },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
      
      return counter.count;
    } catch (error) {
      console.error('Error getting next ticket number for category:', error);
      return Date.now() % 10000; // Fallback
    }
  }

  // === TICKET STATES ===
  async saveTicketState(channelId, state) {
    if (!this.connected) return;
    
    try {
      await this.TicketState.findOneAndUpdate(
        { channelId },
        {
          channelId,
          ticketNumber: state.ticketNumber || 0,
          ownerTag: state.ownerTag || null,
          ownerId: state.ownerId || null,
          category: state.category || 'unknown',
          gwType: state.gwType || null,
          vipType: state.vipType || null,
          vipCasino: state.vipCasino || null,
          vipId: state.vipId || null,
          casino: state.casino || null,
          step: state.step || 0,
          awaitConfirm: state.awaitConfirm || false,
          awaitProof: state.awaitProof || false,
          awaitDescription: state.awaitDescription || false,
          prize: state.prize || null,
          telegramCode: state.telegramCode || null,
          telegramHasImg: state.telegramHasImg || false,
          step4HasImg: state.step4HasImg || false,
          step4HasAddr: state.step4HasAddr || false,
          ltcAddress: state.ltcAddress || null,
          description: state.description || null,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving ticket state:', error);
    }
  }

  async getTicketState(channelId) {
    if (!this.connected) return null;
    
    try {
      const doc = await this.TicketState.findOne({ channelId });
      if (!doc) return null;
      
      return {
        ticketNumber: doc.ticketNumber,
        ownerTag: doc.ownerTag,
        ownerId: doc.ownerId,
        category: doc.category,
        gwType: doc.gwType,
        vipType: doc.vipType,
        vipCasino: doc.vipCasino,
        vipId: doc.vipId,
        casino: doc.casino,
        step: doc.step,
        awaitConfirm: doc.awaitConfirm,
        awaitProof: doc.awaitProof,
        awaitDescription: doc.awaitDescription,
        prize: doc.prize,
        telegramCode: doc.telegramCode,
        telegramHasImg: doc.telegramHasImg,
        step4HasImg: doc.step4HasImg,
        step4HasAddr: doc.step4HasAddr,
        ltcAddress: doc.ltcAddress,
        description: doc.description
      };
    } catch (error) {
      console.error('Error getting ticket state:', error);
      return null;
    }
  }

  async deleteTicketState(channelId) {
    if (!this.connected) return;
    
    try {
      await this.TicketState.deleteOne({ channelId });
    } catch (error) {
      console.error('Error deleting ticket state:', error);
    }
  }

  async getAllTicketStates() {
    if (!this.connected) return new Map();
    
    try {
      const docs = await this.TicketState.find({});
      const states = new Map();
      
      docs.forEach(doc => {
        states.set(doc.channelId, {
          ticketNumber: doc.ticketNumber,
          ownerTag: doc.ownerTag,
          ownerId: doc.ownerId,
          category: doc.category,
          gwType: doc.gwType,
          vipType: doc.vipType,
          vipCasino: doc.vipCasino,
          vipId: doc.vipId,
          casino: doc.casino,
          step: doc.step,
          awaitConfirm: doc.awaitConfirm,
          awaitProof: doc.awaitProof,
          awaitDescription: doc.awaitDescription,
          prize: doc.prize,
          telegramCode: doc.telegramCode,
          telegramHasImg: doc.telegramHasImg,
          step4HasImg: doc.step4HasImg,
          step4HasAddr: doc.step4HasAddr,
          ltcAddress: doc.ltcAddress,
          description: doc.description
        });
      });
      
      return states;
    } catch (error) {
      console.error('Error getting all ticket states:', error);
      return new Map();
    }
  }

  // === SUBMISSIONS ===
  async saveSubmission(ticketChannelId, ticketNumber, userId, userTag, gwType, casino = null, prize = null, ltcAddress = null) {
    if (!this.connected) return null;
    
    try {
      const submissionId = require('crypto').randomUUID().slice(0, 12);
      
      const submission = new this.Submission({
        submissionId,
        ticketChannelId,
        ticketNumber,
        userId,
        userTag,
        gwType,
        casino,
        prize,
        ltcAddress
        // messageId e channelId são opcionais agora
      });
      
      await submission.save();
      return submissionId;
    } catch (error) {
      console.error('Error saving submission:', error);
      return null;
    }
  }

  async getSubmission(submissionId) {
    if (!this.connected) return null;
    
    try {
      const doc = await this.Submission.findOne({ submissionId });
      if (!doc) return null;
      
      return {
        submissionId: doc.submissionId,
        messageId: doc.messageId,
        channelId: doc.channelId,
        ticketChannelId: doc.ticketChannelId,
        ticketNumber: doc.ticketNumber,
        userId: doc.userId,
        userTag: doc.userTag,
        gwType: doc.gwType,
        casino: doc.casino,
        prize: doc.prize,
        ltcAddress: doc.ltcAddress,
        status: doc.status,
        createdAt: doc.createdAt
      };
    } catch (error) {
      console.error('Error getting submission:', error);
      return null;
    }
  }

  async updateSubmission(submissionId, messageId, channelId, status = 'pending') {
    if (!this.connected) return;
    
    try {
      const updateData = { status };
      if (messageId) updateData.messageId = messageId;
      if (channelId) updateData.channelId = channelId;
      
      await this.Submission.findOneAndUpdate(
        { submissionId },
        updateData,
        { new: true }
      );
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  }

  // === APPROVALS ===
  async saveApproval(ticketChannelId, ticketNumber, userId, userTag, casino, prize, ltcAddress) {
    if (!this.connected) return null;
    
    try {
      const approvalId = require('crypto').randomUUID().slice(0, 12);
      
      const approval = new this.Approval({
        approvalId,
        ticketChannelId,
        ticketNumber,
        userId,
        userTag,
        casino,
        prize,
        ltcAddress
        // messageId e channelId são opcionais agora
      });
      
      await approval.save();
      return approvalId;
    } catch (error) {
      console.error('Error saving approval:', error);
      return null;
    }
  }

  async getApproval(approvalId) {
    if (!this.connected) return null;
    
    try {
      const doc = await this.Approval.findOne({ approvalId });
      if (!doc) return null;
      
      return {
        approvalId: doc.approvalId,
        messageId: doc.messageId,
        channelId: doc.channelId,
        ticketChannelId: doc.ticketChannelId,
        ticketNumber: doc.ticketNumber,
        userId: doc.userId,
        userTag: doc.userTag,
        casino: doc.casino,
        prize: doc.prize,
        ltcAddress: doc.ltcAddress,
        status: doc.status,
        createdAt: doc.createdAt
      };
    } catch (error) {
      console.error('Error getting approval:', error);
      return null;
    }
  }

  async updateApproval(approvalId, messageId, channelId, status = 'pending') {
    if (!this.connected) return;
    
    try {
      const updateData = { status };
      if (messageId) updateData.messageId = messageId;
      if (channelId) updateData.channelId = channelId;
      
      await this.Approval.findOneAndUpdate(
        { approvalId },
        updateData,
        { new: true }
      );
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  }

  // === STATISTICS ===
  async getTicketStatistics() {
    if (!this.connected) return null;
    
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Tickets criados por período
      const ticketsLast1Day = await this.TicketState.countDocuments({ createdAt: { $gte: oneDayAgo } });
      const ticketsLast2Days = await this.TicketState.countDocuments({ createdAt: { $gte: twoDaysAgo } });
      const ticketsLast7Days = await this.TicketState.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
      const ticketsLast30Days = await this.TicketState.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      // Tickets por categoria (últimos 30 dias)
      const ticketsByCategory = await this.TicketState.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Submissões pendentes
      const pendingSubmissions = await this.Submission.countDocuments({ status: 'pending' });
      const approvedSubmissions = await this.Submission.countDocuments({ status: 'approved' });
      const rejectedSubmissions = await this.Submission.countDocuments({ status: 'rejected' });

      // Aprovações pendentes
      const pendingApprovals = await this.Approval.countDocuments({ status: 'pending' });
      const paidApprovals = await this.Approval.countDocuments({ status: 'paid' });
      const reviewApprovals = await this.Approval.countDocuments({ status: 'review' });

      // Tickets ativos (ainda não fechados)
      const activeTickets = await this.TicketState.countDocuments({});

      // Transcripts criados (últimos 30 dias)
      const transcriptsCreated = await this.Transcript.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      // Contadores por categoria
      const categoryCounters = await this.CategoryCounter.find({}).sort({ count: -1 });

      return {
        ticketsPeriod: {
          last1Day: ticketsLast1Day,
          last2Days: ticketsLast2Days,
          last7Days: ticketsLast7Days,
          last30Days: ticketsLast30Days
        },
        ticketsByCategory,
        submissions: {
          pending: pendingSubmissions,
          approved: approvedSubmissions,
          rejected: rejectedSubmissions,
          total: pendingSubmissions + approvedSubmissions + rejectedSubmissions
        },
        approvals: {
          pending: pendingApprovals,
          paid: paidApprovals,
          review: reviewApprovals,
          total: pendingApprovals + paidApprovals + reviewApprovals
        },
        activeTickets,
        transcriptsCreated,
        categoryCounters: categoryCounters.map(c => ({ category: c.category, count: c.count }))
      };
    } catch (error) {
      console.error('Error getting ticket statistics:', error);
      return null;
    }
  }

  // === PROMOTIONS ===
  async savePromotion(id, promo) {
    if (!this.connected) return;
    
    try {
      await this.Promotion.findOneAndUpdate(
        { promoId: id },
        {
          promoId: id,
          name: promo.name,
          endDate: promo.end,
          casino: promo.casino,
          color: promo.color || 'grey',
          emoji: promo.emoji,
          active: promo.active
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  }

  async getPromotions() {
    if (!this.connected) return {};
    
    try {
      console.log('🔍 Database: Getting promotions from MongoDB...');
      const docs = await this.Promotion.find({});
      const promos = {};
      
      console.log(`🔍 Database: Found ${docs.length} promotion documents`);
      
      docs.forEach(doc => {
        promos[doc.promoId] = {
          name: doc.name,
          end: doc.endDate,
          casino: doc.casino,
          color: doc.color,
          emoji: doc.emoji,
          active: doc.active,
          created: doc.createdAt.getTime()
        };
        console.log(`  📋 Promotion: ${doc.name} (${doc.promoId}) - active: ${doc.active}`);
      });
      
      console.log(`✅ Database: Returning ${Object.keys(promos).length} promotions`);
      return promos;
    } catch (error) {
      console.error('❌ Database: Error getting promotions:', error);
      return {};
    }
  }

  // === CATEGORIES ===
  async saveCategory(id, category) {
    if (!this.connected) return;
    
    try {
      console.log(`💾 Database: Saving category ${category.name} (${id}) to MongoDB...`);
      
      const result = await this.Category.findOneAndUpdate(
        { categoryId: id },
        {
          categoryId: id,
          name: category.name,
          color: category.color || 'grey',
          emoji: category.emoji,
          active: category.active
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Database: Category saved successfully:`, result.categoryId);
    } catch (error) {
      console.error('❌ Database: Error saving category:', error);
    }
  }

  async getCategories() {
    if (!this.connected) return {};
    
    try {
      console.log('🔍 Database: Getting categories from MongoDB...');
      const docs = await this.Category.find({});
      const cats = {};
      
      console.log(`🔍 Database: Found ${docs.length} category documents`);
      
      docs.forEach(doc => {
        cats[doc.categoryId] = {
          name: doc.name,
          color: doc.color,
          emoji: doc.emoji,
          active: doc.active,
          created: doc.createdAt.getTime()
        };
        console.log(`  📋 Category: ${doc.name} (${doc.categoryId}) - active: ${doc.active}`);
      });
      
      console.log(`✅ Database: Returning ${Object.keys(cats).length} categories`);
      return cats;
    } catch (error) {
      console.error('❌ Database: Error getting categories:', error);
      return {};
    }
  }

  // === TRANSCRIPTS ===
  async saveTranscript(channelId, channelName, ticketNumber, ownerTag, ownerId, category, content, expirationDays = 14) {
    if (!this.connected) return null;
    
    try {
      const transcriptId = require('crypto').randomUUID().slice(0, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const transcript = new this.Transcript({
        transcriptId,
        channelId,
        channelName,
        ticketNumber,
        ownerTag,
        ownerId,
        category,
        content,
        expiresAt
      });
      
      await transcript.save();
      return transcriptId;
    } catch (error) {
      console.error('Error saving transcript:', error);
      return null;
    }
  }

  async getTranscript(transcriptId) {
    if (!this.connected) return null;
    
    try {
      const doc = await this.Transcript.findOne({ transcriptId });
      if (!doc) return null;
      
      return {
        transcriptId: doc.transcriptId,
        channelId: doc.channelId,
        channelName: doc.channelName,
        ticketNumber: doc.ticketNumber,
        ownerTag: doc.ownerTag,
        ownerId: doc.ownerId,
        category: doc.category,
        content: doc.content,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      };
    } catch (error) {
      console.error('Error getting transcript:', error);
      return null;
    }
  }

  async cleanupExpiredTranscripts() {
    if (!this.connected) return 0;
    
    try {
      const result = await this.Transcript.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired transcripts:', error);
      return 0;
    }
  }

  // === LOGS ===
  async logAction(channelId, userId, action, details = null) {
    if (!this.connected) return;
    
    try {
      const log = new this.ActionLog({
        channelId,
        userId,
        action,
        details
      });
      
      await log.save();
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  // === CLEANUP ===
  async cleanupOldTickets(daysOld = 7) {
    if (!this.connected) return 0;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await this.TicketState.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old tickets:', error);
      return 0;
    }
  }

  async close() {
    if (this.connected) {
      await mongoose.connection.close();
      this.connected = false;
      console.log('🔌 MongoDB connection closed');
    }
  }
}

module.exports = DatabaseManager;