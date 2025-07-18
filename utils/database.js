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
  awaitTwitchNick: { type: Boolean, default: false },
  awaitLtcOnly: { type: Boolean, default: false },
  awaitingSupport: { type: Boolean, default: false }, // NOVO: Para pausar tickets
  websiteType: { type: String, default: null },
  twitchNick: { type: String, default: null },
  selectedRedeem: { type: String, default: null },
  bcGameId: { type: String, default: null },
  prize: { type: String, default: null },
  telegramCode: { type: String, default: null },
  ltcAddress: { type: String, default: null },
  description: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
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

const CategoryCounterSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 }
});

const SubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  gwType: { type: String, required: true },
  casino: { type: String, default: null },
  prize: { type: String, default: null },
  ltcAddress: { type: String, default: 'N/A' },
  bcGameId: { type: String, default: null },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const ApprovalSchema = new mongoose.Schema({
  approvalId: { type: String, required: true, unique: true },
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  casino: { type: String, required: true },
  prize: { type: String, required: true },
  ltcAddress: { type: String, required: true },
  bcGameId: { type: String, default: null },
  bcGameProfileImage: { type: String, default: null }, // NOVO: URL da imagem do perfil BCGame
  messageId: { type: String, default: null }, // NOVO: Campo para ID da mensagem de aprovação
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// NOVO: Remover índice problemático e criar um mais seguro
// ApprovalSchema.index({ messageId: 1 }, { sparse: true, background: true });
const RedeemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  twitchName: { type: String, required: true },
  redeemed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TelegramCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  ticketChannelId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userTag: { type: String, required: true },
  casino: { type: String, default: null },
  prize: { type: String, default: null },
  usedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'used' } // used, duplicate_attempt
});

// Add index for automatic deletion
TranscriptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

class DatabaseManager {
  constructor() {
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.TicketState = null;
    this.Promotion = null;
    this.Category = null;
    this.ActionLog = null;
    this.Transcript = null;
    this.CategoryCounter = null;
    this.Submission = null;
    this.Approval = null;
    this.Redeem = null;
    this.TelegramCode = null;
    this.connect();
  }

