const { SlashCommandBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embeds');
const ComponentFactory = require('../utils/components');
const CASINOS = require('../events/casinos');
const MESSAGES = require('../config/messages');

// Helper function to find casino ID by name (case-insensitive, supports partial matches)
function findCasinoId(name) {
  const normalizedName = name.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = Object.keys(CASINOS).find(id => id.toLowerCase() === normalizedName);
  if (exactMatch) return exactMatch;
  
  // Try partial match with label
  const partialMatch = Object.keys(CASINOS).find(id => {
    const casino = CASINOS[id];
    return casino.label.toLowerCase().includes(normalizedName) || 
           normalizedName.includes(casino.label.toLowerCase());
  });
  if (partialMatch) return partialMatch;
  
  // Try common aliases
  const aliases = {
    'bcgame': 'BCGame',
    'bc': 'BCGame',
    'leonbet': 'Leon Bet',
    'leon': 'Leon Bet',
    '1xbit': '1xBit',
    'hexabet': 'Hexabet',
    '96': '96',
    'lollyspins': 'Lollyspins',
    'rioace': 'Rioace'
  };
  
  if (aliases[normalizedName]) {
    return Object.keys(CASINOS).find(id => id === aliases[normalizedName] || CASINOS[id].label === aliases[normalizedName]);
  }
  
  return null;
}

// Helper function to check if user is verified for a casino
function isUserVerifiedForCasino(member, casino) {
  const casinoData = CASINOS[casino];
  if (!casinoData || !casinoData.cargoafiliado) {
    return false;
  }
  return member.roles.cache.has(casinoData.cargoafiliado);
}

// Function to start checklist for a casino
async function startChecklistForCasino(interaction, client, casinoId) {
  let ticketState = client.ticketStates.get(interaction.channel.id);
  
  // If no ticket state exists, create a basic one for giveaway
  if (!ticketState) {
    ticketState = {
      ticketNumber: 0,
      ownerTag: interaction.user.tag,
      ownerId: interaction.user.id,
      category: 'Giveaways',
      casino: casinoId,
      step: 0,
      awaitProof: true,
      isVerified: false
    };
    
    // Check if user is verified
    const verifiedCasinos = [];
    for (const [id, casinoData] of Object.entries(CASINOS)) {
      if (casinoData.cargoafiliado && interaction.member.roles.cache.has(casinoData.cargoafiliado)) {
        verifiedCasinos.push(id);
      }
    }
    if (verifiedCasinos.length > 0) {
      ticketState.isVerified = true;
    }
  } else {
    // Update existing ticket state (preserve ticketNumber and other important fields)
    ticketState.casino = casinoId;
    ticketState.step = 0;
    ticketState.awaitProof = true;
    ticketState.awaitLtcOnly = false;
    ticketState.awaitingCasinoSelection = false;
    ticketState.allowedCasinos = undefined;
  }
  
  // Validate casino exists and has checklist
  const casino = CASINOS[casinoId];
  if (!casino || !casino.checklist) {
    return interaction.followUp({
      embeds: [EmbedFactory.error('❌ **Casino não configurado corretamente!**\n\nO casino selecionado não possui checklist configurado.')],
      flags: 64
    });
  }
  
  // Check if user is verified for this casino
  const isVerified = isUserVerifiedForCasino(interaction.member, casinoId);
  
  if (isVerified && ticketState.isVerified) {
    // Verified user - skip checklist but ask for deposit + LTC
    ticketState.awaitProof = false;
    ticketState.awaitLtcOnly = true;
    ticketState.casino = casinoId;
    await client.saveTicketState(interaction.channel.id, ticketState);
    
    return interaction.followUp({
      embeds: [EmbedFactory.success(`✅ **Casino selecionado: ${casino.label}**\n\n${MESSAGES.GIVEAWAYS.VERIFIED_USER_SKIP}`)],
      flags: 64
    });
  } else {
    // Not verified - normal process
    ticketState.step = 0;
    ticketState.awaitProof = true;
    ticketState.awaitLtcOnly = false;
    ticketState.casino = casinoId;
    await client.saveTicketState(interaction.channel.id, ticketState);
    
    // Show first step of checklist (same logic as askChecklist)
    const stepIndex = 0;
    let stepDescription, stepImage;
    
    if (typeof casino.checklist[stepIndex] === 'object' && casino.checklist[stepIndex] !== null) {
      stepDescription = casino.checklist[stepIndex].description;
      stepImage = casino.checklist[stepIndex].image;
    } else {
      stepDescription = casino.checklist[stepIndex];
      stepImage = casino.images?.[stepIndex];
    }
    
    const embed = EmbedFactory.checklist(
      stepIndex + 1,
      casino.checklist.length,
      stepDescription,
      stepImage
    );
    
    const currentStep = casino.checklist[stepIndex];
    let stepTypes = [];
    if (typeof currentStep === 'object' && currentStep !== null && Array.isArray(currentStep.type)) {
      stepTypes = currentStep.type;
    }
    
    let components;
    if (stepTypes.length === 0) {
      components = [ComponentFactory.infoStepButtons()];
    } else {
      components = [ComponentFactory.stepButtons()];
    }
    
    await interaction.followUp({
      embeds: [embed],
      components: components
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startgiveaway')
    .setDescription('Iniciar checklist de giveaway para um ou mais casinos')
    .addStringOption(option =>
      option
        .setName('casino')
        .setDescription('Casino(s) - pode ser um casino, "todos", ou múltiplos separados por vírgula (ex: bcgame,leonbet)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: false });
      
      const casinoInput = interaction.options.getString('casino').trim();
      
      // Normalize input
      const normalizedInput = casinoInput.toLowerCase();
      
      // Check if it's "todos" or multiple casinos
      if (normalizedInput === 'todos' || normalizedInput === 'all') {
        // Show selection menu with all casinos
        await interaction.followUp({
          embeds: [EmbedFactory.casino(
            MESSAGES.GIVEAWAYS.CASINO_SELECTION_TITLE,
            MESSAGES.GIVEAWAYS.CASINO_SELECTION_DESCRIPTION
          )],
          components: [ComponentFactory.casinoSelectMenu(CASINOS)]
        });
        return;
      }
      
      // Check if it contains commas (multiple casinos)
      if (casinoInput.includes(',')) {
        const casinoNames = casinoInput.split(',').map(name => name.trim()).filter(name => name.length > 0);
        const validCasinos = {};
        
        // Validate and collect valid casinos
        for (const name of casinoNames) {
          const casinoId = findCasinoId(name);
          if (casinoId && CASINOS[casinoId]) {
            validCasinos[casinoId] = CASINOS[casinoId];
          }
        }
        
        if (Object.keys(validCasinos).length === 0) {
          return interaction.followUp({
            embeds: [EmbedFactory.error('❌ **Nenhum casino válido encontrado!**\n\nPor favor, verifique os nomes dos casinos e tente novamente.')],
            flags: 64
          });
        }
        
        // Show selection menu with filtered casinos
        await interaction.followUp({
          embeds: [EmbedFactory.casino(
            MESSAGES.GIVEAWAYS.CASINO_SELECTION_TITLE,
            `Selecione um dos seguintes casinos:\n${Object.values(validCasinos).map(c => `${c.emoji} ${c.label}`).join(', ')}`
          )],
          components: [ComponentFactory.casinoSelectMenu(validCasinos)]
        });
        
        // Store allowed casinos in ticket state for validation
        let ticketState = client.ticketStates.get(interaction.channel.id);
        if (!ticketState) {
          ticketState = {
            ticketNumber: 0,
            ownerTag: interaction.user.tag,
            ownerId: interaction.user.id,
            category: 'Giveaways',
            isVerified: false
          };
          
          // Check if user is verified
          for (const [id, casinoData] of Object.entries(CASINOS)) {
            if (casinoData.cargoafiliado && interaction.member.roles.cache.has(casinoData.cargoafiliado)) {
              ticketState.isVerified = true;
              break;
            }
          }
        }
        
        ticketState.awaitingCasinoSelection = true;
        ticketState.allowedCasinos = Object.keys(validCasinos);
        await client.saveTicketState(interaction.channel.id, ticketState);
        
        return;
      }
      
      // Single casino - start checklist directly
      const casinoId = findCasinoId(casinoInput);
      
      if (!casinoId || !CASINOS[casinoId]) {
        return interaction.followUp({
          embeds: [EmbedFactory.error(`❌ **Casino não encontrado!**\n\nO casino "${casinoInput}" não foi encontrado.\n\nCasinos disponíveis: ${Object.values(CASINOS).map(c => c.label).join(', ')}`)],
          flags: 64
        });
      }
      
      // Start checklist for the casino
      await startChecklistForCasino(interaction, client, casinoId);
      
    } catch (error) {
      console.error('Error in /startgiveaway command:', error);
      return interaction.followUp({
        embeds: [EmbedFactory.error('❌ **Erro ao executar comando!**\n\nOcorreu um erro ao iniciar o giveaway. Tente novamente ou contate o suporte.')],
        flags: 64
      });
    }
  }
};

