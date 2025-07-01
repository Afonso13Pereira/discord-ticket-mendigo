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

const TicketCounterSchema = new mongoose.Schema({
  _id: { type: String, default: 'ticket_counter' },
  count: { type: Number, default: 0 }
});

const ApprovalSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  gwType: { type: String, required: true },
  casino: { type: String, default: null },
  prize: { type: String, default: null },
  approved: { type: Boolean, default: false },
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
    this.TicketCounter = null;
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
      this.TicketCounter = mongoose.model('TicketCounter', TicketCounterSchema, 'DiscordBot.ticketCounter');
      this.Approval = mongoose.model('Approval', ApprovalSchema, 'DiscordBot.approvals');

      this.connected = true;
      console.log('✅ Connected to MongoDB (mendigo/DiscordBot)');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      this.connected = false;
    }
  }

  // === TICKET COUNTER ===
  async getNextTicketNumber() {
    if (!this.connected) return 1;
    
    try {
      const counter = await this.TicketCounter.findOneAndUpdate(
        { _id: 'ticket_counter' },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
      
      return counter.count;
    } catch (error) {
      console.error('Error getting next ticket number:', error);
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
      const docs = await this.Promotion.find({});
      const promos = {};
      
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
      });
      
      return promos;
    } catch (error) {
      console.error('Error getting promotions:', error);
      return {};
    }
  }

  // === CATEGORIES ===
  async saveCategory(id, category) {
    if (!this.connected) return;
    
    try {
      await this.Category.findOneAndUpdate(
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
    } catch (error) {
      console.error('Error saving category:', error);
    }
  }

  async getCategories() {
    if (!this.connected) return {};
    
    try {
      const docs = await this.Category.find({});
      const cats = {};
      
      docs.forEach(doc => {
        cats[doc.categoryId] = {
          name: doc.name,
          color: doc.color,
          emoji: doc.emoji,
          active: doc.active,
          created: doc.createdAt.getTime()
        };
      });
      
      return cats;
    } catch (error) {
      console.error('Error getting categories:', error);
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

  // === APPROVALS ===
  async saveApproval(messageId, channelId, ticketChannelId, ticketNumber, userId, userTag, gwType, casino = null, prize = null) {
    if (!this.connected) return;
    
    try {
      const approval = new this.Approval({
        messageId,
        channelId,
        ticketChannelId,
        ticketNumber,
        userId,
        userTag,
        gwType,
        casino,
        prize
      });
      
      await approval.save();
    } catch (error) {
      console.error('Error saving approval:', error);
    }
  }

  async getApproval(messageId) {
    if (!this.connected) return null;
    
    try {
      const doc = await this.Approval.findOne({ messageId });
      if (!doc) return null;
      
      return {
        messageId: doc.messageId,
        channelId: doc.channelId,
        ticketChannelId: doc.ticketChannelId,
        ticketNumber: doc.ticketNumber,
        userId: doc.userId,
        userTag: doc.userTag,
        gwType: doc.gwType,
        casino: doc.casino,
        prize: doc.prize,
        approved: doc.approved,
        createdAt: doc.createdAt
      };
    } catch (error) {
      console.error('Error getting approval:', error);
      return null;
    }
  }

  async updateApproval(messageId, approved = true) {
    if (!this.connected) return;
    
    try {
      await this.Approval.findOneAndUpdate(
        { messageId },
        { approved },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating approval:', error);
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