  async connect() {
    try {
      this.connectionAttempts++;
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://franciscop2004:MendigoTVAPI@mendigoapi.b8mvaps.mongodb.net/mendigo?retryWrites=true&w=majority';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true
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
      this.Redeem = mongoose.model('Redeem', RedeemSchema, 'reedems');
      this.TelegramCode = mongoose.model('TelegramCode', TelegramCodeSchema, 'DiscordBot.telegramCodes');

      this.connected = true;
      this.connectionAttempts = 0; // Reset on successful connection
      console.log('✅ Connected to MongoDB (mendigo/DiscordBot + reedems)');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      this.connected = false;
      
      // Retry connection after 5 seconds
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying connection in 5 seconds... (${this.connectionAttempts}/${this.maxRetries})`);
        setTimeout(() => {
          this.connect();
        }, 5000);
      }
    }
  }

  // === TELEGRAM CODES ===
  async checkTelegramCode(code) {
    if (!this.connected) return null;
    
    try {
      const existingCode = await this.TelegramCode.findOne({ code: code.toLowerCase() });
      return existingCode ? {
        code: existingCode.code,
        ticketChannelId: existingCode.ticketChannelId,
        ticketNumber: existingCode.ticketNumber,
        userId: existingCode.userId,
        userTag: existingCode.userTag,
        casino: existingCode.casino,
        prize: existingCode.prize,
        usedAt: existingCode.usedAt,
        status: existingCode.status
      } : null;
    } catch (error) {
      console.error('Error checking telegram code:', error);
      return null;
    }
  }

  async saveTelegramCode(code, ticketChannelId, ticketNumber, userId, userTag, casino = null, prize = null) {
    if (!this.connected) return false;
    
    try {
      const telegramCode = new this.TelegramCode({
        code: code.toLowerCase(),
        ticketChannelId,
        ticketNumber,
        userId,
        userTag,
        casino,
        prize
      });
      
      await telegramCode.save();
      return true;
    } catch (error) {
      console.error('Error saving telegram code:', error);
      return false;
    }
  }

  async markCodeAsDuplicateAttempt(code, attemptTicketId, attemptUserId, attemptUserTag) {
    if (!this.connected) return false;
    
    try {
      await this.TelegramCode.findOneAndUpdate(
        { code: code.toLowerCase() },
        { 
          status: 'duplicate_attempt'
        }
      );
      return true;
    } catch (error) {
      console.error('Error marking code as duplicate attempt:', error);
      return false;
    }
  }

  // === REDEEMS ===
  async getUserRedeems(twitchName) {
    if (!this.connected) return [];
    
    try {
      const redeems = await this.Redeem.find({ 
        twitchName: { $regex: new RegExp(`^${twitchName}$`, 'i') },
        redeemed: false 
      });
      
      return redeems.map(redeem => ({
        id: redeem._id.toString(),
        itemName: redeem.itemName,
        twitchName: redeem.twitchName,
        redeemed: redeem.redeemed,
        createdAt: redeem.createdAt
      }));
    } catch (error) {
      console.error('Error getting user redeems:', error);
      return [];
    }
  }

  async markRedeemAsCompleted(redeemId) {
    if (!this.connected) return false;
    
    try {
      const result = await this.Redeem.findByIdAndUpdate(
        redeemId,
        { 
          redeemed: true,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      return !!result;
    } catch (error) {
      console.error('Error marking redeem as completed:', error);
      return false;
    }
  }

  async getRedeemById(redeemId) {
    if (!this.connected) return null;
    
    try {
      const redeem = await this.Redeem.findById(redeemId);
      if (!redeem) return null;
      
      return {
        id: redeem._id.toString(),
        itemName: redeem.itemName,
        twitchName: redeem.twitchName,
        redeemed: redeem.redeemed,
        createdAt: redeem.createdAt
      };
    } catch (error) {
      console.error('Error getting redeem by ID:', error);
      return null;
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
          awaitTwitchNick: state.awaitTwitchNick || false,
          awaitLtcOnly: state.awaitLtcOnly || false,
          awaitingSupport: state.awaitingSupport || false,
          websiteType: state.websiteType || null,
          twitchNick: state.twitchNick || null,
          selectedRedeem: state.selectedRedeem || null,
          bcGameId: state.bcGameId || null,
          prize: state.prize || null,
          telegramCode: state.telegramCode || null,
          ltcAddress: state.ltcAddress || null,
          description: state.description || null,
          isVerified: state.isVerified || false,
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
        awaitTwitchNick: doc.awaitTwitchNick,
        awaitLtcOnly: doc.awaitLtcOnly,
        awaitingSupport: doc.awaitingSupport,
        websiteType: doc.websiteType,
        twitchNick: doc.twitchNick,
        selectedRedeem: doc.selectedRedeem,
        bcGameId: doc.bcGameId,
        prize: doc.prize,
        telegramCode: doc.telegramCode,
        ltcAddress: doc.ltcAddress,
        description: doc.description,
        isVerified: doc.isVerified
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
          awaitTwitchNick: doc.awaitTwitchNick,
          awaitLtcOnly: doc.awaitLtcOnly,
          awaitingSupport: doc.awaitingSupport,
          websiteType: doc.websiteType,
          twitchNick: doc.twitchNick,
          selectedRedeem: doc.selectedRedeem,
          bcGameId: doc.bcGameId,
          prize: doc.prize,
          telegramCode: doc.telegramCode,
          ltcAddress: doc.ltcAddress,
          description: doc.description,
          isVerified: doc.isVerified
        });
      });
      
      return states;
    } catch (error) {
      console.error('Error getting all ticket states:', error);
      return new Map();
    }
  }

  // === SUBMISSIONS ===
  async saveSubmission(ticketChannelId, ticketNumber, userId, userTag, gwType, casino = null, prize = null, ltcAddress = null, bcGameId = null) {
    if (!this.connected) return null;
    
    try {
      const submissionId = require('crypto').randomUUID().slice(0, 12);
      
      // CRÍTICO: Garantir que ltcAddress nunca seja null
      const finalLtcAddress = ltcAddress || 'N/A - Não fornecido';
      
      console.log('[DB][saveSubmission] Dados recebidos:');
      console.log('  - ticketChannelId:', ticketChannelId);
      console.log('  - ticketNumber:', ticketNumber);
      console.log('  - userId:', userId);
      console.log('  - userTag:', userTag);
      console.log('  - gwType:', gwType);
      console.log('  - casino:', casino);
      console.log('  - prize:', prize);
      console.log('  - ltcAddress original:', ltcAddress);
      console.log('  - ltcAddress final:', finalLtcAddress);
      console.log('  - bcGameId:', bcGameId);
      
      const submission = new this.Submission({
        submissionId,
        ticketChannelId,
        ticketNumber,
        userId,
        userTag,
        gwType,
        casino,
        prize,
        ltcAddress: finalLtcAddress,
        bcGameId
      });
      
      await submission.save();
      console.log('[DB][saveSubmission] Submission salva com sucesso, ID:', submissionId);
      return submissionId;
    } catch (error) {
      console.error('Error saving submission:', error);
      return null;
    }
  }

  async getSubmission(submissionId) {
    if (!this.connected) return null;
    
    try {
      console.log('[DB][getSubmission] Buscando submissionId:', submissionId);
      const doc = await this.Submission.findOne({ submissionId });
      if (!doc) {
        console.log('[DB][getSubmission] Submission não encontrada:', submissionId);
        return null;
      }
      
      console.log('[DB][getSubmission] Submission encontrada:', submissionId);
      console.log('[DB][getSubmission] ltcAddress na DB:', doc.ltcAddress);
      
      return {
        submissionId: doc.submissionId,
        ticketChannelId: doc.ticketChannelId,
        ticketNumber: doc.ticketNumber,
        userId: doc.userId,
        userTag: doc.userTag,
        gwType: doc.gwType,
        casino: doc.casino,
        prize: doc.prize,
        ltcAddress: doc.ltcAddress,
        bcGameId: doc.bcGameId,
        status: doc.status,
        createdAt: doc.createdAt
      };
    } catch (error) {
      console.error('Error getting submission:', error);
      return null;
    }
  }

  async updateSubmission(submissionId, status = 'pending') {
    if (!this.connected) return;
    
    try {
      await this.Submission.findOneAndUpdate(
        { submissionId },
        { status },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  }

  // === APPROVALS ===
  async saveApproval(ticketChannelId, ticketNumber, userId, userTag, casino, prize, ltcAddress, bcGameId = null, bcGameProfileImage = null) {
    if (!this.connected) return null;
    
    try {
      // Generate a more unique ID to avoid conflicts
      const approvalId = require('crypto').randomUUID().slice(0, 12);
      
      // CRÍTICO: Garantir que ltcAddress nunca seja null
      const finalLtcAddress = ltcAddress || 'N/A - Não fornecido';
      
      console.log('[DB][saveApproval] Dados recebidos:');
      console.log('  - ticketChannelId:', ticketChannelId);
      console.log('  - ticketNumber:', ticketNumber);
      console.log('  - userId:', userId);
      console.log('  - userTag:', userTag);
      console.log('  - casino:', casino);
      console.log('  - prize:', prize);
      console.log('  - ltcAddress original:', ltcAddress);
      console.log('  - ltcAddress final:', finalLtcAddress);
      console.log('  - bcGameId:', bcGameId);
      console.log('  - bcGameProfileImage:', bcGameProfileImage);
      console.log('  - messageId:', messageId);
      console.log('  - approvalId gerado:', approvalId);
      
      // Try to create approval with retry mechanism
      let attempts = 0;
      let approval = null;
      
      while (attempts < 3 && !approval) {
        try {
          const currentApprovalId = attempts > 0 ? require('crypto').randomUUID().slice(0, 12) : approvalId;
          
          approval = new this.Approval({
            approvalId: currentApprovalId,
            ticketChannelId,
            ticketNumber,
            userId,
            userTag,
            casino,
            prize,
            ltcAddress: finalLtcAddress,
            bcGameId,
            bcGameProfileImage
          });
          
          await approval.save();
          console.log('[DB][saveApproval] Approval salva com sucesso, ID:', currentApprovalId);
          return currentApprovalId;
          
        } catch (saveError) {
          attempts++;
          console.log(`[DB][saveApproval] Tentativa ${attempts} falhou:`, saveError.message);
          
          if (attempts >= 3) {
            throw saveError;
          }
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error saving approval:', error);
      
      // If it's a duplicate key error, try to clean up and retry once more
      if (error.code === 11000) {
        console.log('[DB][saveApproval] Duplicate key error, tentando limpeza...');
        try {
          // Try to remove any problematic entries with null messageId
          await this.Approval.deleteMany({ 
            approvalId: { $regex: /^temp_/ }, // Remove temporary entries
            status: 'pending'
          });
          
          // Retry once more
          const retryApprovalId = require('crypto').randomUUID().slice(0, 12);
          const retryApproval = new this.Approval({
            approvalId: retryApprovalId,
            ticketChannelId,
            ticketNumber,
            userId,
            userTag,
            casino,
            prize,
            ltcAddress: finalLtcAddress,
            bcGameId,
            bcGameProfileImage
          });
          
          await retryApproval.save();
          console.log('[DB][saveApproval] Retry bem-sucedido, ID:', retryApprovalId);
          return retryApprovalId;
          
        } catch (retryError) {
          console.error('[DB][saveApproval] Retry também falhou:', retryError);
        }
      }
      
      return null;
    }
  }

  async getApproval(approvalId) {
    if (!this.connected) return null;
    
    try {
      console.log('[DB][getApproval] Buscando approvalId:', approvalId);
      const doc = await this.Approval.findOne({ approvalId });
      if (!doc) {
        console.log('[DB][getApproval] Approval não encontrada:', approvalId);
        return null;
      }
      
      console.log('[DB][getApproval] Approval encontrada:', doc.approvalId);
      console.log('[DB][getApproval] ltcAddress na DB:', doc.ltcAddress);
      
      return {
        approvalId: doc.approvalId,
        ticketChannelId: doc.ticketChannelId,
        ticketNumber: doc.ticketNumber,
        userId: doc.userId,
        userTag: doc.userTag,
        casino: doc.casino,
        prize: doc.prize,
        ltcAddress: doc.ltcAddress,
        bcGameId: doc.bcGameId,
        bcGameProfileImage: doc.bcGameProfileImage,
        status: doc.status,
        createdAt: doc.createdAt
      };
    } catch (error) {
      console.error('Error getting approval:', error);
      return null;
    }
  }

  async updateApproval(approvalId, status = 'pending', messageId = null) {
    if (!this.connected) return;
    
    try {
      const updateData = { status };
      if (messageId) {
        updateData.messageId = messageId;
      }
      
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
      console.error('❌ Database: Error getting promotions:', error);
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
      console.error('❌ Database: Error saving category:', error);
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

  async getUserTranscripts(userId, limit = 10, offset = 0) {
    if (!this.connected) return { transcripts: [], total: 0 };
    
    try {
      const [transcripts, total] = await Promise.all([
        this.Transcript.find({ ownerId: userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        this.Transcript.countDocuments({ ownerId: userId })
      ]);
      
      const formattedTranscripts = transcripts.map(doc => ({
        transcriptId: doc.transcriptId,
        channelId: doc.channelId,
        channelName: doc.channelName,
        ticketNumber: doc.ticketNumber,
        ownerTag: doc.ownerTag,
        ownerId: doc.ownerId,
        category: doc.category,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt,
        contentPreview: doc.content ? doc.content.substring(0, 100) + '...' : 'Sem conteúdo'
      }));
      
      return { transcripts: formattedTranscripts, total };
    } catch (error) {
      console.error('Error getting user transcripts:', error);
      return { transcripts: [], total: 0 };
    }
  }

  async getAllTranscripts(limit = 20, offset = 0, category = null) {
    if (!this.connected) return { transcripts: [], total: 0 };
    
    try {
      const query = category ? { category } : {};
      
      const [transcripts, total] = await Promise.all([
        this.Transcript.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        this.Transcript.countDocuments(query)
      ]);
      
      const formattedTranscripts = transcripts.map(doc => ({
        transcriptId: doc.transcriptId,
        channelId: doc.channelId,
        channelName: doc.channelName,
        ticketNumber: doc.ticketNumber,
        ownerTag: doc.ownerTag,
        ownerId: doc.ownerId,
        category: doc.category,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt,
        contentPreview: doc.content ? doc.content.substring(0, 100) + '...' : 'Sem conteúdo'
      }));
      
      return { transcripts: formattedTranscripts, total };
    } catch (error) {
      console.error('Error getting all transcripts:', error);
      return { transcripts: [], total: 0 };
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